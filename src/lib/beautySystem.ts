/** The "Система красоты" product set, in display order — shared by the
 *  /landing carousel and the hidden /beauty-system section. */
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
  process.env.NEXT_PUBLIC_MAIN_SITE_URL ?? "https://bogdan787878.github.io/coralclub"
).replace(/\/$/, "");
