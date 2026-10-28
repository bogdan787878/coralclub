/**
 * Address suggestions for the market's country (Google Places, «Autocomplete»
 * of the Places API).
 *
 * The key is a browser key from the environment (NEXT_PUBLIC_GOOGLE_PLACES_KEY,
 * restricted by HTTP referrer in the Google console) — never in the repository.
 * Without it the address field is a plain input and nothing is requested.
 *
 * Only a typed address and Google's own session token leave the page, and
 * only after the shopper has typed a few characters.
 */
import { MARKET, NUMBER_FIRST, REGIONS } from "./market";

const KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY ?? "";

/** Is address search configured in this build? */
export const addressSearchEnabled = KEY !== "";

export type AddressSuggestion = {
  /** What was found: «350 5th Avenue» */
  main: string;
  /** «New York, NY, USA» */
  secondary: string;
  /** A street without a number: picking it asks for the house number next. */
  street: boolean;
  /** Opaque: pass it back to `resolveAddress`. */
  ref: unknown;
};

export type ResolvedAddress = {
  /** The street alone: «Friedrichstraße». */
  street: string;
  /** The house number alone: «43», «12a», «43-45». */
  houseNumber: string;
  /** Apartment / suite / unit, when the place has one. */
  unit: string;
  city: string;
  /** Bundesland, as the shop's lists spell it. */
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

/**
 * Suggestions for what has been typed so far. Until a digit is typed these
 * are streets; once there is a house number, whole addresses.
 */
export async function suggestAddresses(
  input: string,
  session: unknown,
  country: string = MARKET.code,
): Promise<AddressSuggestion[]> {
  const streets = !/\d/.test(input);
  const { AutocompleteSuggestion } = await load();
  const { suggestions } =
    await AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input,
      sessionToken: session,
      includedRegionCodes: [country.toLowerCase()],
      language: country === MARKET.code ? MARKET.placesLanguage : "en",
      // a street alone has no postcode and cannot be delivered to: it is only
      // a step towards the address with its number
      includedPrimaryTypes: streets
        ? ["route"]
        : ["street_address", "premise", "subpremise"],
    });
  return suggestions
    .map((s) => s.placePrediction)
    .filter((p): p is PlacePrediction => p !== null)
    .slice(0, 6)
    .map((p) => ({
      main: p.mainText?.text ?? p.text.text,
      secondary: p.secondaryText?.text ?? "",
      street: streets,
      ref: p,
    }));
}

/** A picked street → its name and town, to carry on typing the number. */
export async function resolveStreet(
  s: AddressSuggestion,
): Promise<{ route: string; city: string }> {
  const place = (s.ref as PlacePrediction).toPlace();
  await place.fetchFields({ fields: ["addressComponents"] });
  const comps = place.addressComponents ?? [];
  const get = (type: string) =>
    comps.find((x) => x.types.includes(type))?.longText ?? "";
  return {
    route: get("route") || s.main,
    city: get("locality") || get("postal_town") || get("sublocality_level_1"),
  };
}

/** The chosen suggestion → the fields of the form. */
export type AddressComponent = { long: string; short: string; types: string[] };

/** Google's address components → the fields of the form. */
export function addressFromComponents(
  comps: AddressComponent[],
  country: string = MARKET.code,
  /** the street line to fall back on when Google gives no street part */
  fallbackStreet = "",
): ResolvedAddress {
  const get = (type: string) =>
    comps.find((x) => x.types.includes(type))?.long ?? "";
  // a range comes as «5 7» from the geocoder: write it «5-7»
  const number = get("street_number").replace(/(\d)\s+(\d)/g, "$1-$2");
  const route = get("route");
  const state = get("administrative_area_level_1");
  return {
    // never empty when a line was picked: «Friedrichstraße 43» goes into the field as it is
    street: route || fallbackStreet,
    houseNumber: route ? number : "",
    unit: get("subpremise"),
    city:
      get("locality") ||
      get("postal_town") ||
      get("sublocality_level_1") ||
      get("sublocality") ||
      get("neighborhood"),
    // the market's own country: the shop's list of Länder; abroad: as Google names it
    state:
      country === MARKET.code
        ? (REGIONS.find((x) => x === state) ?? "")
        : state,
    zip: get("postal_code"),
  };
}

export async function resolveAddress(
  s: AddressSuggestion,
  country: string = MARKET.code,
): Promise<ResolvedAddress> {
  const place = (s.ref as PlacePrediction).toPlace();
  await place.fetchFields({ fields: ["addressComponents"] });
  const comps = (place.addressComponents ?? []).map((c) => ({
    long: c.longText,
    short: c.shortText,
    types: c.types,
  }));
  return addressFromComponents(comps, country, s.main);
}

