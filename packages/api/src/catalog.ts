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

/* ---------- разделы каталога и карточка товара (API кабинета, сессия участника) ---------- */

/** Раздел каталога: название и товары (GET /catalog/sections/{code}). null — раздела нет на витрине страны или нет ответа. */
export async function catalogSection(code: string): Promise<{ name: string; products: Product[] } | null> {
  const r = await cc4<{ data?: { name?: string; products?: Raw[] } }>(`/catalog/sections/${encodeURIComponent(code)}`);
  if (!r.ok || !r.json?.data) return null;
  const products = (r.json.data.products ?? []).map(normalizeProduct).filter((p): p is Product => !!p);
  for (const p of products) cache.set(p.code, p);
  return { name: r.json.data.name ?? code, products };
}

/** Фасовка товара (варианты одной позиции: «15 стиков», «2 упаковки по 15 стиков»). */
export type ProductForm = { value: string; description: string; code?: number };
/** Строка таблицы активных веществ. */
export type Ingredient = { name: string; amount: string; percent: string };

/** Товар целиком для страницы товара (GET /catalog/product/{code}). */
export type ProductDetail = Product & {
  brand: string;
  pictures: string[];
  discountPercent: number | null;
  description: string;
  composition: string;
  components: string;
  shelfLife: string;
  storage: string;
  contraindications: string;
  country: string;
  howToUse: string[];
  ingredientsHeader: string;
  ingredients: Ingredient[];
  certificates: { label: string; link: string }[];
  forms: ProductForm[];
  isSupplement: boolean;
  shareLink: string;
};

const text = (v: unknown): string => (typeof v === "string" ? v.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/[ \t]+/g, " ").trim() : "");

export async function catalogProduct(code: number | string): Promise<ProductDetail | null> {
  const r = await cc4<{ data?: Record<string, unknown> }>(`/catalog/product/${encodeURIComponent(String(code))}`);
  const d = r.json?.data;
  if (!r.ok || !d) return null;
  const base = normalizeProduct(d as Raw);
  if (!base) return null;
  const pictures = Array.isArray(d.detailPictures) ? (d.detailPictures as unknown[]).filter((x): x is string => typeof x === "string") : [];
  const recs = (d.recommendations as { items?: { text?: string }[] } | null)?.items ?? [];
  const forms = Array.isArray(d.forms)
    ? (d.forms as { value?: string; description?: string; options?: { value?: string }[]; code?: number }[]).map((f) => ({ value: String(f.value ?? ""), description: text(f.description), code: typeof f.code === "number" ? f.code : undefined }))
    : [];
  return {
    ...base,
    // в ответе по одному товару breadCrumbs — раздел каталога («Энергия и работоспособность»), а не фасовка, как в
    // списках: фасовка — в forms
    note: forms[0]?.description || "",
    image: base.image || pictures[0] || "",
    brand: text(d.brandName),
    pictures: pictures.length ? pictures : base.image ? [base.image] : [],
    discountPercent: typeof d.discountPercent === "number" ? d.discountPercent : null,
    description: text(d.description) || text(d.productDescription),
    composition: text(d.composition),
    components: text(d.components),
    shelfLife: text(d.shelfLife),
    storage: text(d.storageMethod),
    contraindications: text(d.counterIndicationsContent) || text(d.contraindications),
    country: text(d.countryOfOrigin),
    howToUse: [text(d.howToUseContent), ...recs.map((x) => text(x.text))].filter(Boolean),
    ingredientsHeader: text(d.ingredientTableAmountHeader),
    ingredients: Array.isArray(d.ingredientList) ? (d.ingredientList as Ingredient[]).map((i) => ({ name: text(i.name), amount: text(i.amount), percent: text(i.percent) })) : [],
    certificates: Array.isArray(d.certificates) ? (d.certificates as { label?: string; link?: string }[]).filter((c) => c.link).map((c) => ({ label: text(c.label) || "Сертификат", link: String(c.link) })) : [],
    forms,
    isSupplement: d.isBaa === true,
    shareLink: typeof d.shareLink === "string" ? d.shareLink : "",
  };
}

/** Похожие товары (GET /catalog/product/{code}/similar). */
export async function similarProducts(code: number | string): Promise<Product[]> {
  const r = await cc4<{ data?: Raw[] }>(`/catalog/product/${encodeURIComponent(String(code))}/similar`);
  return (r.json?.data ?? []).map(normalizeProduct).filter((p): p is Product => !!p);
}
