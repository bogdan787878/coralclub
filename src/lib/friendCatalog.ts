/**
 * The "Friend of the club" project's catalog: the first (Hydration) phase of
 * the shop — two sets and the products they are made of — with the real
 * articles and club prices of the market's shop (euros). Read from the same
 * catalogue as the English prototype, so names, copy, packshots and prices
 * are the originals; one normalized shape for the home page, the product
 * page, the cart and the analytics.
 *
 * Club prices are what the shop charges through a friend link; the regular
 * price is what a guest pays (club × 1.25 — the shop's flat 20% discount).
 */
import { asset } from "./asset";
import { FRIEND_SITE_PHOTOS } from "./friendPhotos.generated";
import { MARKET } from "./market";
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

/**
 * Per-product facts the shared catalogue does not carry: the article and the
 * club price in the shop of this market (read from de.coral.club: a friend
 * session pays exactly this, a guest pays 25% more), bonus points, card copy.
 * PentoKan is not here: the German shop has it out of stock.
 */
const META: Record<
  string,
  { id: string; club: number; bonus: number; tag: string; form: string }
> = {
  "hydramax-plus": {
    id: "807200",
    club: 117,
    bonus: 70,
    tag: "30-day set",
    form: "30-day set",
  },
  hydramax: {
    id: "803800",
    club: 82,
    bonus: 48,
    tag: "30-day set",
    form: "30-day set",
  },
  "coral-mine-silver": {
    // the shop's basket takes 22201 (21 €) and 2221 (10 sachets, 8 €); 2220 is not an article of the site
    id: "22201",
    club: 21,
    bonus: 14,
    tag: "Mineral water",
    form: "",
  },
  oceanmin: {
    id: "225115",
    club: 19,
    bonus: 11,
    tag: "Magnesium",
    form: "15 sachets",
  },
  "h-500": {
    id: "91883",
    club: 58,
    bonus: 20,
    tag: "Potassium + Mg",
    form: "120 capsules",
  },
};

/** In display order: the sets first, then one by one. */
const ORDER = [
  "hydramax-plus",
  "hydramax",
  "coral-mine-silver",
  "oceanmin",
  "h-500",
];

const round2 = (n: number) => Math.round(n * 100) / 100;

const build = (slug: string): FriendProduct | null => {
  const p = getProduct(slug);
  const meta = META[slug];
  if (!p || !meta) return null;
  const alt = p.name;
  return {
    slug,
    coralId: meta.id,
    name: p.name,
    form: meta.form,
    club: meta.club,
    regular: round2(meta.club * 1.25),
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

/** 117 → «117,00 €» (the market's way of writing money). */
export { formatMoney } from "./market";

/** Standard delivery is free over this order sum (the shop's own rule). */
export const FREE_SHIPPING_FROM: number = MARKET.freeShippingFrom;

/** What a cart costs at the regular and the member price, and the difference. */
export function friendTotals(lines: { coralId: string; qty: number }[]) {
  let club = 0;
  let regular = 0;
  for (const l of lines) {
    const p = friendProductById(l.coralId);
    if (!p) continue;
    club += p.club * l.qty;
    regular += p.regular * l.qty;
  }
  return {
    club: round2(club),
    regular: round2(regular),
    saving: round2(regular - club),
  };
}
