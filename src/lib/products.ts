/**
 * Product catalogue. The data lives in content/products/*.json (edited by
 * the CMS at /admin) and is compiled into src/lib/products.generated.ts by
 * scripts/gen-products.mjs (prebuild / predev / `npm run gen`).
 */

import { asset } from "./asset";
import { productHref, shortCategory } from "./catalog";
import {
  GENERATED_DOMAINS,
  GENERATED_PRODUCTS,
  GENERATED_SERIES,
} from "./products.generated";

export { productHref, shortCategory } from "./catalog";

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

/** A single active element shown as a periodic-table-style tile on the PDP. */
export type ElementInfo = {
  /** Element symbol, e.g. "Ca". */
  symbol: string;
  /** Full name, e.g. "Calcium". */
  name: string;
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
  goals: Goal[];
  coralId?: string;
  description: string;
  price: string;
  clubPrice: string;
  carouselImages: string[];
  pdpImages: string[];
  /** Active elements — periodic-table tiles on the PDP. */
  elements?: ElementInfo[];
  /** Dietary / manufacturing badge slugs (see DietaryBadges component). */
  dietaryBadges?: string[];
  /** Shows the "Top Seller" plate on the PDP — set for products that
   *  carry the same badge on the real coralclub.us product page. */
  topSeller?: boolean;
  /** For a set/bundle: slugs of the individual products it's made of —
   *  shown as a mini carousel on the PDP (see IncludedProducts). */
  includedProducts?: string[];
  /** Deprecated — reviews were removed from the PDP and the CMS. */
  rating?: number;
  ratingsCount?: number;
  reviewsCount?: number;
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
  /** Product id in the coralclub.us store — powers the cart hand-off. */
  coralId?: string;
  /** Big two-line title on the carousel card. */
  headline: string;
  /** Category pill. */
  category: string;
  /** Scenarios this product supports, most relevant first. */
  goals: Goal[];
  description: string;
  /** Packshots for the carousel card's image slider. */
  carouselImages: string[];
  /** Packshots for the PDP image slider. */
  pdpImages: string[];
  /** Active elements — periodic-table tiles on the PDP. */
  elements: ElementInfo[];
  /** Dietary / manufacturing badge slugs (see DietaryBadges component). */
  dietaryBadges: string[];
  /** Shows the "Top Seller" plate on the PDP. */
  topSeller: boolean;
  /** For a set/bundle: slugs of the individual products it's made of. */
  includedProducts: string[];
  /** First carousel image — convenience for single-image spots. */
  image?: string;
  /** Deprecated — reviews were removed from the PDP and the CMS. */
  rating?: number;
  ratingsCount?: number;
  reviewsCount?: number;
  howToUse: string;
  manufacturing: Manufacturing;
  prices: PriceOption[];
};

/**
 * The live Coral Club store. We don't have a checkout API yet, so "Add to
 * Cart" reuses coralclub.us's own "share your cart" link to drop the
 * shopper into their basket with the product pre-added. `coralId` is the
 * product's id in that store. REF_MEMBER/REF_CODE/TYPE below are hardcoded
 * parameters that link format requires to work at all — not an
 * affiliate/referral commission mechanism (see src/lib/cart.ts for the
 * fuller explanation).
 */
const CORAL_SHOP = "https://coralclub.us/shop/";
/** Hardcoded — required by coralclub.us's share-cart link format, not a
 *  referral/commission mechanism. */
const REF_MEMBER = "2804051";
const REF_CODE = "722779981462";

export function basketUrl(coralId: string, qty = 1): string {
  return `${CORAL_SHOP}shop_basket.php?${coralId}=${qty}&REF_MEMBER=${REF_MEMBER}&REF_CODE=${REF_CODE}&TYPE=REF-BASKET&utm_source=copy-link&utm_medium=cart-recom`;
}

const numeric = (s: string): number => {
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/** Whole-percent club saving vs the regular price, e.g. "20% Savings". */
function savingNote(regular: string, club: string): string | undefined {
  const r = numeric(regular);
  const c = numeric(club);
  if (r <= 0 || c <= 0 || c >= r) return undefined;
  const pct = Math.round((1 - c / r) * 100);
  return pct > 0 ? `${pct}% Savings` : undefined;
}

function pricesFor(c: ProductContent): PriceOption[] {
  return [
    {
      id: "club",
      label: "Club",
      note: savingNote(c.price, c.clubPrice),
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
    goals: c.goals ?? [],
    description: c.description,
    carouselImages,
    pdpImages,
    elements: c.elements ?? [],
    dietaryBadges: c.dietaryBadges ?? [],
    topSeller: c.topSeller ?? false,
    includedProducts: c.includedProducts ?? [],
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

/** Other products sharing the same category, asset-wrapped, current one excluded. */
export function relatedProducts(slug: string, limit = 12): Product[] {
  const current = PRODUCTS.find((p) => p.slug === slug);
  if (!current) return [];
  return PRODUCTS.filter(
    (p) => p.slug !== slug && p.category === current.category,
  )
    .slice(0, limit)
    .map((p) => getProduct(p.slug))
    .filter((p): p is Product => Boolean(p));
}

/* -------------------------------------------------------------------------- */
/* Health Concept 2.0 — phases                                               */
/* -------------------------------------------------------------------------- */

/** Serialisable card summary passed to the (client) phases section. */
export type PhaseProductCard = {
  slug: string;
  name: string;
  headline: string;
  category: string;
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
  /** The single product that represents the set (SeriesFeature block). */
  seriesSlug?: string;
  products: PhaseProductCard[];
  /** Resolved rep product for the SeriesFeature block (fixed phases only). */
  seriesProduct: Product | null;
};

const PHASE_DEFS: Array<
  Omit<PhaseView, "products" | "image" | "seriesProduct"> & {
    slugs: string[];
    image: string;
  }
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
    seriesSlug: "hydramax-plus",
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
    name: "Personalisation",
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

export type DomainContent = {
  id: string;
  label: string;
  goal: Goal;
  /** Product slugs — each resolves to a real content/products/*.json. */
  products: string[];
};

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
    products: d.products.filter((slug) => !FIXED_PHASE_SLUGS.has(slug)),
  }));
}

