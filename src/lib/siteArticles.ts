/**
 * The shop numbers its products differently from site to site (Hydramax Plus
 * is 807200 in Germany, 80720 in Russia, 807201 in the US …), and some sites
 * do not sell a product at all. The project's catalog carries the articles of
 * the market's own site (Germany); this table is what each other country's
 * site takes for the same pack. Only the differences are listed, `null` means
 * the site does not sell it. Found by putting every candidate into the basket
 * of each site (the shop's own answer, 30 Oct 2026); the product pages list
 * the same codes under `VENDOR_CODE`.
 */
const OTHER_SITES: Record<string, Record<string, string | null>> = {
  AM: {
    "22201": "2220", // Coral-Mine
    "225115": null, // Oceanmin
    "803800": null, // Hydramax
    "807200": null, // Hydramax Plus
  },
  BY: {
    "22201": "2220", // Coral-Mine
    "803800": "80380", // Hydramax
    "807200": "80720", // Hydramax Plus
  },
  CA: {
    "22201": "2220", // Coral-Mine
    "225115": "2251151", // Oceanmin
    "803800": "803801", // Hydramax
    "807200": "807201", // Hydramax Plus
  },
  CY: {
    "22201": "2220", // Coral-Mine
    "225115": null, // Oceanmin
    "803800": null, // Hydramax
    "807200": null, // Hydramax Plus
  },
  EE: {
    "22201": "22202", // Coral-Mine
  },
  ES: {
    "22201": "22202", // Coral-Mine
    "225115": null, // Oceanmin
  },
  FI: {
    "22201": null, // Coral-Mine
  },
  GB: {
    "22201": "22202", // Coral-Mine
  },
  GE: {
    "22201": "2220", // Coral-Mine
    "803800": "80380", // Hydramax
    "807200": "80720", // Hydramax Plus
  },
  HU: {
    "22201": "22202", // Coral-Mine
  },
  IL: {
    "22201": null, // Coral-Mine
    "225115": null, // Oceanmin
    "803800": "803802", // Hydramax
    "807200": null, // Hydramax Plus
  },
  IT: {
    "22201": "22202", // Coral-Mine
  },
  KZ: {
    "22201": "2220", // Coral-Mine
    "803800": "80380", // Hydramax
    "807200": "80720", // Hydramax Plus
  },
  LT: {
    "22201": "22202", // Coral-Mine
  },
  LV: {
    "22201": "22202", // Coral-Mine
  },
  PL: {
    "22201": "22204", // Coral-Mine
  },
  PT: {
    "22201": null, // Coral-Mine
    "225115": null, // Oceanmin
  },
  RO: {
    "22201": "22202", // Coral-Mine
  },
  RU: {
    "22201": "2220", // Coral-Mine
    "803800": "80380", // Hydramax
    "807200": "80720", // Hydramax Plus
  },
  SK: {
    "22201": "22202", // Coral-Mine
  },
  TR: {
    "22201": null, // Coral-Mine
    "225115": null, // Oceanmin
    "803800": null, // Hydramax
    "807200": null, // Hydramax Plus
  },
  UA: {
    "22201": "22205", // Coral-Mine
    "803800": "80381", // Hydramax
    "807200": "80721", // Hydramax Plus
  },
  US: {
    "22201": "2220", // Coral-Mine
    "225115": "2251151", // Oceanmin
    "803800": "803801", // Hydramax
    "807200": "807201", // Hydramax Plus
  },
  UZ: {
    "22201": "2220", // Coral-Mine
    "225115": null, // Oceanmin
    "803800": "8038283", // Hydramax
    "807200": "8072283", // Hydramax Plus
  },
};

/** The article of the product (by the market's article) on the country's site; `null`: not sold there. */
export function articleFor(country: string, coralId: string): string | null {
  const own = OTHER_SITES[country];
  return own && coralId in own ? own[coralId] : coralId;
}
