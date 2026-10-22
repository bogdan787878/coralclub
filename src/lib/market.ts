/**
 * The market the friend project sells in. One place for everything that
 * differs from country to country: which shop site serves it, the currency and
 * how money is written, the phone code, what the shop's checkout asks for.
 * (Germany; the United States version is in the git history.)
 */
export const MARKET = {
  code: "DE",
  country: "Germany",
  /** The shop site (its own domain, currency, products, delivery). */
  site: "de.coral.club",
  currency: "EUR",
  /** How numbers are written: 117,00 € */
  locale: "de-DE",
  /** `language` the shop's API is asked in: English labels. */
  apiLanguage: "us",
  /** `langss` of the shop's links (the visitor's session language). */
  linkLanguage: "de",
  /** Country calling code, for phone numbers typed the national way (0151 …). */
  phoneCode: "49",
  /** DHL's free-shipping threshold in euros (the shop's rule; DHL Express: 300). */
  freeShippingFrom: 200,
  /** The shop's delivery options do not depend on the address in Germany. */
  deliveryNeedsRegion: false,
  /** Pick-up points: the shop has none for Germany. */
  pickup: false,
  /**
   * Where the card is typed. "shop": the shop's own payment page of its
   * gateway (Germany: Walletto — card, Apple Pay, Google Pay), shown in the
   * sheet; "own": our card form, which posts to the shop's API the way the
   * US site does.
   */
  cardForm: "shop",
  /** Google Pay in the shop's own payment page is for the US site only. */
  googlePay: false,
  /** Google Places: the country and the language of the answers. */
  placesRegion: "de",
  placesLanguage: "de",
} as const;

const money = new Intl.NumberFormat(MARKET.locale, {
  style: "currency",
  currency: MARKET.currency,
});

/** 117 → «117,00 €» */
export const formatMoney = (n: number): string => money.format(n);

/** The 16 Bundesländer, as the shop's `AREA` takes them. */
export const REGIONS = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
] as const;

/** «+49 151 2345678», «0151 2345678», «49151…» → «+491512345678» */
export function phoneForShop(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("+")) return `+${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0")) return `+${MARKET.phoneCode}${digits.slice(1)}`;
  if (digits.startsWith(MARKET.phoneCode)) return `+${digits}`;
  return `+${MARKET.phoneCode}${digits}`;
}
