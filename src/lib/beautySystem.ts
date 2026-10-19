/** The "Система красоты" product set, in display order — the products the
 *  /landing page and its Russian product pages are built from. */
export const BEAUTY_SLUGS = [
  "hydramax",
  "hydramax-plus",
  "promarine-collagen",
  "promarine-collagen-tripeptides-pack",
  "advanced-collagen-biocellulose-facial-mask",
  "hydro-boost-biocellulose-facial-mask",
  "skin-harmony-biocellulose-facial-mask",
] as const;

/** The main shop the landing hands visitors off to. The landing is a
 *  standalone page, so links back are absolute — it keeps working if it's
 *  served from a different host/subdomain than the shop. */
export const MAIN_SITE_URL = (
  process.env.NEXT_PUBLIC_MAIN_SITE_URL ??
  "https://bogdan787878.github.io/coralclub"
).replace(/\/$/, "");

/**
 * "Друг клуба" — the referral mechanic of the Russian shop. A link carrying
 * this REF_CODE shows every price as a club price and lets the visitor buy
 * without registering; `user` is the referrer's member number. The cart
 * hand-off below fills the basket (`<id>=<qty>`) and lands in that
 * friend-of-the-club basket on coralclub.ru in one step.
 */
export const FRIEND_REF_CODE = "570445656503";
export const FRIEND_USER_ID = "8819457";
export const RU_SHOP_URL = "https://coralclub.ru";

export function friendBasketUrl(
  lines: { coralId: string; qty: number }[],
): string {
  const items = lines
    .filter((l) => l.coralId && l.qty > 0)
    .map((l) => `${encodeURIComponent(l.coralId)}=${l.qty}`);
  const query = [
    `REF_CODE=${FRIEND_REF_CODE}`,
    "langss=ru",
    `user=${FRIEND_USER_ID}`,
    "f=y",
    ...items,
  ].join("&");
  return `${RU_SHOP_URL}/shop/shop_basket.php?${query}`;
}
