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

/** Whole-percent club saving vs the regular price, e.g. "Member price −20%". */
function savingNote(regular: string, club: string): string | undefined {
  const r = numeric(regular);
  const c = numeric(club);
  if (r <= 0 || c <= 0 || c >= r) return undefined;
  const pct = Math.round((1 - c / r) * 100);
  return pct > 0 ? `Member price −${pct}%` : undefined;
}

function pricesFor(c: {
  price: string;
  clubPrice: string;
  coralId?: string;
}): PriceOption[] {
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

const EMPTY_MANUFACTURING: Manufacturing = {
  countryOfOrigin: "",
  shippingWeight: "",
  expiration: "",
  storage: "",
  ingredients: "",
  supplementFacts: { servingLabel: "Amount Per Serving", rows: [] },
};

/** A pack (content/series/*.json) that set its own `coralId` — see
 *  SeriesContent — becomes a real Product too, same as anything in
 *  content/products/*.json: its own PDP page, cart button, and slug (the
 *  pack's `id`). Returns null for a pack that's just a marketing block
 *  (no coralId), which is the common case. */
function packAsProduct(c: SeriesContent): Product | null {
  if (!c.coralId) return null;
  const images = c.images ?? [];
  const name = c.name ?? c.heading ?? c.titleLead ?? c.id;
  return {
    slug: c.id,
    name,
    coralId: c.coralId,
    headline: c.headline ?? name,
    category: c.category ?? "Health",
    goals: c.goals ?? [],
    description: c.description ?? c.blurb ?? "",
    carouselImages: images,
    pdpImages: images,
    elements: [],
    dietaryBadges: [],
    topSeller: false,
    includedProducts: c.includedProducts ?? [],
    image: images[0],
    howToUse: c.howToUse ?? "",
    manufacturing: EMPTY_MANUFACTURING,
    prices: pricesFor({
      price: c.price ?? "",
      clubPrice: c.clubPrice ?? "",
      coralId: c.coralId,
    }),
  };
}

export const PRODUCTS: Product[] = [
  ...GENERATED_PRODUCTS.map(fromContent),
  ...(GENERATED_SERIES as SeriesContent[])
    .map(packAsProduct)
    .filter((p): p is Product => Boolean(p)),
];

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

/** The PDP's "More in <label>" section: other products, asset-wrapped,
 *  current one excluded. Prefers the first Personalization domain (the 12
 *  categories with icons on /catalog — content/domains.json) that
 *  includes this product, since that's a broader, curated grouping than
 *  the product's own free-text `category` tag. Falls back to matching
 *  that `category` tag when the product isn't in any domain (e.g. the
 *  fixed Hydration/Restart phase products, or a pack with no domain
 *  entry yet). Returns null when there's nothing to show either way. */
export function relatedProducts(
  slug: string,
  limit = 12,
): { label: string; products: Product[] } | null {
  const current = PRODUCTS.find((p) => p.slug === slug);
  if (!current) return null;

  const domain = (GENERATED_DOMAINS as DomainContent[]).find((d) =>
    d.products.includes(slug),
  );
  if (domain) {
    const products = domain.products
      .filter((s) => s !== slug)
      .map((s) => getProduct(s))
      .filter((p): p is Product => Boolean(p))
      .slice(0, limit);
    if (products.length > 0) return { label: domain.label, products };
  }

  const products = PRODUCTS.filter(
    (p) => p.slug !== slug && p.category === current.category,
  )
    .slice(0, limit)
    .map((p) => getProduct(p.slug))
    .filter((p): p is Product => Boolean(p));
  return products.length > 0
    ? { label: shortCategory(current.category), products }
    : null;
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
  /** Carousel heading for this phase: sans lead + a Newton-italic accent.
   *  Also the fallback SeriesFeature title when `series` has no titleLead
   *  (shouldn't happen in practice, but keeps the type simple). */
  headline: { lead: string; accent: string };
  /** id of a content/series/*.json block (Series Blocks in the CMS) to
   *  show as this phase's own SeriesFeature card, above the phase's
   *  product carousel. Omit for a phase with no such block (e.g. Restart,
   *  which shows a plain carousel here instead — its own series blocks
   *  render further down the homepage, see content/home.tsx). */
  seriesId?: string;
  products: PhaseProductCard[];
  /** Resolved series block for this phase (see seriesId), or null. */
  series: SeriesView | null;
};

const PHASE_DEFS: Array<
  Omit<PhaseView, "products" | "image" | "series"> & {
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
    seriesId: "hydramax-plus",
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

/**
 * The raw shape of a content/series/*.json file — a "pack": a standalone
 * SeriesFeature spotlight, editable in the CMS as its own entity rather
 * than living in the Products collection. Every field below (besides
 * `id`) is optional — fill in only what a given pack needs. Two shapes in
 * practice: a full pack with a heading, description and a carousel of
 * what's included (Coral Detox, Privilege, the Collagen sets), or a bare
 * spotlight with just a heading and a product's own card, nothing else
 * (B-Luron, Women's Balance, Immunity Pack).
 */
export type SeriesContent = {
  id: string;
  /** Two-line heading — sans lead + italic accent. Switches the desktop
   *  layout to text-left/card-right (see SeriesFeature's `blurbTitle`).
   *  Mutually exclusive with `heading`; ignored if both are set. */
  titleLead?: string;
  titleAccent?: string;
  /** Supporting paragraph under `titleLead`/`titleAccent`. */
  blurb?: string;
  /** Plain single-line heading instead of titleLead/titleAccent — for a
   *  bare spotlight with no description (e.g. "The B-Luron Course").
   *  Keeps the older image-beside-text desktop layout, no split. */
  heading?: string;
  /** Big-card photos (own upload via the CMS, not the product's PDP
   *  photos) — a swipeable slider when there's more than one. Empty →
   *  falls back to the product's own PDP images, or a placeholder tile
   *  when there's no product either. */
  images?: string[];
  /** Product slugs shown in the carousel, in order. Omit/empty for a
   *  bare spotlight with no carousel. */
  products?: string[];
  /** Slug of the single sellable product that represents this pack (its
   *  own price/cart), for the SeriesFeature-style card. Omit for a
   *  product LINE with no single bundle SKU (e.g. Privilege) — the card
   *  then falls back to `images` with no price/cart row. */
  product?: string;
  /** Controls display order when several packs render together in the
   *  same spot (ascending, lower first). Packs without a weight sort
   *  after ones that have one, in their existing relative order. */
  weight?: number;

  /** Set `coralId` (and the rest of these) to make this pack a real,
   *  standalone sellable SKU with its own PDP page and cart button —
   *  instead of just referencing an existing one via `product`. For a
   *  bundle that's sold as its own product on coralclub.us but doesn't
   *  need its own separate content/products/*.json entry (e.g. the
   *  Promarine Collagen mask sets). `id` becomes the PDP slug. */
  coralId?: string;
  price?: string;
  clubPrice?: string;
  name?: string;
  headline?: string;
  category?: string;
  goals?: Goal[];
  description?: string;
  includedProducts?: string[];
  howToUse?: string;
};

export type SeriesView = {
  id: string;
  titleLead: string;
  titleAccent: string;
  blurb: string;
  heading: string;
  /** Asset-prefixed big-card photos (see SeriesContent.images). */
  images: string[];
  /** Resolved, asset-wrapped products. */
  products: Product[];
  /** Resolved bundle product, or null when there isn't one (see SeriesContent.product). */
  product: Product | null;
  weight: number | null;
};

export function getSeries(id: string): SeriesView | undefined {
  const c = (GENERATED_SERIES as SeriesContent[]).find((s) => s.id === id);
  if (!c) return undefined;
  return {
    id: c.id,
    titleLead: c.titleLead ?? "",
    titleAccent: c.titleAccent ?? "",
    blurb: c.blurb ?? "",
    heading: c.heading ?? "",
    images: (c.images ?? []).map((p) => asset(p)),
    products: (c.products ?? [])
      .map((slug) => getProduct(slug))
      .filter((p): p is Product => Boolean(p))
      // pre-shorten the category tag so the (client) showcase needs no helper
      .map((p) => ({ ...p, category: shortCategory(p.category) })),
    product: c.product ? (getProduct(c.product) ?? null) : null,
    weight: typeof c.weight === "number" ? c.weight : null,
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
  return PHASE_DEFS.map(({ slugs, image, ...phase }) => {
    // Only renders the SeriesFeature block when a phase opts in with an
    // explicit seriesId — no fallback, so phases without one (e.g.
    // Restart, which uses a `kind: "series"` section instead) don't get
    // an unintended showcase.
    const series = phase.seriesId ? (getSeries(phase.seriesId) ?? null) : null;
    return {
      ...phase,
      image: { src: asset(image), alt: `Coral Club ${phase.name} phase` },
      products: slugs
        .map((slug) => getProduct(slug))
        .filter((p): p is Product => Boolean(p))
        .map(toCard),
      series,
    };
  });
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
