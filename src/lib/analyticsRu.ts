/**
 * Maps the landing's catalog (RU articles, club prices in roubles) onto the
 * spec's e-commerce `items`. Kept apart from lib/analytics.ts so the generic
 * tracker does not pull the whole catalog into every bundle.
 */
import {
  LANDING_BONUS,
  LANDING_PRODUCTS_RU,
  LANDING_SETS_RU,
  type BeautySlug,
} from "./landingCatalogRu";
import { friendProductById } from "./friendCatalog";
import type { CartLine } from "./cart";
import { MARKET } from "./market";

export const CURRENCY = "RUB";

/** The friend project sells in dollars, the Russian landing in roubles. */
export const currencyNow = (): string =>
  typeof window !== "undefined" &&
  /\/friend(\/|$)/.test(window.location.pathname)
    ? MARKET.currency
    : CURRENCY;

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  price: number;
  item_category: string;
  item_variant?: string;
  quantity?: number;
  index?: number;
};

const NBSP = / /g;
const clean = (s: string) => s.replace(NBSP, " ");

/** The catalog entry behind a cart article, or null if it is not ours. */
export function itemFor(coralId: string): AnalyticsItem | null {
  const product = (
    Object.values(
      LANDING_PRODUCTS_RU,
    ) as (typeof LANDING_PRODUCTS_RU)[BeautySlug][]
  ).find((p) => p.ruId === coralId);
  if (product) {
    return {
      item_id: product.ruId,
      item_name: clean(product.name),
      price: product.priceRub.club,
      item_category: clean(product.category),
      item_variant: clean(product.form.label),
    };
  }
  const friend = friendProductById(coralId);
  if (friend) {
    return {
      item_id: friend.coralId,
      item_name: friend.name,
      price: friend.club,
      item_category: friend.isSet ? "Sets" : "Hydration",
      ...(friend.form ? { item_variant: friend.form } : {}),
    };
  }
  const set = LANDING_SETS_RU.find((s) => s.ruId === coralId);
  if (set) {
    return {
      item_id: set.ruId,
      item_name: clean(set.name),
      price: set.priceRub,
      item_category: "Наборы",
    };
  }
  return null;
}

export const itemBySlug = (slug: string): AnalyticsItem | null => {
  const p = LANDING_PRODUCTS_RU[slug as BeautySlug];
  return p ? itemFor(p.ruId) : null;
};

export const bonusFor = (coralId: string) =>
  LANDING_BONUS[coralId] ?? friendProductById(coralId)?.bonus ?? 0;

const round = (n: number) => Math.round(n * 100) / 100;

/** `items`, `value` (goods only) and `bonus_points` for a set of cart lines. */
export function summarize(lines: Pick<CartLine, "coralId" | "qty">[]) {
  const items: AnalyticsItem[] = [];
  let value = 0;
  let bonus = 0;
  lines.forEach((l, i) => {
    const it = itemFor(l.coralId);
    if (!it) return;
    items.push({ ...it, quantity: l.qty, index: i + 1 });
    value += it.price * l.qty;
    bonus += bonusFor(l.coralId) * l.qty;
  });
  return { items, value: round(value), bonus_points: round(bonus) };
}
