import { useMemo } from "react";
import {
  getFriendCountry,
  isMultiSite,
  useFriendCountry,
  useMultiSite,
} from "./friendCountry";
import { friendProductById, type FriendProduct } from "./friendCatalog";
import { MARKET, formatMoney } from "./market";
import { articleFor } from "./siteArticles";
import { SHOP_SITES } from "./shopSites";

/**
 * Club prices of the project's products on each country's own shop site, in
 * that site's currency, by the catalog's article (Germany's own prices are the
 * catalog's). What the shop's basket showed for one unit of the pack on
 * 30 Oct 2026, through a friend session; a guest pays 25% more everywhere.
 * The checkout always shows the shop's live totals, these are for browsing.
 */
const CLUB: Record<string, Record<string, number>> = {
  AM: { "22201": 8400, "91883": 23200 },
  AT: { "807200": 117, "803800": 82, "22201": 21, "225115": 19, "91883": 58 },
  AU: { "807200": 117, "803800": 82, "22201": 21, "225115": 19, "91883": 58 },
  BE: { "807200": 117, "803800": 82, "22201": 21, "225115": 19, "91883": 58 },
  BY: {
    "807200": 362.7,
    "803800": 254.2,
    "22201": 65.1,
    "225115": 58.9,
    "91883": 179.8,
  },
  CA: {
    "807200": 169.65,
    "803800": 118.9,
    "22201": 30.45,
    "225115": 27.55,
    "91883": 84.1,
  },
  CH: {
    "807200": 110.1,
    "803800": 77.16,
    "22201": 19.76,
    "225115": 17.88,
    "91883": 54.58,
  },
  CY: { "22201": 21, "91883": 58 },
  CZ: {
    "807200": 2574,
    "803800": 1804,
    "22201": 462,
    "225115": 418,
    "91883": 1276,
  },
  EE: { "807200": 117, "803800": 82, "22201": 21, "225115": 19, "91883": 58 },
  ES: { "807200": 117, "803800": 82, "22201": 21, "91883": 58 },
  FI: { "807200": 117, "803800": 82, "225115": 19, "91883": 58 },
  FR: { "807200": 117, "803800": 82, "22201": 21, "225115": 19, "91883": 58 },
  GB: {
    "807200": 101.79,
    "803800": 71.34,
    "22201": 18.27,
    "225115": 16.53,
    "91883": 50.46,
  },
  GE: {
    "807200": 327.6,
    "803800": 229.6,
    "22201": 58.8,
    "225115": 53.2,
    "91883": 162.4,
  },
  GR: { "807200": 117, "803800": 82, "22201": 21, "225115": 19, "91883": 58 },
  HU: {
    "807200": 44460,
    "803800": 31160,
    "22201": 7980,
    "225115": 7220,
    "91883": 22040,
  },
  IL: { "803800": 461.7, "91883": 326.5 },
  IN: { "807200": 117, "803800": 82, "22201": 21, "225115": 19, "91883": 58 },
  IT: { "807200": 117, "803800": 82, "22201": 21, "225115": 19, "91883": 58 },
  KR: { "807200": 117, "803800": 82, "22201": 21, "225115": 19, "91883": 58 },
  KZ: {
    "807200": 58500,
    "803800": 41000,
    "22201": 10500,
    "225115": 9500,
    "91883": 29000,
  },
  LT: { "807200": 117, "803800": 82, "22201": 21, "225115": 19, "91883": 58 },
  LV: { "807200": 117, "803800": 82, "22201": 21, "225115": 19, "91883": 58 },
  NO: {
    "807200": 1226.16,
    "803800": 859.36,
    "22201": 220.08,
    "225115": 199.12,
    "91883": 607.84,
  },
  PL: { "807200": 468, "803800": 328, "22201": 84, "225115": 76, "91883": 232 },
  PT: { "807200": 117, "803800": 82, "91883": 58 },
  QA: { "807200": 117, "803800": 82, "22201": 21, "225115": 19, "91883": 58 },
  RO: {
    "807200": 526.5,
    "803800": 369,
    "22201": 94.5,
    "225115": 85.5,
    "91883": 261,
  },
  RU: {
    "807200": 10062,
    "803800": 7052,
    "22201": 1806,
    "225115": 1634,
    "91883": 4988,
  },
  SK: { "807200": 117, "803800": 82, "22201": 21, "225115": 19, "91883": 58 },
  TR: { "91883": 2273.6 },
  TW: { "807200": 117, "803800": 82, "22201": 21, "225115": 19, "91883": 58 },
  UA: {
    "807200": 4680,
    "803800": 3280,
    "22201": 840,
    "225115": 760,
    "91883": 2320,
  },
  US: { "807200": 117, "803800": 82, "22201": 21, "225115": 19, "91883": 58 },
  UZ: {
    "807200": 1462500,
    "803800": 1025000,
    "22201": 262500,
    "91883": 725000,
  },
};

/** Everything the pages need to show money for one country. */
export type Pricing = {
  country: string;
  currency: string;
  money: (n: number) => string;
  /** The product is sold on the country's site. */
  sold: (p: Pick<FriendProduct, "coralId">) => boolean;
  /** Member price of one unit (0 when it is not sold there). */
  club: (p: FriendProduct) => number;
  /** Price of a guest, 25% over the member price. */
  regular: (p: FriendProduct) => number;
  totals: (lines: { coralId: string; qty: number }[]) => {
    club: number;
    regular: number;
    saving: number;
  };
  /** Free shipping from this sum, when the project knows it for the country. */
  freeFrom: number | null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export const currencyOf = (country: string): string =>
  country === MARKET.code
    ? MARKET.currency
    : (SHOP_SITES[country]?.currency ?? MARKET.currency);

export function pricingFor(country: string): Pricing {
  const currency = currencyOf(country);
  const home = country === MARKET.code || !CLUB[country];
  const sold = (p: Pick<FriendProduct, "coralId">) =>
    home || articleFor(country, p.coralId) !== null;
  const club = (p: FriendProduct) =>
    home ? p.club : sold(p) ? (CLUB[country][p.coralId] ?? 0) : 0;
  const regular = (p: FriendProduct) =>
    home ? p.regular : round2(club(p) * 1.25);
  return {
    country,
    currency,
    money: (n) => formatMoney(n, currency),
    sold,
    club,
    regular,
    totals: (lines) => {
      let c = 0;
      let r = 0;
      for (const l of lines) {
        const p = friendProductById(l.coralId);
        if (!p) continue;
        c += club(p) * l.qty;
        r += regular(p) * l.qty;
      }
      return { club: round2(c), regular: round2(r), saving: round2(r - c) };
    },
    freeFrom: home ? MARKET.freeShippingFrom : null,
  };
}

/** The prices of the site an order was made on (a host like ru.coral.club). */
export function pricingForSite(host: string): Pricing {
  const code = Object.entries(SHOP_SITES).find(([, v]) => v.host === host)?.[0];
  return pricingFor(code ?? MARKET.code);
}

/** The prices of the country the visitor shops for (re-renders when it changes). */
export function useFriendPricing(): Pricing {
  const chosen = useFriendCountry();
  const multi = useMultiSite();
  const country = multi ? chosen : MARKET.code;
  return useMemo(() => pricingFor(country), [country]);
}

/** The same outside React (analytics, event handlers). */
export const currentPricing = (): Pricing =>
  pricingFor(isMultiSite() ? getFriendCountry() : MARKET.code);
