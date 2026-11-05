/** Member area: products from the cabinet API (GET /catalog/products). */
import { cc4 } from "./session";

export type LkProduct = {
  code: number;
  name: string;
  /** release form: «10 саше» */
  note: string;
  image: string;
  /** member (club) price */
  club: number | null;
  /** regular price, struck through when higher than the member price */
  retail: number | null;
  currency: string;
  available: boolean;
  bonuses: number | null;
  badges: string[];
  favorite: boolean;
};

type Raw = {
  code?: number;
  name?: string | null;
  breadCrumbs?: string;
  previewPicture?: string;
  clubAmount?: number | null;
  originalAmount?: number | null;
  retailAmount?: number | null;
  currency?: string;
  isAvailable?: boolean;
  isFavorite?: boolean;
  bonuses?: number;
  badges?: { text?: string }[];
};

export function normalizeProduct(raw: Raw): LkProduct | null {
  if (typeof raw.code !== "number") return null;
  const club = raw.clubAmount ?? raw.originalAmount ?? raw.retailAmount ?? null;
  return {
    code: raw.code,
    name: raw.name ?? `Артикул ${raw.code}`,
    note: raw.breadCrumbs ?? "",
    image: raw.previewPicture ?? "",
    club,
    retail: raw.retailAmount ?? null,
    currency: raw.currency ?? "RUB",
    available: raw.isAvailable !== false,
    bonuses: raw.bonuses ?? null,
    badges: (raw.badges ?? []).map((b) => b.text ?? "").filter(Boolean).slice(0, 2),
    favorite: raw.isFavorite === true,
  };
}

const cache = new Map<number, LkProduct>();

/** The products by code (a cache keeps what was already asked). Codes the API does not return are simply absent. */
export async function fetchProducts(codes: number[]): Promise<LkProduct[]> {
  const need = codes.filter((c) => !cache.has(c));
  if (need.length) {
    const qs = need.map((c) => `products[]=${c}`).join("&");
    const r = await cc4<{ data?: Raw[] }>(`/catalog/products?${qs}`);
    for (const raw of r.json?.data ?? []) {
      const p = normalizeProduct(raw);
      if (p) cache.set(p.code, p);
    }
  }
  return codes.map((c) => cache.get(c)).filter((p): p is LkProduct => !!p);
}

/** The «Hydration» section of the Russian shop (coralclub.ru/shop/hydration/). */
export const HYDRATION_CODES = [80720, 80380, 91800, 2201, 2221, 91883, 225115];

export const rub = (n: number, currency = "RUB"): string =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(n);
