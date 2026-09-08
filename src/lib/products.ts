/**
 * Product catalogue + Health Concept phases (stand-in data).
 * Later this comes from the external Coral Club store / CMS.
 */

import { asset } from "./asset";

export type PriceOption = {
  id: string;
  label: string;
  /** e.g. "25% Savings" — rendered as an accent sub-label. */
  note?: string;
  price: string;
  /** Primary action for this tier. Club → add to bag; Regular → sign up. */
  cta: { label: string; href: string };
};

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

export type Product = {
  slug: string;
  name: string;
  /** Product id in the coralclub.ru store — powers the cart hand-off. */
  coralId?: string;
  /** Big two-line title on the carousel card. */
  headline: string;
  /** Category pill on the carousel card. */
  category: string;
  /** Short line shown on the carousel card — the goal the product serves. */
  cardTitle: string;
  /** Scenarios this product supports, most relevant first. */
  goals: Goal[];
  description: string;
  /** Packshot path in /public. Omit to render a placeholder tile. */
  image?: string;
  /** Framing for the packshot inside its tile (object-position). */
  imagePosition?: string;
  rating: number;
  ratingsCount: number;
  reviewsCount: number;
  prices: PriceOption[];
};

/**
 * The live Coral Club store. We don't run our own cart — "Add to bag" drops
 * the shopper into coralclub.ru's basket with the product pre-added, using
 * their share-cart link format. `coralId` is the product's id in that store.
 */
const CORAL_SHOP = "https://coralclub.ru/shop/";

export function basketUrl(coralId: string, qty = 1): string {
  return `${CORAL_SHOP}shop_basket.php?${coralId}=${qty}&utm_source=copy-link&utm_medium=cart-recom`;
}

function tier(clubPrice: string, regularPrice: string): PriceOption[] {
  return [
    {
      id: "club",
      label: "Club Price",
      note: "25% Savings",
      price: clubPrice,
      // member price → become a club member to unlock it
      cta: { label: "Become a club member", href: "/account" },
    },
    {
      id: "regular",
      label: "Regular Price",
      price: regularPrice,
      // full price → hand off to the coralclub.ru basket (href filled in
      // from `coralId` below; falls back to the shop root)
      cta: { label: "Add to bag", href: CORAL_SHOP },
    },
  ];
}

