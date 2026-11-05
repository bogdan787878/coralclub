/**
 * From the landing's own cart straight into the shop's checkout.
 *
 * On coralclub.ru the landing lives on the shop's own origin, so the cart can
 * be handed over from the page itself, with the visitor's cookies:
 *   1. empty the shop's session basket (so pressing «Оформить» twice, or
 *      coming back, never doubles the quantities);
 *   2. put our lines into it — the «Друг клуба» link marks the session, prices
 *      become club prices, no registration is needed;
 *   3. open /checkout/ — the basket page is skipped.
 *
 * Anywhere else (GitHub Pages, localhost) the shop cannot be reached from the
 * page, so the visitor is sent to the shop's basket by a link carrying the
 * same cart (one more click: «Оформить» there).
 */
import {
  FRIEND_REF_CODE,
  FRIEND_USER_ID,
  friendBasketUrl,
} from "./beautySystem";
import type { CartLine } from "./cart";

/** Empty the shop's basket before adding our lines (idempotent hand-off). */
const REPLACE_SHOP_BASKET = true;

const FRIEND_QUERY = `&REF_CODE=${FRIEND_REF_CODE}&langss=ru&user=${FRIEND_USER_ID}&f=y`;

/** The page is served by the shop itself (coralclub.ru, or the local proxy). */
function onShopOrigin(): boolean {
  const { hostname, port } = window.location;
  return (
    hostname === "coralclub.ru" ||
    hostname.endsWith(".coralclub.ru") ||
    (hostname === "localhost" && port === "3200")
  );
}

async function emptyShopBasket(): Promise<void> {
  const html = await (
    await fetch("/basket/", { credentials: "same-origin" })
  ).text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const items = [
    ...doc.querySelectorAll<HTMLElement>(".basket-member__basic-item"),
  ];
  if (!items.length) return;
  const body = new URLSearchParams();
  items.forEach((el, i) => {
    body.append(`basket_products[${i}][basket_id]`, el.dataset.basket_id ?? "");
    body.append(`basket_products[${i}][member_id]`, el.dataset.member ?? "");
    body.append(`basket_products[${i}][vendor_code]`, el.dataset.code ?? "");
  });
  body.append("basket_count", String(items.length));
  body.append("basket_member_count", "1");
  await fetch("/ajax/deleteBasketItems.php", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body,
  });
}

/** Opens the shop's checkout with these lines (same tab). */
export async function openShopCheckout(lines: CartLine[]): Promise<void> {
  const valid = lines.filter((l) => l.coralId && l.qty > 0);
  if (!valid.length) return;

  if (!onShopOrigin()) {
    window.location.assign(friendBasketUrl(valid));
    return;
  }

  try {
    if (REPLACE_SHOP_BASKET) await emptyShopBasket();
    const pairs = valid.map((l) => `${encodeURIComponent(l.coralId)}=${l.qty}`);
    await fetch(`/shop/shop_basket.php?${pairs.join("&")}${FRIEND_QUERY}`, {
      credentials: "same-origin",
    });
    // /checkout/ is a coralclub.ru shop page, not a route of this app
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/checkout/");
  } catch {
    // the hand-over failed half-way: fall back to the basket link
    window.location.assign(friendBasketUrl(valid));
  }
}
