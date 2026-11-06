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
import { liveSnapshot, useFriendLive, type LiveCatalog } from "./friendLive";

/**
 * Цены товаров проекта на витрине страны. Источник — API каталога (friendLive: цена участника, обычная цена,
 * наличие); пока он не ответил — сгенерированные цены (`npm run friend:sync`, гость платит на 25% больше).
 * Оформление всегда показывает живые итоги магазина.
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

export function pricingFor(country: string, live: LiveCatalog = liveSnapshot(country)): Pricing {
  const currency = [...live.values()].find((x) => x.currency)?.currency ?? currencyOf(country);
  const home = country === MARKET.code || !CLUB[country];
  const fromApi = (p: Pick<FriendProduct, "coralId">) => live.get(p.coralId);
  const sold = (p: Pick<FriendProduct, "coralId">) => {
    const l = fromApi(p);
    if (l) return l.available && l.club !== null;
    return home || articleFor(country, p.coralId) !== null;
  };
  const club = (p: FriendProduct) => {
    const l = fromApi(p);
    if (l) return l.available && l.club !== null ? l.club : 0;
    return home ? p.club : sold(p) ? (CLUB[country][p.coralId] ?? 0) : 0;
  };
  const regular = (p: FriendProduct) => {
    const l = fromApi(p);
    if (l?.retail) return l.retail;
    return home ? p.regular : round2(club(p) * 1.25);
  };
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
  const live = useFriendLive(country);
  return useMemo(() => pricingFor(country, live), [country, live]);
}

/** The same outside React (analytics, event handlers). */
export const currentPricing = (): Pricing =>
  pricingFor(isMultiSite() ? getFriendCountry() : MARKET.code);
