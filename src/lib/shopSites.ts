/**
 * The shop runs one site per country (fr.coral.club, at.coral.club, …), each
 * with its own delivery services, payment methods and currency; the German
 * site answers every country the same way. Taken from the shop's own
 * checkout (its country table).
 */
export type ShopSite = { name: string; currency: string; host: string };

export const SHOP_SITES: Record<string, ShopSite> = {
  AM: { name: "Armenia", currency: "AMD", host: "am.coral.club" },
  AT: { name: "Austria", currency: "EUR", host: "at.coral.club" },
  AU: { name: "Australia", currency: "EUR", host: "au.coral.club" },
  BE: { name: "Belgium", currency: "EUR", host: "be.coral.club" },
  BY: { name: "Belarus", currency: "BYN", host: "by.coral.club" },
  CA: { name: "Canada", currency: "CAD", host: "ca.coral.club" },
  CH: { name: "Switzerland", currency: "CHF", host: "ch.coral.club" },
  CY: { name: "Cyprus", currency: "EUR", host: "cy.coral.club" },
  CZ: { name: "Czech Republic", currency: "CZK", host: "cz.coral.club" },
  DE: { name: "Germany", currency: "EUR", host: "de.coral.club" },
  EE: { name: "Estonia", currency: "EUR", host: "ee.coral.club" },
  ES: { name: "Spain", currency: "EUR", host: "es.coral.club" },
  FI: { name: "Finland", currency: "EUR", host: "fi.coral.club" },
  FR: { name: "France", currency: "EUR", host: "fr.coral.club" },
  GE: { name: "Georgia", currency: "GEL", host: "ge.coral.club" },
  GB: { name: "United Kingdom", currency: "GBP", host: "gb.coral.club" },
  GR: { name: "Greece", currency: "EUR", host: "gr.coral.club" },
  HU: { name: "Hungary", currency: "HUF", host: "hu.coral.club" },
  IL: { name: "Israel", currency: "ILS", host: "il.coral.club" },
  IN: { name: "India", currency: "EUR", host: "in.coral.club" },
  IT: { name: "Italy", currency: "EUR", host: "it.coral.club" },
  KR: { name: "South Korea", currency: "EUR", host: "kr.coral.club" },
  KZ: { name: "Kazakhstan", currency: "KZT", host: "kz.coral.club" },
  LT: { name: "Lithuania", currency: "EUR", host: "lt.coral.club" },
  LV: { name: "Latvia", currency: "EUR", host: "lv.coral.club" },
  NO: { name: "Norway", currency: "NOK", host: "no.coral.club" },
  PL: { name: "Poland", currency: "PLN", host: "pl.coral.club" },
  PT: { name: "Portugal", currency: "EUR", host: "pt.coral.club" },
  QA: { name: "Qatar", currency: "EUR", host: "qa.coral.club" },
  RO: { name: "Romania", currency: "RON", host: "ro.coral.club" },
  RU: { name: "Russia", currency: "RUB", host: "ru.coral.club" },
  SK: { name: "Slovakia", currency: "EUR", host: "sk.coral.club" },
  TR: { name: "Turkey", currency: "TRY", host: "tr.coral.club" },
  TW: { name: "Taiwan", currency: "EUR", host: "tw.coral.club" },
  UA: { name: "Ukraine", currency: "UAH", host: "ua.coral.club" },
  US: { name: "United States", currency: "USD", host: "us.coral.club" },
  UZ: { name: "Uzbekistan", currency: "UZS", host: "uz.coral.club" },
};

/**
 * The sites whose delivery services and prices depend on the place (city and
 * region), as the shop's checkout asks for them: they are asked again once an
 * address is chosen. The others answer the same for the whole country.
 */
const DELIVERY_BY_PLACE = new Set([
  "RU",
  "BY",
  "UA",
  "KZ",
  "UZ",
  "AM",
  "GE",
  "US",
  "CA",
]);
export const deliveryByPlace = (country: string): boolean =>
  DELIVERY_BY_PLACE.has(country);

/** The language Google answers address searches in for the country. */
export function placesLanguageFor(country: string): string | undefined {
  return (
    {
      RU: "ru",
      BY: "ru",
      KZ: "ru",
      UZ: "ru",
      AM: "ru",
      GE: "ru",
      UA: "uk",
    } as Record<string, string>
  )[country];
}

/** The country whose shop site this host is (`ru.coral.club` → `RU`). */
export const countryOfSite = (host: string): string | undefined =>
  Object.entries(SHOP_SITES).find(([, v]) => v.host === host)?.[0];

/**
 * The shop's own page where an order is paid. The shop's checkout leaves the
 * payment method out of the address for Russia and Belarus (the method is
 * already in the order; with it there the shop sends the shopper to the
 * personal account instead of the gateway) and puts it in for the rest.
 */
export function orderPaymentPath(
  country: string,
  orderId: string,
  paymentId: string,
): string {
  const order = encodeURIComponent(orderId);
  return country === "RU" || country === "BY"
    ? `/order/payment/${order}/?new_checkout=1`
    : `/order/payment/${order}/${encodeURIComponent(paymentId)}/?new_checkout=1`;
}
