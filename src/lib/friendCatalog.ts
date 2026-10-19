/**
 * The "Друг клуба" project's catalog: the first (Hydration) phase of the
 * Russian shop — two sets and the products they are made of — with the real
 * coralclub.ru articles, club prices and bonus points. One normalized shape
 * for the home page, the product page, the cart and the analytics.
 *
 * Club prices are what the shop charges through a friend link; the regular
 * price is club × 1.25 (the shop's flat 20% club discount).
 */
import { asset } from "./asset";
import {
  INCLUDED_PRODUCTS_RU,
  LANDING_PRODUCTS_RU,
  LEAD_PHOTO,
  sitePhotos,
  type BeautySlug,
  type LandingProductRu,
} from "./landingCatalogRu";

export type FriendProduct = {
  slug: string;
  /** Article on coralclub.ru (what the basket link takes). */
  ruId: string;
  /** Short name, as in the cart and in titles. */
  name: string;
  /** Release form: "набор", "60 капсул" … */
  form: string;
  club: number;
  regular: number;
  /** Bonus points (PV) per unit. */
  bonus: number;
  /** One short green tag: what the product is. */
  tag: string;
  lead: string;
  bullets?: string[];
  images: { src: string; alt: string }[];
  elements: { symbol: string; name: string }[];
  howToUse: string;
  manufacturing: LandingProductRu["manufacturing"];
  facts?: LandingProductRu["facts"];
  fullDescription?: string;
  /** A set (shown first, with its own card size). */
  isSet: boolean;
};

const regularOf = (club: number) => Math.round(club * 1.25 * 100) / 100;

const photos = (slug: string, alt: string) => {
  const lead = LEAD_PHOTO[slug];
  const list = [
    ...(lead ? [lead] : []),
    ...sitePhotos(slug).filter((s) => s !== lead),
  ];
  return list.map((src) => ({ src: asset(src), alt }));
};

const fromSet = (
  slug: "hydramax" | "hydramax-plus",
  bonus: number,
  tag: string,
): FriendProduct => {
  const ru = LANDING_PRODUCTS_RU[slug as BeautySlug];
  return {
    slug,
    ruId: ru.ruId,
    name: ru.name,
    form: ru.form.label,
    club: ru.priceRub.club,
    regular: ru.priceRub.regular,
    bonus,
    tag,
    lead: ru.lead,
    bullets: ru.bullets,
    images: photos(slug, ru.name),
    elements: ru.elements,
    howToUse: ru.howToUse,
    manufacturing: ru.manufacturing,
    facts: ru.facts,
    fullDescription: ru.fullDescription,
    isSet: true,
  };
};

const single = (
  slug: string,
  ruId: string,
  form: string,
  club: number,
  bonus: number,
  tag: string,
): FriendProduct => {
  const inc = INCLUDED_PRODUCTS_RU[slug];
  return {
    slug,
    ruId,
    name: inc.name,
    form,
    club,
    regular: regularOf(club),
    bonus,
    tag,
    lead: inc.lead,
    images: [{ src: asset(`/images/products/${slug}.png`), alt: inc.name }],
    elements: inc.elements,
    howToUse: inc.howToUse,
    manufacturing: inc.manufacturing,
    facts: inc.facts,
    fullDescription: inc.fullDescription,
    isSet: false,
  };
};

/** In display order: the sets first, then one by one. */
export const FRIEND_PRODUCTS: FriendProduct[] = [
  fromSet("hydramax-plus", 70, "Набор на 30 дней"),
  fromSet("hydramax", 48, "Набор на 30 дней"),
  single("coral-mine-silver", "2200", "3×10 саше", 1806, 14, "Минералы в воду"),
  single(
    "pentokan",
    "2141",
    "20 шипучих таблеток",
    1118,
    6.5,
    "Калий и витамин C",
  ),
  single("oceanmin", "225115", "15 стиков", 1634, 11, "Магний"),
  single("h-500", "91800", "60 капсул", 2752, 20, "Калий и магний"),
];

export const FRIEND_SETS = FRIEND_PRODUCTS.filter((p) => p.isSet);
export const FRIEND_SINGLES = FRIEND_PRODUCTS.filter((p) => !p.isSet);

export const friendProduct = (slug: string) =>
  FRIEND_PRODUCTS.find((p) => p.slug === slug);

export const friendProductById = (ruId: string) =>
  FRIEND_PRODUCTS.find((p) => p.ruId === ruId);

export const friendPdpHref = (slug: string) => `/friend/product/${slug}/`;
