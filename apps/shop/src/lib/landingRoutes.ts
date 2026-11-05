/**
 * Where the landing's own pages live.
 *
 *  - GitHub Pages (the default build): under /landing — /landing/,
 *    /landing/product/<slug>/, /landing/consultation/, /landing/consent/.
 *  - coralclub.ru (DEPLOY_TARGET=coralclub): the landing is the root of its
 *    base path https://coralclub.ru/landings/labspace/ — /, /product/<slug>/,
 *    /consultation/, /consent/ (the base path itself is added by Next.js and
 *    by asset()).
 *
 * Build every internal landing link with landingPath().
 */
export const LANDING_BASE =
  process.env.NEXT_PUBLIC_DEPLOY_TARGET === "coralclub" ? "" : "/landing";

/** landingPath("/consent/") → "/landing/consent/" or "/consent/". */
export const landingPath = (path = "/"): string =>
  `${LANDING_BASE}${path}` || "/";
