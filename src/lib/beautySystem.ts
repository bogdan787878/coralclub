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

/** Promo code of the "Система красоты" landing (extra 15% off at checkout). */
export const PROMO_CODE = "LABSPACE15";
