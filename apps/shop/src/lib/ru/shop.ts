/**
 * Магазин России: каталог, адреса и цены.
 *
 * Каталог — content/ru/catalog.json (scripts/sync-ru-catalog.mjs): что продаётся на витрине России (API магазина),
 * фазы, домены здоровья и наборы — из канона продуктов (Product Master). Фото — наши пэкшоты (первые два), где они
 * есть, иначе фото с сайта магазина. Цены и наличие — из API на лету, по городу покупателя (см. ./live, ./city).
 */
import catalog from "../../../content/ru/catalog.json";

/** Корень магазина: «/ru» внутри общего сайта, «» в отдельной сборке магазина России (DEPLOY_TARGET=ru). */
export const RU_BASE = process.env.NEXT_PUBLIC_RU_BASE ?? "/ru";
export const RU_CART_KEY = "coralclub.cart.ru";
/** Сайт магазина России: баннеры акций. */
export const RU_SITE = "https://coralclub.ru";

/** Запись content/ru/catalog.json. */
type Raw = {
  code: number;
  slug: string;
  name: string;
  pack: string;
  phase: string[];
  domains: string[];
  primary: string;
  beauty: string[];
  set: boolean;
  parts: number[];
  codes: number[];
  lead: string;
  feat: string[];
  form: string;
  own: string[];
  /** пэкшот на сером фоне (картинка карточки каталога сайта) */
  preview?: string;
  pictures: string[];
};
type Img = { src: string; alt: string };

export type RuProduct = {
  slug: string;
  /** артикул витрины России */
  code: number;
  /** все артикулы товара (фасовки): хиты и акции сайта приходят с любым из них */
  codes: number[];
  name: string;
  /** подпись после названия («набор на 30 дней», «3×10 саше»); пусто — только название */
  form: string;
  /** фасовка с сайта («60 капсул») */
  pack: string;
  /** зелёная метка над названием */
  tag: string;
  phase: string[];
  domains: string[];
  beauty: string[];
  set: boolean;
  /** что входит в набор (артикулы) */
  parts: number[];
  lead: string;
  /** теги страницы товара: «Без сои», «Без глютена», «Халяль» (канон) */
  feat: string[];
  /** форма выпуска: «Капсулы», «Таблетки», «Саше и стики» (канон) */
  release: string;
  images: Img[];
  /** фото товара с сайта магазина */
  pictures: string[];
  /** галерея страницы товара по раскадровке гайда (/pdp-guide/): если есть — вместо фото карточки и сайта */
  gallery?: Img[];
};

/** Домены здоровья канона — коротко, для метки карточки и переключателя «Баланса». */
export const DOMAIN_SHORT: Record<string, string> = {
  energy: "Энергия",
  metabolism_weight: "Метаболизм",
  sleep_stress: "Сон и стресс",
  digestive_gut_health: "Пищеварение",
  immunity: "Иммунитет",
  skin_hair_nails: "Кожа и волосы",
  bones_joints: "Суставы",
  healthy_aging: "Долголетие",
  hormonal_balance: "Гормоны",
  heart_cardiovascular: "Сердце",
  brain_focus_memory: "Мозг и память",
  blood_sugar: "Сахар",
  vision_eye_care: "Зрение",
  reproductive_health: "Женское здоровье",
};
/** Полные названия доменов (канон). */
export const DOMAIN_NAME = catalog.domains as Record<string, string>;

/** Второй пэкшот карточки — квадратная сцена вместо вертикальной (как на главной магазина). */
const SQUARE_SHOT: Record<string, string> = {
  "hydramax-plus": "/images/products/ChatGPT Image Sep 12, 2026 at 01_00_26 AM.png",
  oceanmin: "/images/products/ChatGPT Image Sep 14, 2026 at 12_22_20 AM.png",
  "h-500": "/images/products/ChatGPT Image Sep 14, 2026 at 12_14_21 AM.png",
};

/** Своё у товаров главной: подпись после названия и метка (остальным — метка по фазе или домену). */
const OWN_COPY: Record<number, { form?: string; tag?: string; name?: string }> = {
  80720: { form: "набор на 30 дней", tag: "Набор на 30 дней" },
  2200: { form: "3×10 саше", tag: "Минерализация", name: "Корал-Майн Сильвер" },
  2141: { form: "20 шипучих таблеток", tag: "Калий и магний" },
  225115: { form: "15 стиков", tag: "Магний" },
  91800: { form: "60 капсул", tag: "Антиоксидант" },
  8035007: { form: "набор на 30 дней", tag: "Набор на 30 дней" },
  80320: { tag: "Набор" },
  1200: { name: "Коло-Вада Плюс", form: "программа на 14 дней", tag: "Программа" },
  5800: { name: "LIŪMI Полная коллекция", tag: "Набор" },
};

