/**
 * Product catalogue. The data lives in content/products/*.json (edited by
 * the CMS at /admin) and is compiled into src/lib/products.generated.ts by
 * scripts/gen-products.mjs (prebuild / predev / `npm run gen`).
 */

import { asset } from "./asset";
import { GENERATED_DOMAINS, GENERATED_PRODUCTS } from "./products.generated";

/** Base wellness scenarios — the quiz maps answers onto these. */
export type Goal =
  | "energy"
  | "sleep"
  | "skin"
  | "detox"
  | "weight"
  | "immune"
  | "hydration";

export const GOALS: { id: Goal; label: string }[] = [
  { id: "energy", label: "More energy" },
  { id: "sleep", label: "Better sleep & calm" },
  { id: "skin", label: "Skin & hair" },
  { id: "detox", label: "Detox & feel lighter" },
  { id: "weight", label: "Weight & metabolism" },
  { id: "immune", label: "Immune support" },
  { id: "hydration", label: "Better hydration" },
];

/** One row of the editable Supplement Facts table. */
export type SupplementFactRow = {
  name: string;
  amount: string;
  dv: string;
};

export type SupplementFacts = {
  /** Column header, e.g. "Amount Per Serving — 1 capsule". */
  servingLabel: string;
  rows: SupplementFactRow[];
};

export type Manufacturing = {
  countryOfOrigin: string;
  shippingWeight: string;
  expiration: string;
  storage: string;
  ingredients: string;
  supplementFacts: SupplementFacts;
};

/** The raw shape of a content/products/*.json file. */
export type ProductContent = {
  slug: string;
  name: string;
  headline: string;
  category: string;
  cardTitle: string;
  goals: Goal[];
  coralId?: string;
  description: string;
  price: string;
  clubPrice: string;
  carouselImages: string[];
  pdpImages: string[];
  rating: number;
  ratingsCount: number;
  reviewsCount: number;
  howToUse: string;
  manufacturing: Manufacturing;
};

export type PriceOption = {
  id: string;
  label: string;
  /** e.g. "25% Savings" — rendered as an accent sub-label. */
  note?: string;
  price: string;
  /** Primary action for this tier. Club → become a member; Regular → cart. */
  cta: { label: string; href: string };
};

export type Product = {
  slug: string;
  name: string;
  /** Product id in the coralclub.ru store — powers the cart hand-off. */
  coralId?: string;
  /** Big two-line title on the carousel card. */
  headline: string;
  /** Category pill. */
  category: string;
  /** Short line shown on the carousel card — the goal the product serves. */
  cardTitle: string;
  /** Scenarios this product supports, most relevant first. */
  goals: Goal[];
  description: string;
  /** Packshots for the carousel card's image slider. */
  carouselImages: string[];
  /** Packshots for the PDP image slider. */
  pdpImages: string[];
  /** First carousel image — convenience for single-image spots. */
  image?: string;
  rating: number;
  ratingsCount: number;
  reviewsCount: number;
  howToUse: string;
  manufacturing: Manufacturing;
  prices: PriceOption[];
};

/**
 * The live Coral Club store. We don't run our own cart — "Add to Cart" drops
 * the shopper into coralclub.ru's basket with the product pre-added, using
 * their share-cart link format. `coralId` is the product's id in that store.
 */
const CORAL_SHOP = "https://coralclub.ru/shop/";

export function basketUrl(coralId: string, qty = 1): string {
  return `${CORAL_SHOP}shop_basket.php?${coralId}=${qty}&utm_source=copy-link&utm_medium=cart-recom`;
}

function pricesFor(c: ProductContent): PriceOption[] {
  return [
    {
      id: "club",
      label: "Club",
      note: "25% Savings",
      price: c.clubPrice,
      cta: { label: "Become a club member", href: "/account" },
    },
    {
      id: "regular",
      label: "Regular",
      price: c.price,
      cta: {
        label: "Add to Cart",
        href: c.coralId ? basketUrl(c.coralId) : CORAL_SHOP,
      },
    },
  ];
}

function fromContent(c: ProductContent): Product {
  const carouselImages = c.carouselImages ?? [];
  const pdpImages = c.pdpImages?.length ? c.pdpImages : carouselImages;
  return {
    slug: c.slug,
    name: c.name,
    coralId: c.coralId || undefined,
    headline: c.headline,
    category: c.category,
    cardTitle: c.cardTitle,
    goals: c.goals ?? [],
    description: c.description,
    carouselImages,
    pdpImages,
    image: carouselImages[0],
    rating: c.rating,
    ratingsCount: c.ratingsCount,
    reviewsCount: c.reviewsCount,
    howToUse: c.howToUse ?? "",
    manufacturing: c.manufacturing,
    prices: pricesFor(c),
  };
}

export const PRODUCTS: Product[] = GENERATED_PRODUCTS.map(fromContent);

const withAssets = (paths: string[]) => paths.map((p) => asset(p));

