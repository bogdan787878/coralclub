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
  CZ: { name: "Czech Republic", currency: "EUR", host: "cz.coral.club" },
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
  IN: { name: "India", currency: "INR", host: "in.coral.club" },
  IT: { name: "Italy", currency: "EUR", host: "it.coral.club" },
  KR: { name: "South Korea", currency: "KRW", host: "kr.coral.club" },
  KZ: { name: "Kazakhstan", currency: "KZT", host: "kz.coral.club" },
  LT: { name: "Lithuania", currency: "EUR", host: "lt.coral.club" },
  LV: { name: "Latvia", currency: "EUR", host: "lv.coral.club" },
  NO: { name: "Norway", currency: "NOK", host: "no.coral.club" },
  PL: { name: "Poland", currency: "PLN", host: "pl.coral.club" },
  PT: { name: "Portugal", currency: "EUR", host: "pt.coral.club" },
  QA: { name: "Qatar", currency: "EUR", host: "qa.coral.club" },
  RO: { name: "Romania", currency: "EUR", host: "ro.coral.club" },
  RU: { name: "Russia", currency: "RUB", host: "ru.coral.club" },
  SK: { name: "Slovakia", currency: "EUR", host: "sk.coral.club" },
  TR: { name: "Turkey", currency: "EUR", host: "tr.coral.club" },
  TW: { name: "Taiwan", currency: "USD", host: "tw.coral.club" },
  UA: { name: "Ukraine", currency: "UAH", host: "ua.coral.club" },
  US: { name: "United States", currency: "USD", host: "us.coral.club" },
  UZ: { name: "Uzbekistan", currency: "UZS", host: "uz.coral.club" },
};