/* ---- «Choose on map»: the map and the geocoder of the same Maps script ---- */

export type MapPoint = { lat: number; lng: number };
type LatLng = { lat(): number; lng(): number };
type GeoResult = {
  types: string[];
  formatted_address: string;
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
  geometry: { location: LatLng; viewport?: unknown };
};
export type GoogleMap = {
  getCenter(): LatLng | undefined;
  fitBounds(bounds: unknown): void;
  setCenter(c: MapPoint): void;
  setZoom(z: number): void;
  addListener(event: string, fn: () => void): { remove(): void };
};
export type MapsKit = {
  newMap(el: HTMLElement, center: MapPoint, zoom: number): GoogleMap;
  /** where a place is (a country, a city), as a point and a zoom */
  find(
    address: string,
    region?: string,
  ): Promise<{ point: MapPoint; bounds: unknown } | null>;
  /** the address at a point */
  at(point: MapPoint): Promise<{
    address: ResolvedAddress;
    country: string;
    line: string;
  } | null>;
};

export async function loadMapsKit(): Promise<MapsKit> {
  await load(); // the script (with the Places library) is the same one
  const w = window as unknown as MapsWindow;
  const maps = (await w.google!.maps!.importLibrary("maps")) as {
    Map: new (el: HTMLElement, o: Record<string, unknown>) => GoogleMap;
  };
  const geo = (await w.google!.maps!.importLibrary("geocoding")) as {
    Geocoder: new () => {
      geocode(r: Record<string, unknown>): Promise<{ results: GeoResult[] }>;
    };
  };
  const geocoder = new geo.Geocoder();
  const comps = (r: GeoResult) =>
    r.address_components.map((c) => ({
      long: c.long_name,
      short: c.short_name,
      types: c.types,
    }));
  return {
    newMap: (el, center, zoom) =>
      new maps.Map(el, {
        center,
        zoom,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "greedy",
        clickableIcons: false,
      }),
    async find(address, region) {
      try {
        const { results } = await geocoder.geocode({
          address,
          ...(region ? { region } : {}),
        });
        const r = results[0];
        if (!r) return null;
        return {
          point: {
            lat: r.geometry.location.lat(),
            lng: r.geometry.location.lng(),
          },
          bounds: r.geometry.viewport,
        };
      } catch {
        return null;
      }
    },
    async at(point) {
      try {
        const { results } = await geocoder.geocode({ location: point });
        // the first result with a street and a house number, else the first one
        const hit =
          results.find((r) => {
            const c = comps(r);
            return (
              c.some((x) => x.types.includes("street_number")) &&
              c.some((x) => x.types.includes("route"))
            );
          }) ?? results[0];
        if (!hit) return null;
        const c = comps(hit);
        const country =
          c.find((x) => x.types.includes("country"))?.short.toUpperCase() ?? "";
        return {
          address: addressFromComponents(c, country, ""),
          country,
          line: hit.formatted_address,
        };
      } catch {
        return null;
      }
    },
  };
}

/** «Friedrichstraße» + «43» → the line as the country writes it («Friedrichstraße 43», «10 Downing Street»). */
export function streetLine(
  country: string,
  street: string,
  number: string,
): string {
  const parts = NUMBER_FIRST.has(country) ? [number, street] : [street, number];
  return parts.filter(Boolean).join(" ");
}

/**
 * One «Street and house number» line → the two fields the shop wants:
 * "Friedrichstraße 43" → street + "43"; "Hauptstr. 5 a", "Bahnhofstr. 12-14"
 * and "Straße des 17. Juni 100" split at the trailing number; «10 Downing
 * Street» at the leading one.
 */
export function splitStreet(line: string): { street: string; build: string } {
  const text = line.trim().replace(/\s+/g, " ");
  const tail = text.match(
    /^(.+?),?\s+(\d+(?:\s?[a-zA-Z])?(?:\s?[-–/]\s?\d+(?:\s?[a-zA-Z])?)?)$/,
  );
  if (tail) return { street: tail[1], build: tail[2] };
  const head = text.match(
    /^(\d+(?:\s?[a-zA-Z])?(?:\s?[-–/]\s?\d+[a-zA-Z]?)?),?\s+(.+)$/,
  );
  if (head) return { street: head[2], build: head[1] };
  return { street: text, build: "" };
}
