import { useSyncExternalStore } from "react";
import { MARKET } from "./market";
import { onShopOrigin } from "./shopApi";

/**
 * The country the visitor shops for, shared by every page of the project (the
 * header's flag sets it, the checkout prices delivery and payment by it) and
 * remembered between visits. Until the client has read it, the market's own.
 */
const COUNTRY_KEY = "friend_country";
const LIST_KEY = "friend_countries";

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

let country: string | null = null;
let countries: Record<string, string> | null = null;
const NO_COUNTRIES: Record<string, string> = {
  [MARKET.code]: MARKET.country,
};

const getCountry = (): string => {
  if (country === null) {
    country = MARKET.code;
    try {
      const v = window.localStorage.getItem(COUNTRY_KEY);
      if (v && /^[A-Z]{2}$/.test(v)) country = v;
    } catch {
      /* storage blocked: the market's country */
    }
  }
  return country;
};

/** The country now, outside React (event handlers, analytics). */
export const getFriendCountry = (): string =>
  typeof window === "undefined" ? MARKET.code : getCountry();

export const useFriendCountry = (): string =>
  useSyncExternalStore(subscribe, getCountry, () => MARKET.code);

export function setFriendCountry(code: string): void {
  if (code === getCountry()) return;
  country = code;
  try {
    window.localStorage.setItem(COUNTRY_KEY, code);
  } catch {
    /* kept for this visit only */
  }
  emit();
}

const getCountries = (): Record<string, string> => {
  if (countries === null) {
    countries = NO_COUNTRIES;
    try {
      const raw = window.localStorage.getItem(LIST_KEY);
      const v: unknown = raw ? JSON.parse(raw) : null;
      if (v && typeof v === "object" && Object.keys(v).length) {
        countries = v as Record<string, string>;
      }
    } catch {
      /* storage blocked or damaged: the market's country only */
    }
  }
  return countries;
};

/** The countries the shop ships to, as the checkout last heard them. */
export const useFriendCountries = (): Record<string, string> =>
  useSyncExternalStore(subscribe, getCountries, () => NO_COUNTRIES);

export function rememberFriendCountries(list: Record<string, string>): void {
  if (JSON.stringify(list) === JSON.stringify(getCountries())) return;
  countries = list;
  try {
    window.localStorage.setItem(LIST_KEY, JSON.stringify(list));
  } catch {
    /* kept for this visit only */
  }
  emit();
}

/**
 * A page that has to redo its work when the country changes (the checkout)
 * takes the choice over; elsewhere the choice is simply remembered.
 */
let handler: ((code: string) => void) | null = null;
export function onCountryRequest(fn: (code: string) => void): () => void {
  handler = fn;
  return () => {
    if (handler === fn) handler = null;
  };
}
export function requestFriendCountry(code: string): void {
  if (handler) handler(code);
  else setFriendCountry(code);
}

/**
 * Through the local proxy every country has a shop site of its own, with its
 * own prices; on the shop's own domain there is the one site of the market.
 */
export const isMultiSite = (): boolean =>
  typeof window !== "undefined" &&
  onShopOrigin() &&
  window.location.hostname === "localhost";

export const useMultiSite = (): boolean =>
  useSyncExternalStore(
    () => () => {},
    isMultiSite,
    () => false,
  );
