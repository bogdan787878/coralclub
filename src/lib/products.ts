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

export type Product = {
  slug: string;
  name: string;
  /** Short line shown on the carousel card. */
  cardTitle: string;
  description: string;
  image: string;
  /** Framing for the packshot inside its tile (object-position). */
  imagePosition?: string;
  rating: number;
  ratingsCount: number;
  reviewsCount: number;
  prices: PriceOption[];
};

function tier(clubPrice: string, regularPrice: string): PriceOption[] {
  return [
    {
      id: "club",
      label: "Club Price",
      note: "25% Savings",
      price: clubPrice,
      cta: { label: "Add to bag", href: "#add-to-bag" },
    },
    {
      id: "regular",
      label: "Regular Price",
      price: regularPrice,
      cta: { label: "Sign up", href: "#sign-up" },
    },
  ];
}

export const PRODUCTS: Product[] = [
  {
    slug: "coral-mine-silver",
    name: "Coral Mine Silver",
    cardTitle: "Coral Minerals for Every Glass",
    description:
      "You can take the best supplements, but if you're dehydrated, your body doesn't actually use them. That's why Coral Club starts with what matters first: the water you drink daily. Everything else builds on top of that.",
    image: "/images/products/coral-mine-silver.png",
    imagePosition: "42% 56%",
    rating: 3.4,
    ratingsCount: 25,
    reviewsCount: 12,
    prices: tier("$475.99", "$875"),
  },
  {
    slug: "pentokan",
    name: "PentoKan K+",
    cardTitle: "Potassium for Every Day",
    description:
      "A soluble potassium and magnesium drink that supports heart rhythm, muscle function and healthy blood pressure — part of the daily hydration layer.",
    image: "/images/products/pentokan.png",
    rating: 4.5,
    ratingsCount: 33,
    reviewsCount: 14,
    prices: tier("$21.99", "$29.99"),
  },
  {
    slug: "oceanmin",
    name: "Oceanmin",
    cardTitle: "Sea Minerals for Every Day",
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
    cardTitle: "Antioxidant Water, Every Day",
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
    cardTitle: "Gentle Daily Cleanse",
    description:
      "A seven-day pack that supports the body's natural cleansing — antioxidants, fibre and a lecithin-based binder that eases the internal load before you go deeper.",
    image: "/images/products/coral-detox-plus.png",
    rating: 4.4,
    ratingsCount: 28,
    reviewsCount: 11,
    prices: tier("$79.99", "$106.99"),
  },
  {
    slug: "parashield",
    name: "Parashield",
    cardTitle: "Herbal Cleanse Support",
    description:
      "A concentrated blend of black walnut, clove and wormwood — traditional botanicals used to keep the gut environment inhospitable to unwanted guests.",
    image: "/images/products/parashield.png",
    rating: 4.3,
    ratingsCount: 19,
    reviewsCount: 8,
    prices: tier("$27.99", "$37.99"),
  },
  {
    slug: "colo-vada-plus",
    name: "Colo-Vada Plus",
    cardTitle: "Deep Intestinal Cleanse",
    description:
      "A structured 14-day programme in three stages — preparation, active cleanse and recovery — for a thorough reset of the digestive tract.",
    image: "/images/products/colo-vada-plus.png",
    rating: 4.6,
    ratingsCount: 47,
    reviewsCount: 22,
    prices: tier("$63.99", "$85.99"),
  },
  {
    slug: "promarine-collagen",
    name: "Promarine Collagen",
    cardTitle: "Marine Collagen, Every Day",
    description:
      "Marine collagen peptides as a daily drink — for skin, hair and joints. Part of your daily beauty ritual, built on proper hydration.",
    image: "/images/products/promarine-collagen.png",
    rating: 4.7,
    ratingsCount: 52,
    reviewsCount: 24,
    prices: tier("$44.99", "$59.99"),
  },
  {
    slug: "omega-3-60",
    name: "Omega 3/60",
    cardTitle: "Essential Fatty Acids",
    description:
      "High-concentration fish oil — 60% omega-3 — for heart, brain and joint support once your hydration and cleansing layers are in place.",
    image: "/images/products/omega-3-60.png",
    rating: 4.5,
    ratingsCount: 38,
    reviewsCount: 16,
    prices: tier("$23.99", "$31.99"),
  },
  {
    slug: "spirulina",
    name: "Spirulina",
    cardTitle: "Green Whole-Food Nutrition",
    description:
      "A dense whole-food source of plant protein, chlorophyll and iron — an easy daily top-up for a personalised nutrition plan.",
    image: "/images/products/spirulina.png",
    rating: 4.4,
    ratingsCount: 41,
    reviewsCount: 17,
    prices: tier("$18.99", "$25.99"),
  },
];

export function getProduct(slug: string): Product | undefined {
  const product = PRODUCTS.find((p) => p.slug === slug);
  return product ? { ...product, image: asset(product.image) } : undefined;
}

export const productHref = (slug: string) => `/products/${slug}`;

/* -------------------------------------------------------------------------- */
/* Health Concept 2.0 — phases                                               */
/* -------------------------------------------------------------------------- */

/** Serialisable card summary passed to the (client) phases section. */
export type PhaseProductCard = {
  slug: string;
  name: string;
  title: string;
  price: string;
  image: string;
  imagePosition?: string;
};

export type PhaseView = {
  /** Also the theme id — see PhasesSection.module.css `[data-phase]`. */
  id: "hydration" | "restart" | "personalization";
  index: number;
  name: string;
  /** Carousel heading for this phase. */
  tagline: string;
  products: PhaseProductCard[];
};

const PHASE_DEFS: Array<Omit<PhaseView, "products"> & { slugs: string[] }> = [
  {
    id: "hydration",
    index: 1,
    name: "Hydration",
    tagline: "The layer that stays active under everything else.",
    slugs: ["coral-mine-silver", "pentokan", "oceanmin", "h-500"],
  },
  {
    id: "restart",
    index: 2,
    name: "Restart",
    tagline: "Reduce the internal load, step by step.",
    slugs: ["coral-detox-plus", "parashield", "colo-vada-plus"],
  },
  {
    id: "personalization",
    index: 3,
    name: "Personalization",
    tagline: "With the foundation in place, aim at your goal.",
    slugs: ["promarine-collagen", "omega-3-60", "spirulina"],
  },
];

export function getPhases(): PhaseView[] {
  return PHASE_DEFS.map(({ slugs, ...phase }) => ({
    ...phase,
    products: slugs
      .map((slug) => getProduct(slug))
      .filter((p): p is Product => Boolean(p))
      .map((p) => ({
        slug: p.slug,
        name: p.name,
        title: p.cardTitle,
        price: p.prices[0].price,
        image: p.image,
        imagePosition: p.imagePosition,
      })),
  }));
}
