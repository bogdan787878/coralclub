"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  GA_ID,
  landingId,
  ensureGtag,
  gaLive,
  isCardPage,
  isLandingPage,
  track,
  trackOnce,
  webViewFlag,
} from "@/lib/analytics";
import { currencyNow, itemFor, summarize } from "@/lib/analyticsRu";
import { getCart, type CartChange } from "@/lib/cart";

/**
 * The landing's analytics runtime (mounted once in app/landing/layout.tsx):
 *  - loads gtag.js and configures the GA4 property (only when really sending);
 *  - UI-clicks protocol: a click on a link becomes `link_click`, a click on
 *    a button / checkbox / switch becomes `button_click`, each with
 *    element_id and element_location resolved by the spec's fallback chain —
 *    this is what the spec's GTM triggers would do, done here because the
 *    page has no GTM container;
 *  - e-commerce events from the cart (add_to_cart, remove_from_cart,
 *    view_cart, begin_checkout) and from product cards (select_item);
 *  - "seen" events for banners, product lists and sections (50% visible
 *    for one second).
 * Markup contract: data-analytics-id / data-analytics-location on controls;
 * data-analytics-list / -item / -promo / -section on blocks (see
 * handoff/analytics-events.md).
 */

const ZONES = [
  "header",
  "footer",
  "home",
  "catalog",
  "product_card",
  "cart",
  "checkout",
];

/** Last resort for element_location: the page the click happened on. */
function zoneFromUrl(): string {
  const p = window.location.pathname;
  if (/\/checkout(\/|$)/.test(p)) return "checkout";
  if (/\/product\//.test(p)) return "product_card";
  return "home";
}

function locationOf(el: Element): string {
  const own = el.getAttribute("data-analytics-location");
  const up = el
    .closest("[data-analytics-location]")
    ?.getAttribute("data-analytics-location");
  const zone = own || up || zoneFromUrl();
  if (!ZONES.includes(zone)) {
    // unknown zones are reported for QA instead of being replaced by "main"
    console.warn(
      `[analytics] element_location "${zone}" is not in the reference list`,
      el,
    );
  }
  return zone;
}

function idOf(el: Element): string {
  return (
    el.getAttribute("data-analytics-id") ||
    el.id ||
    el.getAttribute("aria-label") ||
    (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 80)
  );
}

/** The control a click landed on: a link, or a button-like element. */
function controlOf(target: Element): { el: Element; link: boolean } | null {
  const link = target.closest("a[href]");
  if (link) return { el: link, link: true };
  const label = target.closest("label");
  const input = label?.querySelector<HTMLInputElement>(
    'input[type="checkbox"], input[type="radio"]',
  );
  if (input) return { el: input, link: false };
  const btn = target.closest(
    'button, [role="button"], [role="tab"], [role="radio"], summary, input[type="checkbox"], input[type="radio"]',
  );
  return btn ? { el: btn, link: false } : null;
}

function linkType(a: HTMLAnchorElement): "anchor" | "external" | "internal" {
  const href = a.getAttribute("href") ?? "";
  if (href.startsWith("#")) return "anchor";
  try {
    return new URL(a.href).host === window.location.host
      ? "internal"
      : "external";
  } catch {
    return "internal";
  }
}

function listOf(el: Element) {
  const box = el.closest("[data-analytics-list]");
  return {
    item_list_id: box?.getAttribute("data-analytics-list") ?? "",
    item_list_name: box?.getAttribute("data-analytics-list-name") ?? "",
  };
}

function promoOf(box: Element) {
  return {
    promotion_id: box.getAttribute("data-analytics-promo") ?? "",
    promotion_name: box.getAttribute("data-analytics-promo-name") ?? "",
    creative_name: box.getAttribute("data-analytics-creative") ?? "",
    creative_slot: box.getAttribute("data-analytics-slot") ?? "",
  };
}

function onClick(e: MouseEvent) {
  if (!isLandingPage()) return;
  const target = e.target as Element | null;
  if (!target?.closest) return;
  const hit = controlOf(target);
  if (!hit) return;
  const { el, link } = hit;

  const element_id = idOf(el);
  const element_location = locationOf(el);
  const common = { element_id, element_location };

  if (link) {
    const a = el as HTMLAnchorElement;
    track("link_click", {
      ...common,
      link_type: linkType(a),
      link_url: a.href,
      link_text: (a.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 80),
    });
  } else {
    track("button_click", common);
  }

  // a product card's photo / name opens the product page
  const card = el.closest("[data-analytics-item]");
  if (link && card) {
    const id = card.getAttribute("data-analytics-item") ?? "";
    const item = itemFor(id);
    if (item) {
      const index =
        Number(card.getAttribute("data-analytics-index")) || undefined;
      track(
        "select_item",
        {},
        { ...listOf(card), items: [{ ...item, index }] },
      );
    }
  }

  // a banner / promo block
  const promo = el.closest("[data-analytics-promo]");
  if (promo) track("select_promotion", {}, promoOf(promo));

  if (element_id === "cart_checkout_submit") {
    const s = summarize(getCart());
    if (s.items.length) {
      track(
        "begin_checkout",
        { bonus_points: s.bonus_points },
        { currency: currencyNow(), value: s.value, items: s.items },
      );
    }
  }

  if (/promo_code/.test(element_id)) {
    track("promo_code_copy", {
      promo_code: el.textContent?.trim().split(/\s+/)[0] ?? "",
    });
  }
}

function onCartChange(e: Event) {
  const { type, coralId, qty } = (e as CustomEvent<CartChange>).detail;
  const item = itemFor(coralId);
  if (!item) return;
  track(
    type === "add" ? "add_to_cart" : "remove_from_cart",
    {},
    {
      currency: currencyNow(),
      value: Math.round(item.price * qty * 100) / 100,
      items: [{ ...item, quantity: qty }],
    },
  );
}

function onCartView() {
  const s = summarize(getCart());
  if (!s.items.length) return;
  track(
    "view_cart",
    { bonus_points: s.bonus_points },
    { currency: currencyNow(), value: s.value, items: s.items },
  );
}

/** Fires `fire` once a matching element has been ≥50% visible for 1 second. */
function watch(selector: string, fire: (el: Element) => void): () => void {
  const timers = new Map<Element, number>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (en.isIntersecting) {
          if (!timers.has(en.target)) {
            timers.set(
              en.target,
              window.setTimeout(() => {
                io.unobserve(en.target);
                timers.delete(en.target);
                fire(en.target);
              }, 1000),
            );
          }
        } else {
          const t = timers.get(en.target);
          if (t) window.clearTimeout(t);
          timers.delete(en.target);
        }
      }
    },
    { threshold: 0.5 },
  );
  document.querySelectorAll(selector).forEach((el) => io.observe(el));
  return () => {
    io.disconnect();
    timers.forEach((t) => window.clearTimeout(t));
  };
}

