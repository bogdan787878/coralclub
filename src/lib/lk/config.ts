/** Member area (/lk): where its calls go. */
export const CC4_BASE = "https://api.coral.club/api/v1";

/**
 * Development only: a test run can point the area at a local mock instead of the
 * real API and gateway (sessionStorage keys `lk_cc4_base`, `lk_gateway`). A
 * production build ignores them.
 */
const devOverride = (key: string): string | null => {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};
export const cc4Base = (): string => devOverride("lk_cc4_base") ?? CC4_BASE;
export const gatewayUrl = (): string => devOverride("lk_gateway") ?? GATEWAY_URL;

/**
 * The checkout gateway (a Cloudflare Worker: it keeps the shop's session for a
 * page on another origin; the member's cabinet token opens it, no password).
 */
export const GATEWAY_URL: string =
  process.env.NEXT_PUBLIC_LK_GATEWAY ??
  "https://coral-lk-checkout.bogdan787878.workers.dev";

/** Where to sign in (the plain-JS member area; its token is shared through sessionStorage). */
export const LOGIN_URL: string =
  process.env.NEXT_PUBLIC_LK_LOGIN_URL ??
  "https://bogdan787878.github.io/coralclub-lk/docs/";