const CATALOGUE: Product[] = [
  {
    slug: "coral-mine-silver",
    name: "Coral Mine Silver",
    headline: "Coral Mine — deep-sea minerals",
    category: "Foundation",
    cardTitle: "Better hydration",
    goals: ["hydration", "energy"],
    description:
      "You can take the best supplements, but if you're dehydrated, your body doesn't actually use them. That's why Coral Club starts with what matters first: the water you drink daily. Everything else builds on top of that.",
    image: "/images/products/coral-mine-silver.png",
    coralId: "2221",
    rating: 3.4,
    ratingsCount: 25,
    reviewsCount: 12,
    prices: tier("$475.99", "$875"),
  },
  {
    slug: "pentokan",
    name: "PentoKan K+",
    headline: "PentoKan — potassium & magnesium",
    category: "Foundation",
    cardTitle: "More energy",
    goals: ["energy", "hydration"],
    description:
      "A soluble potassium and magnesium drink that supports heart rhythm, muscle function and healthy blood pressure — part of the daily hydration layer.",
    image: "/images/products/pentokan.png",
    coralId: "2141",
    rating: 4.5,
    ratingsCount: 33,
    reviewsCount: 14,
    prices: tier("$21.99", "$29.99"),
  },
  {
    slug: "oceanmin",
    name: "Oceanmin",
    headline: "Oceanmin — deep-sea magnesium",
    category: "Recovery & calm",
    cardTitle: "Better sleep & calm",
    goals: ["sleep", "energy"],
    description:
      "A deep-sea mineral concentrate in ionic form — magnesium-dominant, drawn from 662 m down in the Pacific. Steady energy and balance for every day.",
    image: "/images/products/oceanmin.png",
    rating: 4.6,
    ratingsCount: 41,
    reviewsCount: 18,
    prices: tier("$26.99", "$35.99"),
  },
  {
    slug: "h-500",
    name: "H-500",
    headline: "H-500 — antioxidant boost",
    category: "Immune support",
    cardTitle: "Immune support",
    goals: ["immune", "energy"],
    description:
      "An alkaline-mineral effervescent tablet. Your daily water, taken further — one of the strongest antioxidant drinks you can make at home.",
    image: "/images/products/h-500.png",
    rating: 4.8,
    ratingsCount: 63,
    reviewsCount: 29,
    prices: tier("$32.99", "$43.99"),
  },
  {
    slug: "coral-detox-plus",
    name: "Coral Detox Plus",
    headline: "Coral Detox Plus — 7-day cleanse",
    category: "Restart",
    cardTitle: "Detox & feel lighter",
    goals: ["detox", "weight"],
    description:
      "A seven-day pack that supports the body's natural cleansing — antioxidants, fibre and a lecithin-based binder that eases the internal load before you go deeper.",
    rating: 4.4,
    ratingsCount: 28,
    reviewsCount: 11,
    prices: tier("$79.99", "$106.99"),
  },
  {
    slug: "parashield",
    name: "Parashield",
    headline: "Parashield — gut botanicals",
    category: "Restart",
    cardTitle: "Detox & feel lighter",
    goals: ["detox", "immune"],
    description:
      "A concentrated blend of black walnut, clove and wormwood — traditional botanicals used to keep the gut environment inhospitable to unwanted guests.",
    rating: 4.3,
    ratingsCount: 19,
    reviewsCount: 8,
    prices: tier("$27.99", "$37.99"),
  },
  {
    slug: "colo-vada-plus",
    name: "Colo-Vada Plus",
    headline: "Colo-Vada Plus — 14-day reset",
    category: "Restart",
    cardTitle: "Weight & metabolism",
    goals: ["weight", "detox"],
    description:
      "A structured 14-day programme in three stages — preparation, active cleanse and recovery — for a thorough reset of the digestive tract.",
    rating: 4.6,
    ratingsCount: 47,
    reviewsCount: 22,
    prices: tier("$63.99", "$85.99"),
  },
  {
    slug: "promarine-collagen",
    name: "Promarine Collagen",
    headline: "Promarine Collagen — marine peptides",
    category: "Skin & hair",
    cardTitle: "Skin & hair",
    goals: ["skin"],
    description:
      "Marine collagen peptides as a daily drink — for skin, hair and joints. Part of your daily beauty ritual, built on proper hydration.",
    rating: 4.7,
    ratingsCount: 52,
    reviewsCount: 24,
    prices: tier("$44.99", "$59.99"),
  },
  {
    slug: "omega-3-60",
    name: "Omega 3/60",
    headline: "Omega 3/60 — fish oil, 60% omega-3",
    category: "Recovery & calm",
    cardTitle: "Better sleep & calm",
    goals: ["sleep", "immune"],
    description:
      "High-concentration fish oil — 60% omega-3 — for heart, brain and joint support once your hydration and cleansing layers are in place.",
    rating: 4.5,
    ratingsCount: 38,
    reviewsCount: 16,
    prices: tier("$23.99", "$31.99"),
  },
  {
    slug: "spirulina",
    name: "Spirulina",
    headline: "Spirulina — whole-food greens",
    category: "Daily nutrition",
    cardTitle: "More energy",
    goals: ["energy", "weight"],
    description:
      "A dense whole-food source of plant protein, chlorophyll and iron — an easy daily top-up for a personalised nutrition plan.",
    rating: 4.4,
    ratingsCount: 41,
    reviewsCount: 17,
    prices: tier("$18.99", "$25.99"),
  },
];

/** Fill each product's "Add to bag" href from its coralclub.ru id. */
export const PRODUCTS: Product[] = CATALOGUE.map((p) => {
  if (!p.coralId) return p;
  const prices = p.prices.map((price) =>
    price.id === "regular"
      ? { ...price, cta: { ...price.cta, href: basketUrl(p.coralId!) } }
      : price,
  );
  return { ...p, prices };
});

export function getProduct(slug: string): Product | undefined {
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) return undefined;
  return {
    ...product,
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
  /** Struck-through "was" price on the card. */
  priceWas: string;
  /** coralclub.ru product id — the card's cart button adds this line. */
  coralId?: string;
  /** coralclub.ru basket link — fallback when there's no local cart. */
  cartHref: string;
  goals: Goal[];
  image?: string;
  imagePosition?: string;
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
        price: p.prices[0].price,
        priceWas: p.prices[1].price,
        coralId: p.coralId,
        cartHref: p.prices[1].cta.href,
        goals: p.goals,
        image: p.image,
        imagePosition: p.imagePosition,
      })),
  }));
}
