/** Товары из API кабинета (GET /catalog/products). */
import { cc4 } from "./session";

export type Product = {
  code: number;
  name: string;
  /** форма выпуска: «10 саше» */
  note: string;
  image: string;
  /** цена участника (клубная) */
  club: number | null;
  /** обычная цена, зачёркивается, если выше цены участника */
  retail: number | null;
  currency: string;
  available: boolean;
  bonuses: number | null;
  badges: string[];
};

type Raw = {
  code?: number | string;
  name?: string | null;
  breadCrumbs?: string;
  previewPicture?: string;
  clubAmount?: number | null;
  originalAmount?: number | null;
  retailAmount?: number | null;
  currency?: string;
  isAvailable?: boolean;
  bonuses?: number;
  badges?: { text?: string }[];
};

export function normalizeProduct(raw: Raw): Product | null {
  // код приходит числом или строкой из цифр (артикулы витрин: «807200»)
  const code = typeof raw.code === "number" ? raw.code : typeof raw.code === "string" && /^\d+$/.test(raw.code) ? Number(raw.code) : null;
  if (code === null) return null;

  const club = raw.clubAmount ?? raw.originalAmount ?? raw.retailAmount ?? null;
  return {
    code,
    name: raw.name ?? `Артикул ${code}`,
    note: raw.breadCrumbs ?? "",
    image: raw.previewPicture ?? "",
    club,
    retail: raw.retailAmount ?? null,
    currency: raw.currency ?? "RUB",
    available: raw.isAvailable !== false,
    bonuses: raw.bonuses ?? null,
    badges: (raw.badges ?? []).map((b) => b.text ?? "").filter(Boolean).slice(0, 2),
  };
}

const cache = new Map<number, Product>();

/** Товары по кодам (уже полученные берутся из кэша). Кодов, которых API не вернул, в ответе просто нет. */
export async function fetchProducts(codes: number[]): Promise<Product[]> {
  const need = codes.filter((c) => !cache.has(c));
  if (need.length) {
    const qs = need.map((c) => `products[]=${c}`).join("&");
    const r = await cc4<{ data?: Raw[] }>(`/catalog/products?${qs}`);
    for (const raw of r.json?.data ?? []) {
      const p = normalizeProduct(raw);
      if (p) cache.set(p.code, p);
    }
  }
  return codes.map((c) => cache.get(c)).filter((p): p is Product => !!p);
}

/** Раздел «Гидратация» магазина РФ (coralclub.ru/shop/hydration/). */
export const HYDRATION_CODES = [80720, 80380, 91800, 2201, 2221, 91883, 225115];

export const money = (n: number, currency = "RUB"): string =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(n);
