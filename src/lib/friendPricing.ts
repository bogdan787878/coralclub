import { useMemo } from "react";
import {
  getFriendCountry,
  isMultiSite,
  useFriendCountry,
  useMultiSite,
} from "./friendCountry";
import { friendProductById, type FriendProduct } from "./friendCatalog";
import { MARKET, formatMoney } from "./market";
import { CLUB_PRICES, SITE_CURRENCY } from "./friendCatalog.generated";
import { articleFor } from "./siteArticles";
import { SHOP_SITES } from "./shopSites";

/**
 * Club prices of the project's products on each country's own shop site, in
 * that site's currency, by the catalog's article (Germany's own prices are the
 * catalog's); a guest pays 25% more everywhere. Generated from the shop's own
 * basket (`npm run friend:sync`). The checkout always shows the shop's live
 * totals, these are for browsing.
 */
const CLUB = CLUB_PRICES;

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
    : (SITE_CURRENCY[country] ??
      SHOP_SITES[country]?.currency ??
      MARKET.currency);

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
