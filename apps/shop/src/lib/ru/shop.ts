/**
 * Новый магазин России (/ru): каталог главной, цены и вход.
 *
 * Механика регистрации (не «Друга клуба»): гость видит обе цены — обычную и цену участника; вошедший участник —
 * только свою. Купить можно после входа или регистрации: корзина гостя живёт в браузере, при входе переносится
 * в корзину участника на сервере, оформление — на сессии участника (как в кабинете).
 *
 * Тексты карточек, цены и наличие — API каталога России (гость: анонимная сессия RU; участник: его сессия);
 * фото товаров — наши пэкшоты (как в «Друге клуба»), на странице товара к ним добавляются фото из API.
 */
import { SQUARE_SHOT } from "@/lib/friendCatalog";
import { getProduct } from "@/lib/products";

export const RU_BASE = "/ru";
export const RU_CART_KEY = "coralclub.cart.ru";
/** Сайт магазина России: баннеры акций. */
export const RU_SITE = "https://coralclub.ru";

export type RuProduct = {
  slug: string;
  /** артикул витрины России */
  code: number;
  name: string;
  form: string;
  /** зелёная метка над названием */
  tag: string;
  images: { src: string; alt: string }[];
  /** галерея страницы товара по раскадровке гайда (/pdp-guide/): если есть — вместо фото карточки и API */
  gallery?: { src: string; alt: string }[];
};

/**
 * Галереи PDP по раскадровке: упаковка, объём, claims, применение, состав.
 * Гидрамакс Плюс: без «Как принимать» (схема на картинке расходится с сайтом) и без составов ПентоКан, Оушенмин,
 * H-500 (в них данные Корал-Майн) — их добавить, когда картинки поправят.
 */
const g = (slug: string, alts: string[]) => alts.map((alt, i) => ({ src: `/images/products/ru/pdp/${slug}-${i + 1}.webp`, alt }));
const GALLERY: Record<string, { src: string; alt: string }[]> = {
  "coral-mine-silver": g("coral-mine-silver", [
    "Корал-Майн Сильвер — упаковка",
    "Корал-Майн Сильвер в интерьере: пакет, саше и стакан воды",
    "Корал-Майн: природный коралл из Японии; кальций, магний, натрий и калий; серебро и витамин C",
    "Как применять Корал-Майн: 1 саше на 1,5 л воды",
    "Состав Корал-Майн Сильвер на 1 саше",
  ]),
  "hydramax-plus": g("hydramax-plus", [
    "Гидрамакс Плюс — коробка набора",
    "Гидрамакс Плюс: коробка и всё, что внутри — Корал-Майн, ПентоКан, Оушенмин, H-500",
    "Гидрамакс Плюс — набор на 30 дней",
    "Состав: Корал-Майн Сильвер",
  ]),
};

const LIST: Omit<RuProduct, "images">[] = [
  { slug: "hydramax-plus", code: 80720, name: "Гидрамакс Плюс", form: "набор на 30 дней", tag: "Набор на 30 дней" },
  { slug: "coral-mine-silver", code: 2200, name: "Корал-Майн Сильвер", form: "3×10 саше", tag: "Минерализация воды" },
  { slug: "pentokan", code: 2141, name: "ПентоКан", form: "20 шипучих таблеток", tag: "Калий и магний" },
  { slug: "oceanmin", code: 225115, name: "Оушенмин", form: "15 стиков", tag: "Магний" },
  { slug: "h-500", code: 91800, name: "H-500", form: "60 капсул", tag: "Антиоксидант" },
];

export const RU_PRODUCTS: RuProduct[] = LIST.map((p) => {
  const own = getProduct(p.slug)?.carouselImages ?? [];
  const images = own.slice(0, 2).map((src, i) => (i === 1 && SQUARE_SHOT[p.slug] ? SQUARE_SHOT[p.slug] : src));
  return { ...p, images: images.map((src) => ({ src, alt: p.name })), gallery: GALLERY[p.slug] };
});

/** Наборы — широкой карточкой первыми, затем по одному. */
export const RU_SETS = RU_PRODUCTS.filter((p) => p.slug === "hydramax-plus");
export const RU_SINGLES = RU_PRODUCTS.filter((p) => p.slug !== "hydramax-plus");

export const ruProduct = (slug: string) => RU_PRODUCTS.find((p) => p.slug === slug);
export const ruProductByCode = (code: number | string) => RU_PRODUCTS.find((p) => String(p.code) === String(code));
export const ruTitle = (p: Pick<RuProduct, "name" | "form">) => (p.form ? `${p.name} – ${p.form}` : p.name);
export const ruHref = (slug: string) => `${RU_BASE}/product/${slug}/`;
/** 10062 → «10 062 ₽», 2257.5 → «2 257,50 ₽». */
export const rub = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).format(n);

