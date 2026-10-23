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
   * gateway (Germany: Walletto — card, Apple Pay, Google Pay); the shopper is
   * sent there as a whole page. "own": our card form on /friend/checkout/pay/,
   * which posts to the shop's API the way the US site does.
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

/** Calling codes of the countries the shop most often ships to (the rest are typed with «+»). */
const DIAL_CODES: Record<string, string> = {
  AT: "43",
  BE: "32",
  BG: "359",
  CH: "41",
  CY: "357",
  CZ: "420",
  DE: "49",
  DK: "45",
  EE: "372",
  ES: "34",
  FI: "358",
  FR: "33",
  GB: "44",
  GR: "30",
  HR: "385",
  HU: "36",
  IE: "353",
  IT: "39",
  LI: "423",
  LT: "370",
  LU: "352",
  LV: "371",
  MT: "356",
  NL: "31",
  NO: "47",
  PL: "48",
  PT: "351",
  RO: "40",
  SE: "46",
  SI: "386",
  SK: "421",
  US: "1",
  CA: "1",
  AU: "61",
  UA: "380",
  TR: "90",
  IL: "972",
};

/** The countries whose street lines start with the number («10 Downing Street»). */
export const NUMBER_FIRST = new Set([
  "US",
  "CA",
  "GB",
  "IE",
  "AU",
  "NZ",
  "FR",
  "IL",
]);

/** «+49 151 2345678», «0151 2345678», «49151…» → «+491512345678» (by the country's calling code). */
export function phoneForShop(
  raw: string,
  country: string = MARKET.code,
): string {
  const digits = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("+")) return `+${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  const code = DIAL_CODES[country];
  // no known code for the country: the number has to be typed with «+»
  if (!code) return `+${digits}`;
  if (digits.startsWith("0")) return `+${code}${digits.slice(1)}`;
  if (digits.startsWith(code)) return `+${digits}`;
  return `+${code}${digits}`;
}
