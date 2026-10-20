/**
 * Calls to the US shop's own checkout API (/sv-api/*), made from the page.
 * They work only on the shop's origin: on coralclub.us itself, or through the
 * local proxy (`npm run dev:proxy`, http://localhost:3200) that makes the shop
 * look like the page's own domain. Every request names its site in a header,
 * so overlapping requests can never end up on another site's session.
 */

export const SHOP_SITE = "coralclub.us";
const LANGUAGE = "us";

/** The page is served by the shop (or its local proxy): its API can be called. */
export function onShopOrigin(): boolean {
  if (typeof window === "undefined") return false;
  const { hostname, port } = window.location;
  return (
    hostname === SHOP_SITE ||
    hostname.endsWith(`.${SHOP_SITE}`) ||
    (hostname === "localhost" && port === "3200")
  );
}

/** Nested params → `a[b]=c&…`, the way the shop's own client sends them. */
export function qs(params: Record<string, unknown>): string {
  const out: string[] = [];
  const add = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (typeof value === "object") {
      for (const [k, v] of Object.entries(value as object))
        add(`${key}[${k}]`, v);
    } else {
      out.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      );
    }
  };
  for (const [k, v] of Object.entries(params)) add(k, v);
  return out.join("&");
}

export function shopFetch(url: string, init: RequestInit = {}) {
  return fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    ...init,
    headers: {
      "x-shop-site": SHOP_SITE,
      ...((init.headers as Record<string, string> | undefined) ?? {}),
    },
  });
}

/** GET /sv-api<path> → JSON; a non-JSON body becomes `{ error }`. */
export async function api<T = unknown>(
  path: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const r = await shopFetch(
    `/sv-api${path}?${qs({ ...params, language: LANGUAGE })}`,
  );
  const text = await r.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return {
      error: `The shop answered with something other than JSON (HTTP ${r.status}) for ${path}`,
    } as T;
  }
}

/** Empty the shop's session basket (so a re-sync never doubles quantities). */
export async function emptyShopBasket(): Promise<void> {
  const html = await (await shopFetch("/basket/")).text();
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
  await shopFetch("/ajax/deleteBasketItems.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body,
  });
}

/**
 * Put these lines into the shop's basket, tied to the friend's REF_CODE: the
 * session is marked «friend of the club» — member prices, no sign-up, and the
 * order is counted for that member.
 */
export async function fillShopBasket(
  lines: { coralId: string; qty: number }[],
  friend: { refCode: string; memberId: string },
): Promise<void> {
  const pairs = lines
    .filter((l) => l.qty > 0)
    .map((l) => `${encodeURIComponent(l.coralId)}=${l.qty}`);
  if (!pairs.length) return;
  await shopFetch(
    `/shop/shop_basket.php?${pairs.join("&")}&REF_CODE=${encodeURIComponent(
      friend.refCode,
    )}&langss=${LANGUAGE}&user=${encodeURIComponent(friend.memberId)}&f=y`,
  );
}

export const language = LANGUAGE;

/**
 * Basket syncs run strictly one after another: two overlapping runs (a
 * double-mounted effect, a quick quantity change) would each empty and fill
 * the same session basket and leave every line doubled.
 */
let basketQueue: Promise<unknown> = Promise.resolve();
export function enqueueBasketSync<T>(job: () => Promise<T>): Promise<T> {
  const run = basketQueue.then(job, job);
  basketQueue = run.catch(() => undefined);
  return run;
}

/**
 * Requests made by the browser itself (a frame, a page change) carry no
 * `x-shop-site` header; the local proxy then falls back to this cookie.
 * Pin it to the US site, or those requests would land on the Russian one.
 */
export function pinShopSite(): void {
  if (typeof document === "undefined") return;
  if (window.location.hostname !== "localhost") return;
  document.cookie = `cc_shop_site=${SHOP_SITE}; path=/; max-age=86400`;
}