/* -------------------------------------------------------------------------- */
/* Product series — a standalone homepage block (large image + product row).  */
/* Data from content/series/*.json, editable in the CMS.                      */
/* -------------------------------------------------------------------------- */

/** One icon + label shown under the series heading (instead of a blurb). */
export type SeriesFeatureItem = {
  /** Small icon, ~24px wide (path under /public). */
  icon: string;
  /** Label, rendered at 16/20. */
  text: string;
};

/** The raw shape of a content/series/*.json file. */
export type SeriesContent = {
  id: string;
  /** Heading — sans lead line. */
  titleLead: string;
  /** Heading — Newton-italic accent line. */
  titleAccent: string;
  /** Supporting paragraph under the heading. Used only when `features` is empty. */
  blurb: string;
  /** Icon + label row shown under the heading, in place of the blurb. */
  features?: SeriesFeatureItem[];
  /** Large image at the top of the block. Empty → placeholder tile. */
  image: string;
  /** Product slugs shown in the carousel, in order. */
  products: string[];
};

export type SeriesView = {
  id: string;
  titleLead: string;
  titleAccent: string;
  blurb: string;
  /** Asset-wrapped icon paths. */
  features: SeriesFeatureItem[];
  /** Asset-prefixed image src, or "" for the placeholder. */
  image: string;
  /** Resolved, asset-wrapped products. */
  products: Product[];
};

export function getSeries(id: string): SeriesView | undefined {
  const c = (GENERATED_SERIES as SeriesContent[]).find((s) => s.id === id);
  if (!c) return undefined;
  return {
    id: c.id,
    titleLead: c.titleLead,
    titleAccent: c.titleAccent,
    blurb: c.blurb,
    features: (c.features ?? [])
      .filter((f) => f.text || f.icon)
      .map((f) => ({ icon: f.icon ? asset(f.icon) : "", text: f.text })),
    image: c.image ? asset(c.image) : "",
    products: c.products
      .map((slug) => getProduct(slug))
      .filter((p): p is Product => Boolean(p))
      // pre-shorten the category tag so the (client) showcase needs no helper
      .map((p) => ({ ...p, category: shortCategory(p.category) })),
  };
}

/** Minimal card for the PDP's "Included Products" strip — image + name +
 *  link only, no price/cart (see IncludedProducts). */
export type IncludedProductCard = {
  slug: string;
  name: string;
  image?: { src: string; alt: string };
};

/** Resolves a set's `includedProducts` slugs to real catalogue entries,
 *  dropping any that don't (or no longer) exist. */
export function resolveIncludedProducts(slugs: string[]): IncludedProductCard[] {
  return slugs
    .map((slug) => getProduct(slug))
    .filter((p): p is Product => Boolean(p))
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      image: p.carouselImages[0] ? { src: p.carouselImages[0], alt: p.name } : undefined,
    }));
}

/** A resolved Product → the serialisable card the (client) carousels render. */
function toCard(p: Product): PhaseProductCard {
  return {
    slug: p.slug,
    name: p.name,
    headline: p.headline,
    category: shortCategory(p.category),
    // main price = club (sale); struck-through "was" price = regular
    price: p.prices[0].price,
    priceWas: p.prices[1].price,
    coralId: p.coralId,
    cartHref: p.prices[1].cta.href,
    goals: p.goals,
    images: p.carouselImages.map((src) => ({ src, alt: p.name })),
  };
}

export function getPhases(): PhaseView[] {
  return PHASE_DEFS.map(({ slugs, image, ...phase }) => ({
    ...phase,
    image: { src: asset(image), alt: `Coral Club ${phase.name} phase` },
    products: slugs
      .map((slug) => getProduct(slug))
      .filter((p): p is Product => Boolean(p))
      .map(toCard),
    // Only renders the SeriesFeature block when a phase opts in with an
    // explicit seriesSlug — no fallback to the first product, so phases
    // without one (e.g. Restart, which uses a `kind: "series"` section
    // instead) don't get an unintended single-product showcase.
    seriesProduct: phase.seriesSlug ? (getProduct(phase.seriesSlug) ?? null) : null,
  }));
}

/**
 * Resolved product cards per personalization domain — pre-computed on the
 * server so <PhasesSection> (a client component) doesn't import the
 * catalogue. Keyed by domain id.
 */
export function getDomainCards(): Record<string, PhaseProductCard[]> {
  const out: Record<string, PhaseProductCard[]> = {};
  for (const d of getDomains()) {
    out[d.id] = d.products
      .map((slug) => getProduct(slug))
      .filter((p): p is Product => Boolean(p))
      .map(toCard);
  }
  return out;
}
