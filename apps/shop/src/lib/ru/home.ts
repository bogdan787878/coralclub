/**
 * Главная магазина России — та же главная, что у основного магазина (HeroCarousel, PhaseSwitcherPills,
 * SeriesFeature, DomainCarousel, те же картинки хиро), на русском и на каталоге России. Три фазы:
 * Гидратация, Детокс, Баланс. Сториз и инфоблоков нет.
 *
 * Набор всегда — крупная карточка (SeriesFeature), под ней что в него входит. Состав наборов — как на витрине
 * магазина (поле «Состав» в API), а не как в каноне: у Парашилда в магазине есть МСМ, у Коло-Вада — комплекты.
 */
import { asset } from "@/lib/asset";
import heroImages from "../../../content/hero-images.json";
import hydramaxSeries from "../../../content/series/hydramax-plus.json";
import detoxSeries from "../../../content/series/coral-detox.json";
import goDetoxSeries from "../../../content/series/go-detox.json";
import { RU_DOMAINS, RU_PRODUCTS, type RuProduct } from "./shop";

export type RuPhaseId = "hydration" | "detox" | "balance";

export type RuHero = {
  title: { lead: string[]; accent: string };
  cta: string;
  image: { desktopSrc: string; mobileSrc: string; alt: string };
};

/** Набор: крупная карточка и что в него входит. */
export type RuPack = {
  code: number;
  title?: { lead: string; accent: string };
  blurb?: string;
  /** фото крупной карточки (сцены серии основного сайта); нет — фото товара */
  images?: string[];
  parts: number[];
};

/** Картинка хиро основного сайта (content/hero-images.json), как в content/home.tsx. */
function heroImage(id: string, alt: string): RuHero["image"] {
  const e = heroImages.items.find((i) => i.id === id);
  const desktop = e?.desktop ?? "";
  const mobile = e?.mobile || desktop;
  return { desktopSrc: desktop ? `${asset(desktop)}?v=3` : "", mobileSrc: mobile ? `${asset(mobile)}?v=3` : "", alt };
}

export const RU_PHASES: { id: RuPhaseId; name: string; hero: RuHero }[] = [
  {
    id: "hydration",
    name: "Гидратация",
    hero: {
      title: { lead: ["Система здоровья"], accent: "начинается с воды" },
      cta: "К покупкам",
      image: heroImage("hydration", "Саше Корал-Майн Сильвер и стакан минерализованной воды"),
    },
  },
  {
    id: "detox",
    name: "Детокс",
    hero: {
      title: { lead: ["Легче, спокойнее,"], accent: "яснее" },
      cta: "К покупкам",
      image: heroImage("restart", "Корал Детокс, Парашилд и Коло-Вада Плюс"),
    },
  },
  {
    id: "balance",
    name: "Баланс",
    hero: {
      title: { lead: ["Понять себя.", "Выбрать свой путь."], accent: "Чувствовать себя лучше" },
      cta: "К покупкам",
      image: heroImage("personalization", "Продукты Coral Club для энергии, сна и иммунитета"),
    },
  },
];

/* ------------------------------ Гидратация ------------------------------ */

export const HYDRATION_PACK: RuPack = {
  code: 80720,
  title: { lead: "Одной воды мало.", accent: "Нужны минералы" },
  blurb: "Обычная вода быстро уходит из организма — удерживают её минералы и электролиты.",
  images: hydramaxSeries.images,
  // Корал-Майн Сильвер, ПентоКан, Оушенмин, H-500
  parts: [2200, 2141, 225115, 91800],
};

/* --------------------------------- Детокс --------------------------------- */

/** Три ключевых набора раздела «Очищение» сайта, по шагам программы. */
export const DETOX_PACKS: RuPack[] = [
  {
    code: 8035007,
    title: { lead: "Четыре продукта, одна задача.", accent: "Снизить внутреннюю нагрузку" },
    blurb: "Корал Детокс — ферменты, антиоксиданты, минералы и лецитин: набор на 30 дней, с которого начинается детокс.",
    images: detoxSeries.images,
    // Ассимилятор, H-500, Лецитин подсолнечный, Корал-Майн
    parts: [91118, 91800, 2307, 2220],
  },
  {
    code: 80320,
    title: { lead: "Парашилд.", accent: "Защита кишечника" },
    blurb: "Растительные экстракты, пробиотики и минералы — второй шаг программы очищения.",
    // ПараФайт, Корал Бурдок Рут, МСМ, Супер-Флора, Корал-Майн
    parts: [2124, 91860, 2152, 2150, 2220],
  },
  {
    code: 1200,
    title: { lead: "Что внутри коробки.", accent: "Три этапа, одна последовательность" },
    blurb: "Коло-Вада Плюс — программа на 14 дней: три комплекта по этапам, порошок Коло-Вада Микс и пробиотик на весь курс.",
    images: goDetoxSeries.images,
    // комплект №1, №2, Коло-Вада Микс, комплект №3, Супер-Флора
    parts: [91302, 91303, 91305, 91304, 2150],
  },
];

/* --------------------------------- Баланс --------------------------------- */

export type RuDomain = { id: string; label: string; packs: RuProduct[]; products: RuProduct[] };

export const BALANCE_DOMAINS: RuDomain[] = RU_DOMAINS.map(({ canon, id, label }) => {
  const inDomain = RU_PRODUCTS.filter((p) => p.domains.includes(canon) && p.phase.includes("personalization"));
  return { id, label, packs: inDomain.filter((p) => p.set), products: inDomain.filter((p) => !p.set) };
}).filter((d) => d.packs.length + d.products.length > 0);
