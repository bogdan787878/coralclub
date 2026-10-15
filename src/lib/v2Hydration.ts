/**
 * Data for the /v2 homepage — one phase (Hydration), one pack and its parts.
 *
 * Everything shown is read from the catalogue (price, origin, packshot) or
 * from the product's own label/instructions (amounts per serving, how to
 * take it). Nothing here is a health claim: each line says what the product
 * is, how it fits the day, or what the label lists.
 */
import { getProduct, productHref } from "./products";

export type V2Sku = {
  slug: string;
  coralId?: string;
  name: string;
  /** Club (member) price, e.g. "$21". */
  club: string;
  /** Regular price, struck through next to it. */
  regular: string;
  image: string;
  origin: string;
  topSeller: boolean;
  href: string;
  /** When in the day it is taken — the card's tag. */
  role: string;
  /** One plain sentence: what it is and how it is used. */
  line: string;
  /** What the label lists per serving. */
  facts: string;
};

export type V2PackPart = {
  slug: string;
  name: string;
  qty: number;
  line: string;
};

export type V2Pack = {
  slug: string;
  coralId?: string;
  name: string;
  club: string;
  regular: string;
  image: string;
  /** Plain packshot — the cart line's thumbnail. */
  cartImage: string;
  href: string;
  days: number;
  perDay: string;
  /** What the four parts cost bought one by one at member prices. */
  separateTotal: string;
  saving: string;
  parts: V2PackPart[];
};

/** Hydramax Plus contents, as the product's own description states it:
 *  "Coral Mine ×3, PentoKan ×3, H-500 ×1 and Oceanmin ×1". */
const PACK_PARTS: { slug: string; qty: number }[] = [
  { slug: "coral-mine-silver", qty: 3 },
  { slug: "pentokan", qty: 3 },
  { slug: "oceanmin", qty: 1 },
  { slug: "h-500", qty: 1 },
];
const PACK_SLUG = "hydramax-plus";
/** "Program duration — 30 days" (product's own how-to-use). */
const PACK_DAYS = 30;

/** Card copy per product — facts from the label / how-to-use only. */
const SKU_COPY: Record<string, Pick<V2Sku, "role" | "line" | "facts">> = {
  "coral-mine-silver": {
    role: "Every morning",
    line: "Turns your drinking water into mineral water. One sachet per 1.5 L.",
    facts: "Per sachet: calcium 356 mg · magnesium 15 mg · vitamin C 5 mg",
  },
  pentokan: {
    role: "With a meal",
    line: "An effervescent potassium and vitamin C tablet. Dissolves in 60 ml of water or juice.",
    facts: "Per tablet: potassium 420 mg · vitamin C 100 mg · ribose 20 mg",
  },
  oceanmin: {
    role: "After meals",
    line: "A deep-sea mineral concentrate, magnesium-dominant. One sachet in 0.75–1 L of water.",
    facts:
      "Per sachet: magnesium at least 120 mg · sodium at least 90 mg · potassium at least 35 mg",
  },
  "h-500": {
    role: "Twice a day",
    line: "A potassium and magnesium citrate blend in a capsule. One capsule, twice a day.",
    facts: "Per capsule: 300 mg proprietary blend",
  },
};

/** Short line for the pack's contents list. */
const PART_LINE: Record<string, string> = {
  "coral-mine-silver": "Your morning mineral water",
  pentokan: "Potassium and vitamin C for the glass",
  oceanmin: "Deep-sea magnesium concentrate",
  "h-500": "Potassium and magnesium capsule",
};

const num = (s: string): number => {
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const money = (n: number): string =>
  `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

export function getV2Hydration(): { pack: V2Pack; skus: V2Sku[] } {
  const skus: V2Sku[] = [];
  for (const { slug } of PACK_PARTS) {
    const p = getProduct(slug);
    const copy = SKU_COPY[slug];
    if (!p || !copy) continue;
    skus.push({
      slug,
      coralId: p.coralId,
      name: p.name,
      club: p.prices[0].price,
      regular: p.prices[1].price,
      image: p.carouselImages[0] ?? "",
      origin: p.manufacturing.countryOfOrigin,
      topSeller: p.topSeller,
      href: productHref(slug),
      ...copy,
    });
  }

  const pack = getProduct(PACK_SLUG);
  if (!pack) throw new Error(`v2: product "${PACK_SLUG}" is missing`);

  const separate = PACK_PARTS.reduce((sum, { slug, qty }) => {
    const s = skus.find((x) => x.slug === slug);
    return sum + (s ? num(s.club) * qty : 0);
  }, 0);
  const club = num(pack.prices[0].price);

  return {
    pack: {
      slug: pack.slug,
      coralId: pack.coralId,
      name: pack.name,
      club: pack.prices[0].price,
      regular: pack.prices[1].price,
      // the set's own lifestyle shot (PDP gallery) — the plain packshot is a
      // small box on a big canvas and reads as empty at this size
      image: pack.pdpImages[0] ?? pack.carouselImages[0] ?? "",
      cartImage: pack.carouselImages[0] ?? "",
      href: productHref(pack.slug),
      days: PACK_DAYS,
      perDay: money(Math.round((club / PACK_DAYS) * 100) / 100),
      separateTotal: money(separate),
      saving: money(Math.round((separate - club) * 100) / 100),
      parts: PACK_PARTS.map(({ slug, qty }) => ({
        slug,
        qty,
        name: skus.find((s) => s.slug === slug)?.name ?? slug,
        line: PART_LINE[slug] ?? "",
      })),
    },
    skus,
  };
}