export function getProduct(slug: string): Product | undefined {
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) return undefined;
  return {
    ...product,
    carouselImages: withAssets(product.carouselImages),
    pdpImages: withAssets(product.pdpImages),
    image: product.image ? asset(product.image) : undefined,
  };
}

export const productHref = (slug: string) => `/products/${slug}`;

/* -------------------------------------------------------------------------- */
/* Health Concept 2.0 — phases                                               */
/* -------------------------------------------------------------------------- */

/** Serialisable card summary passed to the (client) phases section. */
export type PhaseProductCard = {
  slug: string;
  name: string;
  headline: string;
  category: string;
  title: string;
  price: string;
  /** Struck-through "was" price on the card (= the club price). */
  priceWas: string;
  /** coralclub.ru product id — the card's cart button adds this line. */
  coralId?: string;
  /** coralclub.ru basket link — fallback when there's no local cart. */
  cartHref: string;
  goals: Goal[];
  /** Packshots for the card's image slider. */
  images: { src: string; alt: string }[];
};

export type PhaseView = {
  /** Also the theme id — see PhasesSection.module.css `[data-phase]`. */
  id: "hydration" | "restart" | "personalization";
  index: number;
  name: string;
  /** Circular thumbnail for the phase switcher. */
  image: { src: string; alt: string };
  /** Carousel heading for this phase: sans lead + a Newton-italic accent. */
  headline: { lead: string; accent: string };
  products: PhaseProductCard[];
};

const PHASE_DEFS: Array<
  Omit<PhaseView, "products" | "image"> & { slugs: string[]; image: string }
> = [
  {
    id: "hydration",
    index: 1,
    name: "Hydration",
    image: "/images/phase-hydration.png",
    headline: {
      lead: "Water alone doesn't hydrate.",
      accent: "Minerals do.",
    },
    slugs: ["coral-mine-silver", "pentokan", "oceanmin", "h-500"],
  },
  {
    id: "restart",
    index: 2,
    name: "Restart",
    image: "/images/phase-restart.png",
    headline: {
      lead: "Willpower doesn't reset your body.",
      accent: "A guided sequence does.",
    },
    slugs: ["coral-detox-plus", "parashield", "colo-vada-plus"],
  },
  {
    id: "personalization",
    index: 3,
    name: "Personalization",
    image: "/images/phase-personalization.png",
    headline: {
      lead: "Generic nutrition doesn't fit you.",
      accent: "A plan for your goal does.",
    },
    slugs: ["promarine-collagen", "omega-3-60", "spirulina"],
  },
];

/* -------------------------------------------------------------------------- */
/* Personalization domains — 12 health areas, each with its own product set   */
/* (data from content/domains.json, matched from coralclub.us categories).    */
/* -------------------------------------------------------------------------- */

/** One product row inside a domain set. */
export type DomainProductRef = {
  /** Our product slug — links to a real PDP when it's one of our own. */
  slug: string;
  /** coralclub.us slug. */
  usSlug: string;
  id: string;
  name: string;
  category: string;
  variant: string;
  /** Regular price, e.g. "$40" — shown as the main price. */
  price: string;
  /** Club price, e.g. "$32" — shown struck through on the card. */
  clubPrice: string;
  usUrl: string;
};

export type DomainContent = {
  id: string;
  label: string;
  goal: Goal;
  products: DomainProductRef[];
};

const OWN_SLUGS = new Set(PRODUCTS.map((p) => p.slug));

/** Does this domain product have a PDP on our site? */
export function domainProductHref(ref: DomainProductRef): {
  href: string;
  external: boolean;
} {
  return OWN_SLUGS.has(ref.slug)
    ? { href: productHref(ref.slug), external: false }
    : { href: ref.usUrl, external: true };
}

/** Slugs already covered by the fixed Hydration + Restart phases — kept out
 *  of the personalization domain sets. */
const FIXED_PHASE_SLUGS = new Set(
  PHASE_DEFS.filter((p) => p.id === "hydration" || p.id === "restart").flatMap(
    (p) => p.slugs,
  ),
);

export function getDomains(): DomainContent[] {
  return (GENERATED_DOMAINS as DomainContent[]).map((d) => ({
    ...d,
    products: d.products.filter((p) => !FIXED_PHASE_SLUGS.has(p.slug)),
  }));
}

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

export function getPhases(): PhaseView[] {
  return PHASE_DEFS.map(({ slugs, image, ...phase }) => ({
    ...phase,
    image: { src: asset(image), alt: `Coral Club ${phase.name} phase` },
    products: slugs
      .map((slug) => getProduct(slug))
      .filter((p): p is Product => Boolean(p))
      .map((p) => ({
        slug: p.slug,
        name: p.name,
        headline: p.headline,
        category: p.category,
        title: p.cardTitle,
        // main price = club (sale); struck-through "was" price = regular
        price: p.prices[0].price,
        priceWas: p.prices[1].price,
        coralId: p.coralId,
        cartHref: p.prices[1].cta.href,
        goals: p.goals,
        images: p.carouselImages.map((src) => ({ src, alt: p.name })),
      })),
  }));
}
