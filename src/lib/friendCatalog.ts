/**
 * The "Friend of the club" project's catalog: the first (Hydration) phase of
 * the US shop — two sets and the products they are made of — with the real
 * coralclub.us articles and club prices in dollars. Read from the same
 * catalogue as the English prototype, so names, copy, packshots and prices
 * are the originals; one normalized shape for the home page, the product
 * page, the cart and the analytics.
 *
 * Club prices are what the shop charges through a friend link; the regular
 * price is what a guest pays (club × 1.25 — the shop's flat 20% discount).
 */
import { asset } from "./asset";
import { FRIEND_SITE_PHOTOS } from "./friendPhotos.generated";
import { getProduct, type Manufacturing, type ElementInfo } from "./products";

export type FriendProduct = {
  slug: string;
  /** Article on coralclub.us (what the basket link takes). */
  coralId: string;
  name: string;
  /** Release form for the title ("30-day set"); empty when not known. */
  form: string;
  club: number;
  regular: number;
  /** Bonus points per unit. */
  bonus: number;
  /** One short tag: what the product is. */
  tag: string;
  /** First paragraph of the product description. */
  lead: string;
  images: { src: string; alt: string }[];
  elements: ElementInfo[];
  howToUse: string;
  manufacturing: Manufacturing;
  fullDescription?: string;
  topSeller: boolean;
  /** A set (shown first, with its own card size). */
  isSet: boolean;
};

const money = (s: string): number => {
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/** Per-product facts the catalogue does not carry. */
const META: Record<string, { bonus: number; tag: string; form: string }> = {
  "hydramax-plus": { bonus: 70, tag: "30-day set", form: "30-day set" },
  hydramax: { bonus: 48, tag: "30-day set", form: "30-day set" },
  "coral-mine-silver": {
    bonus: 14,
    tag: "Minerals for your water",
    form: "",
  },
  pentokan: {
    bonus: 6.5,
    tag: "Potassium & vitamin C",
    form: "20 effervescent tablets",
  },
  oceanmin: { bonus: 11, tag: "Magnesium", form: "15 sachets" },
  "h-500": {
    bonus: 20,
    tag: "Potassium & magnesium",
    form: "120 capsules",
  },
};

/** In display order: the sets first, then one by one. */
const ORDER = [
  "hydramax-plus",
  "hydramax",
  "coral-mine-silver",
  "pentokan",
  "oceanmin",
  "h-500",
];

const build = (slug: string): FriendProduct | null => {
  const p = getProduct(slug);
  const meta = META[slug];
  if (!p || !meta || !p.coralId) return null;
  const alt = p.name;
  return {
    slug,
    coralId: p.coralId,
    name: p.name,
    form: meta.form,
    club: money(p.prices[0].price),
    regular: money(p.prices[1].price),
    bonus: meta.bonus,
    tag: meta.tag,
    lead: p.description.split("\n\n")[0],
    images: [
      // our own first two photos (Hydramax's only one shows the Plus box)
      ...(slug === "hydramax" ? [] : p.carouselImages.slice(0, 2)),
      // then every photo of the product page on coralclub.us
      ...(FRIEND_SITE_PHOTOS[slug] ?? []).map((n) =>
        asset(`/images/products/us/${n}`),
      ),
    ].map((src) => ({ src, alt })),
    elements: p.elements,
    howToUse: p.howToUse,
    manufacturing: p.manufacturing,
    fullDescription: p.fullDescription,
    topSeller: p.topSeller,
    isSet: p.includedProducts.length > 0,
  };
};

export const FRIEND_PRODUCTS: FriendProduct[] = ORDER.map(build).filter(
  (p): p is FriendProduct => p !== null,
);

export const FRIEND_SETS = FRIEND_PRODUCTS.filter((p) => p.isSet);
export const FRIEND_SINGLES = FRIEND_PRODUCTS.filter((p) => !p.isSet);

export const friendProduct = (slug: string) =>
  FRIEND_PRODUCTS.find((p) => p.slug === slug);

export const friendProductById = (coralId: string) =>
  FRIEND_PRODUCTS.find((p) => p.coralId === coralId);

export const friendPdpHref = (slug: string) => `/friend/product/${slug}/`;

export const formatUsd = (n: number) =>
  `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