/** Галереи PDP по раскадровке: упаковка, объём, claims, применение, состав. */
const g = (slug: string, alts: string[]) => alts.map((alt, i) => ({ src: `/images/products/ru/pdp/${slug}-${i + 1}.webp`, alt }));
const GALLERY: Record<string, Img[]> = {
  "coral-mine-silver": g("coral-mine-silver", [
    "Корал-Майн Сильвер — упаковка",
    "Корал-Майн Сильвер в интерьере: пакет, саше и стакан воды",
    "Корал-Майн: природный коралл из Японии; кальций, магний, натрий и калий; серебро и витамин C",
    "Как применять Корал-Майн: 1 саше на 1,5 л воды",
    "Состав Корал-Майн Сильвер на 1 саше",
  ]),
  // без «Как принимать» и составов ПентоКан, Оушенмин, H-500 (на картинках ошибки) — добавить, когда поправят
  "hydramax-plus": g("hydramax-plus", [
    "Гидрамакс Плюс — коробка набора",
    "Гидрамакс Плюс: коробка и всё, что внутри — Корал-Майн, ПентоКан, Оушенмин, H-500",
    "Гидрамакс Плюс — набор на 30 дней",
    "Состав: Корал-Майн Сильвер",
  ]),
};

/** «Корал-Майн Cильвер» (латинская C в названии сайта) → кириллица; лишние пробелы. */
const fixName = (s: string) => s.replace(/C(?=[а-яё])/g, "С").replace(/\s+/g, " ").trim();

function tagOf(r: Raw): string {
  if (r.set) return "Набор";
  if (r.phase.includes("hydration")) return "Гидратация";
  if (r.phase.includes("reset")) return "Очищение";
  if (r.beauty.includes("out")) return "Уход";
  return DOMAIN_SHORT[r.primary] ?? DOMAIN_SHORT[r.domains[0] ?? ""] ?? "";
}

function fromRaw(r: Raw): RuProduct {
  const own = OWN_COPY[r.code] ?? {};
  const name = own.name ?? fixName(r.name);
  // наши пэкшоты: первый — квадрат на сером, второй — сцена (как на главной магазина); иначе фото сайта
  const mine = r.own.map((src, i) => (i === 1 && SQUARE_SHOT[r.slug] ? SQUARE_SHOT[r.slug] : src));
  // первым всегда пэкшот на сером: свой или карточка каталога сайта, за ним сцена
  const site = r.preview ? [r.preview, ...r.pictures.filter((x) => x !== r.preview)] : r.pictures;
  const images = (mine.length ? mine : site.slice(0, 2)).map((src) => ({ src, alt: name }));
  return {
    slug: r.slug,
    code: r.code,
    codes: r.codes.includes(r.code) ? r.codes : [r.code, ...r.codes],
    name,
    form: own.form ?? "",
    pack: r.pack,
    tag: own.tag ?? tagOf(r),
    phase: r.phase,
    domains: r.domains,
    beauty: r.beauty,
    set: r.set,
    parts: r.parts,
    lead: r.lead,
    feat: r.feat ?? [],
    release: r.form === "Набор" || r.form === "Уход и косметика" ? "" : (r.form ?? ""),
    images,
    pictures: r.preview ? [r.preview, ...r.pictures.filter((x) => x !== r.preview)] : r.pictures,
    gallery: GALLERY[r.slug],
  };
}

export const RU_PRODUCTS: RuProduct[] = (catalog.products as Raw[]).map(fromRaw);

const bySlug = new Map(RU_PRODUCTS.map((p) => [p.slug, p]));
const byCode = new Map<number, RuProduct>();
for (const p of RU_PRODUCTS) byCode.set(p.code, p);
for (const p of RU_PRODUCTS) for (const c of p.codes) if (!byCode.has(c)) byCode.set(c, p);

export const ruProduct = (slug: string) => bySlug.get(slug);
/** Товар по любому из его артикулов (фасовки). */
export const ruProductByCode = (code: number | string) => byCode.get(Number(code));
/** Товары по артикулам, в том же порядке; тех, что нет на витрине, — нет. */
export const ruProducts = (codes: readonly number[]) => codes.map((c) => byCode.get(c)).filter((p): p is RuProduct => Boolean(p));

export const ruTitle = (p: Pick<RuProduct, "name" | "form">) => (p.form ? `${p.name} – ${p.form}` : p.name);
export const ruHref = (slug: string) => `${RU_BASE}/product/${slug}/`;
/** 10062 → «10 062 ₽», 2257.5 → «2 257,50 ₽». */
export const rub = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).format(n);
