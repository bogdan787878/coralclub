/**
 * Catalogue links + label helpers with **no dependency on the generated
 * product data**. Import these from client components instead of
 * `@/lib/products` so the 100 KB catalogue stays out of their bundle.
 */

/** Product page path for a slug. */
export const productHref = (slug: string) => `/products/${slug}`;

/** Short tag labels for the long coralclub.us category names. */
const CATEGORY_LABEL: Record<string, string> = {
  "Digestive supplements": "Digestive",
  "Vitamins and Vitamin-Like Substances": "Vitamins",
  "Heart and Blood Vessels": "Heart and Blood",
  "Energy and Performance": "More Energy",
  "Omega-3 and phospholipids": "Omega 3",
  "Antistress and Sleep": "Antistress",
  "Water and Mineral balance": "Mineral Balance",
  "Anti-Aging & Longevity": "Anti-Aging",
  "Detox & Cleansing": "Detox",
  "Immune Support": "Immunity",
  "Joints and Bones": "Joints & Bones",
  "Protein shakes": "Protein",
  "Weight Management": "Weight",
};

export const shortCategory = (raw: string): string =>
  CATEGORY_LABEL[raw] ?? raw;
