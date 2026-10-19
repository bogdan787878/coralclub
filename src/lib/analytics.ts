/**
 * Analytics for the /landing pages — GA4 through gtag.js plus a GTM-style
 * dataLayer, following the "Комплексная разметка аналитики GA4 / DataLayer"
 * spec (task 327840).
 *
 * Every event goes two ways:
 *  1. `dataLayer.push({ event, … })` — the exact contract of the spec, ready
 *     for a GTM container the day one is added;
 *  2. `gtag('event', name, params)` — so the GA4 tag on the page (the plain
 *     gtag.js snippet) receives it now. When GTM takes over the GA4 tag, set
 *     FORWARD_TO_GTAG to false to avoid double counting.
 *
 * Nothing is sent from localhost or from pages outside /landing: there the
 * event is only printed to the console (and kept in dataLayer) so tests do
 * not pollute the real GA4 property. `?ga=on` forces sending (GA4 DebugView),
 * `?ga=off` mutes everything.
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-MLKGZ6XHY5";

/** Forward every event to gtag(); turn off once GTM owns the GA4 tag. */
export const FORWARD_TO_GTAG = true;

/** Which landing this build is — added to every event for easy filtering. */
export const LANDING_ID = "labspace";

export type Params = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const inBrowser = () => typeof window !== "undefined";

/** Landing routes only (the English prototype is not tracked): /landing/…
 *  on GitHub Pages, /landings/<name>/… on coralclub.ru. */
export const isLandingPage = () =>
  inBrowser() && /\/landings?(\/|$)/.test(window.location.pathname);

const isLocalHost = () => {
  if (!inBrowser()) return true;
  const h = window.location.hostname;
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "[::1]" ||
    h.endsWith(".localhost") ||
    h.endsWith(".test")
  );
};

const gaFlag = () =>
  inBrowser() ? new URLSearchParams(window.location.search).get("ga") : null;

/** Real sending (gtag.js is loaded and events are forwarded)? */
export const gaLive = () => {
  const flag = gaFlag();
  if (flag === "off") return false;
  if (flag === "on") return true;
  return !isLocalHost();
};

/** 'yes' inside the mobile app's WebView, 'no' in a normal browser. */
export function webViewFlag(): "yes" | "no" {
  if (!inBrowser()) return "no";
  const q = new URLSearchParams(window.location.search).get("webview");
  try {
    if (q === "yes" || q === "no") {
      window.sessionStorage.setItem("coralclub.webview", q);
      return q;
    }
    const kept = window.sessionStorage.getItem("coralclub.webview");
    if (kept === "yes" || kept === "no") return kept;
  } catch {
    /* storage unavailable */
  }
  const w = window as unknown as Record<string, unknown>;
  const ua = navigator.userAgent;
  const embedded =
    Boolean(w.ReactNativeWebView) ||
    /; wv\)/.test(ua) || // Android WebView
    (/(iPhone|iPod|iPad)/.test(ua) &&
      /AppleWebKit/.test(ua) &&
      !/Safari/.test(ua));
  return embedded ? "yes" : "no";
}

/** Makes sure `dataLayer` and `gtag()` exist (same shape as Google's snippet). */
export function ensureGtag() {
  if (!inBrowser()) return;
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    // gtag.js only understands the `arguments` object, not an array
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
}

/**
 * Sends one event.
 * @param ecommerce the spec's `ecommerce` object (items, value, currency …);
 *                  pushed after `{ ecommerce: null }` as the spec requires.
 */
export function track(
  event: string,
  params: Params = {},
  ecommerce?: Params,
): void {
  if (!isLandingPage()) return;
  ensureGtag();
  const base: Params = {
    webView: webViewFlag(),
    landing: LANDING_ID,
    ...params,
  };

  if (ecommerce) window.dataLayer!.push({ ecommerce: null });
  window.dataLayer!.push({
    event,
    ...base,
    ...(ecommerce ? { ecommerce } : {}),
  });

  if (gaFlag() === "off") return;
  if (gaLive()) {
    if (FORWARD_TO_GTAG && window.gtag) {
      // GA4 wants the e-commerce fields at the top level of the event
      window.gtag("event", event, {
        ...base,
        ...(ecommerce ?? {}),
        ...(gaFlag() === "on" ? { debug_mode: true } : {}),
      });
    }
  } else {
    console.info(`[analytics] ${event}`, {
      ...base,
      ...(ecommerce ? { ecommerce } : {}),
    });
  }
}

/** Ties the session to the club number (spec 1.2: user_ID → user_id). */
export function identify(clubId: string): void {
  if (!isLandingPage() || !clubId) return;
  ensureGtag();
  if (gaLive() && window.gtag) {
    window.gtag("config", GA_ID, { user_id: clubId });
  }
}

/** Runs `fn` once per `key` for the lifetime of the page. */
const once = new Set<string>();
export function trackOnce(key: string, fn: () => void): void {
  if (once.has(key)) return;
  once.add(key);
  fn();
}
