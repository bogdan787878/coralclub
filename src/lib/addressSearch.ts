/**
 * US address suggestions (Google Places, «Autocomplete» of the Places API).
 *
 * The key is a browser key from the environment (NEXT_PUBLIC_GOOGLE_PLACES_KEY,
 * restricted by HTTP referrer in the Google console) — never in the repository.
 * Without it the address field is a plain input and nothing is requested.
 *
 * Only a typed address and Google's own session token leave the page, and
 * only after the shopper has typed a few characters.
 */
import { US_STATES } from "./usStates";

const KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY ?? "";

/** Is address search configured in this build? */
export const addressSearchEnabled = KEY !== "";

export type AddressSuggestion = {
  /** What was found: «350 5th Avenue» */
  main: string;
  /** «New York, NY, USA» */
  secondary: string;
  /** Opaque: pass it back to `resolveAddress`. */
  ref: unknown;
};

export type ResolvedAddress = {
  /** «350 5th Avenue» (house number + street). */
  street: string;
  /** Apartment / suite / unit, when the place has one. */
  unit: string;
  city: string;
  /** Full state name, as the shop's lists spell it. */
  state: string;
  zip: string;
};

/* The slice of the Maps JavaScript API used here (Places «New»). */
type PlacePrediction = {
  mainText?: { text: string };
  secondaryText?: { text: string };
  text: { text: string };
  toPlace(): {
    fetchFields(o: { fields: string[] }): Promise<unknown>;
    addressComponents?: {
      longText: string;
      shortText: string;
      types: string[];
    }[];
  };
};
type PlacesLib = {
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions(o: Record<string, unknown>): Promise<{
      suggestions: { placePrediction: PlacePrediction | null }[];
    }>;
  };
  AutocompleteSessionToken: new () => unknown;
};
type MapsWindow = {
  google?: {
    maps?: { importLibrary(name: string): Promise<unknown> };
  };
  __placesReady?: () => void;
};

let lib: Promise<PlacesLib> | null = null;

function load(): Promise<PlacesLib> {
  lib ??= new Promise<PlacesLib>((resolve, reject) => {
    const w = window as unknown as MapsWindow;
    const done = async () => {
      try {
        resolve((await w.google!.maps!.importLibrary("places")) as PlacesLib);
      } catch (e) {
        lib = null;
        reject(e);
      }
    };
    if (w.google?.maps?.importLibrary) {
      void done();
      return;
    }
    w.__placesReady = () => void done();
    const el = document.createElement("script");
    el.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}&loading=async&v=weekly&callback=__placesReady`;
    el.async = true;
    el.onerror = () => {
      lib = null;
      reject(new Error("Google Maps script failed to load"));
    };
    document.head.appendChild(el);
  });
  return lib;
}

/** One typing session = one token: Google bills a session, not each keystroke. */
export async function newSession(): Promise<unknown> {
  const { AutocompleteSessionToken } = await load();
  return new AutocompleteSessionToken();
}

/** Suggestions for what has been typed so far (US addresses only). */
export async function suggestAddresses(
  input: string,
  session: unknown,
): Promise<AddressSuggestion[]> {
  const { AutocompleteSuggestion } = await load();
  const { suggestions } =
    await AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input,
      sessionToken: session,
      includedRegionCodes: ["us"],
      // houses with a number only: a whole street («5th Avenue») has no ZIP
      // and cannot be delivered to, so it is not offered
      includedPrimaryTypes: ["street_address", "premise", "subpremise"],
    });
  return suggestions
    .map((s) => s.placePrediction)
    .filter((p): p is PlacePrediction => p !== null)
    .slice(0, 6)
    .map((p) => ({
      main: p.mainText?.text ?? p.text.text,
      secondary: p.secondaryText?.text ?? "",
      ref: p,
    }));
}

/** The chosen suggestion → the fields of the form. */
export async function resolveAddress(
  s: AddressSuggestion,
): Promise<ResolvedAddress> {
  const place = (s.ref as PlacePrediction).toPlace();
  await place.fetchFields({ fields: ["addressComponents"] });
  const comps = place.addressComponents ?? [];
  const get = (type: string, short = false) => {
    const c = comps.find((x) => x.types.includes(type));
    return c ? (short ? c.shortText : c.longText) : "";
  };
  const number = get("street_number");
  const route = get("route");
  const zip = get("postal_code"); // five digits, as the shop's forms take it
  const state = get("administrative_area_level_1");
  return {
    street: [number, route].filter(Boolean).join(" "),
    unit: get("subpremise"),
    city:
      get("locality") ||
      get("postal_town") ||
      get("sublocality_level_1") ||
      get("sublocality") ||
      get("neighborhood"),
    state: US_STATES.find((x) => x === state) ?? "",
    zip,
  };
}