export function Analytics() {
  const pathname = usePathname();
  const [live, setLive] = useState(false);

  // gtag.js: configured here (not in an inline snippet) so that webView and
  // the landing id ride along with the very first page_view
  useEffect(() => {
    if (!gaLive() || isCardPage()) return;
    ensureGtag();
    window.gtag!("js", new Date());
    window.gtag!("set", { webView: webViewFlag(), landing: landingId() });
    window.gtag!("config", GA_ID);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- only known after mount
    setLive(true);
  }, []);

  // clicks and cart events live for the whole visit
  useEffect(() => {
    document.addEventListener("click", onClick, true);
    window.addEventListener("coralclub:cart:change", onCartChange);
    window.addEventListener("coralclub:cart:view", onCartView);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("coralclub:cart:change", onCartChange);
      window.removeEventListener("coralclub:cart:view", onCartView);
    };
  }, []);

  // "seen" events — re-armed on every landing page
  useEffect(() => {
    const stops = [
      watch("[data-analytics-promo]", (el) => {
        const p = promoOf(el);
        trackOnce(`promo:${p.promotion_id}:${p.creative_slot}`, () =>
          track("view_promotion", {}, p),
        );
      }),
      watch("[data-analytics-list]", (el) => {
        const id = el.getAttribute("data-analytics-list") ?? "";
        const ids = (el.getAttribute("data-analytics-list-items") ?? "")
          .split(",")
          .filter(Boolean);
        const items = ids.flatMap((x, i) => {
          const it = itemFor(x);
          return it ? [{ ...it, index: i + 1 }] : [];
        });
        trackOnce(`list:${id}`, () =>
          track(
            "view_item_list",
            {},
            {
              item_list_id: id,
              item_list_name: el.getAttribute("data-analytics-list-name") ?? "",
              items,
            },
          ),
        );
      }),
      watch("[data-analytics-section]", (el) => {
        const id = el.getAttribute("data-analytics-section") ?? "";
        trackOnce(`section:${pathname}:${id}`, () =>
          track("section_view", { section_id: id }),
        );
      }),
    ];
    return () => stops.forEach((stop) => stop());
  }, [pathname]);

  return live ? (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      strategy="afterInteractive"
    />
  ) : null;
}
