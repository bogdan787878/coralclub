"use client";

import { useSyncExternalStore } from "react";

/**
 * The country of the order in the member area: one for every page (the header's
 * flag sets it, the checkout prices delivery and payment by it), remembered
 * between visits. The list of countries is what the shop last told the checkout.
 */
const COUNTRY_KEY = "lk_country";
const LIST_KEY = "lk_countries";
const DEFAULT = "RU";
const NO_COUNTRIES: Record<string, string> = { RU: "Россия" };

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const read = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* kept for this visit only */
  }
};

let country: string | null = null;
let countries: Record<string, string> | null = null;

const getCountry = (): string => {
  if (country === null) {
    const v = read(COUNTRY_KEY);
    country = v && /^[A-Z]{2}$/.test(v) ? v : DEFAULT;
  }
  return country;
};
const getCountries = (): Record<string, string> => {
  if (countries === null) {
    countries = NO_COUNTRIES;
    try {
      const v: unknown = JSON.parse(read(LIST_KEY) ?? "null");
      if (v && typeof v === "object" && Object.keys(v).length) countries = v as Record<string, string>;
    } catch {
      /* damaged: Russia only */
    }
  }
  return countries;
};

export const useLkCountry = (): string => useSyncExternalStore(subscribe, getCountry, () => DEFAULT);
export const useLkCountries = (): Record<string, string> => useSyncExternalStore(subscribe, getCountries, () => NO_COUNTRIES);

export function setLkCountry(code: string): void {
  if (!code || code === getCountry()) return;
  country = code;
  write(COUNTRY_KEY, code);
  emit();
}

export function rememberLkCountries(list: Record<string, string>): void {
  if (!Object.keys(list).length || JSON.stringify(list) === JSON.stringify(getCountries())) return;
  countries = list;
  write(LIST_KEY, JSON.stringify(list));
  emit();
}
