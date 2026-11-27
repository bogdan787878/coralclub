/**
 * Главная магазина России: три фазы на хиро — Гидратация, Красота, Баланс — и что показывать в каждой.
 *
 * Набор всегда идёт одной крупной карточкой, под ним — что в него входит. Состав наборов — как на витрине
 * магазина (поле «Состав» в API), а не как в каноне: у Парашилда в магазине есть МСМ, у Коло-Вада — комплекты.
 */
import { DOMAIN_SHORT, RU_PRODUCTS, ruProducts, type RuProduct } from "./shop";

export type RuPhaseId = "hydration" | "beauty" | "balance";

export type RuHero = {
  title: { lead: string; accent: string };
  body: string;
  image: { desktopSrc: string; mobileSrc: string; alt: string };
};

/** Набор: крупная карточка и что в него входит. */
export type RuPack = { code: number; title: { lead: string; accent: string }; body?: string; parts: number[] };

export const RU_PHASES: { id: RuPhaseId; name: string; hero: RuHero }[] = [
  {
    id: "hydration",
    name: "Гидратация",
    hero: {
      title: { lead: "Система здоровья", accent: "начинается с воды" },
      body: "Минералы в воду каждый день — основа, на которой работает всё остальное.",
      image: { desktopSrc: "/images/hero/ru-water.jpg", mobileSrc: "/images/hero/ru-water.jpg", alt: "Девушка пьёт воду из стакана" },
    },
  },
  {
    id: "beauty",
    name: "Красота",
    hero: {
      title: { lead: "Красота", accent: "изнутри и снаружи" },
      body: "Коллаген, уход за кожей и маски — одна система.",
      image: {
        desktopSrc: "/images/landing/hero-collection.webp",
        mobileSrc: "/images/landing/hero-collection.webp",
        alt: "Коллаген, маски и уход LIŪMI Coral Club",
      },
    },
  },
  {
    id: "balance",
    name: "Баланс",
    hero: {
      title: { lead: "Энергия, сон, иммунитет —", accent: "ваш баланс" },
      body: "Выберите, что важно сейчас, — и соберите свою систему.",
      image: {
        desktopSrc: "/images/hero/ChatGPT Image Sep 13, 2026 at 07_47_43 PM.png",
        mobileSrc: "/images/hero/ChatGPT Image Sep 13, 2026 at 07_47_43 PM.png",
        alt: "Продукты Coral Club для энергии, сна и иммунитета",
      },
    },
  },
];

/* ------------------------------ Гидратация ------------------------------ */

export const HYDRATION_PACK: RuPack = {
  code: 80720,
  title: { lead: "Обогащение воды", accent: "минералами" },
  // Корал-Майн Сильвер, ПентоКан, Оушенмин, H-500
  parts: [2200, 2141, 225115, 91800],
};

/** «Перезагрузка» — раздел «Очищение» сайта: три ключевых набора, по шагам программы. */
export const RESET_PACKS: RuPack[] = [
  {
    code: 8035007,
    title: { lead: "Корал Детокс", accent: "мягкое очищение за 30 дней" },
    // Ассимилятор, H-500, Лецитин подсолнечный, Корал-Майн
    parts: [91118, 91800, 2307, 2220],
  },
  {
    code: 80320,
    title: { lead: "Парашилд", accent: "защита кишечника" },
    // ПараФайт, Корал Бурдок Рут, МСМ, Супер-Флора, Корал-Майн
    parts: [2124, 91860, 2152, 2150, 2220],
  },
  {
    code: 1200,
    title: { lead: "Коло-Вада Плюс", accent: "перезагрузка за 14 дней" },
    // комплект №1, №2, Коло-Вада Микс, комплект №3, Супер-Флора
    parts: [91302, 91303, 91305, 91304, 2150],
  },
];

/* -------------------------------- Красота -------------------------------- */

export const BEAUTY_PACK: RuPack = {
  code: 5800,
  title: { lead: "Уход за лицом", accent: "LIŪMI" },
  parts: [5801, 5802, 5803, 5804, 5805, 5806],
};

/** Красота изнутри: коллаген первым, дальше остальное «IN» канона (кроме воды — она в Гидратации). */
export const BEAUTY_IN: RuProduct[] = [
  ...ruProducts([2260, 2270]),
  ...RU_PRODUCTS.filter((p) => p.beauty.includes("in") && !p.phase.includes("hydration") && ![2260, 2270].includes(p.code)),
];

/** Маски и уход: биоцеллюлозные маски, затем Privilege. */
export const BEAUTY_CARE: RuProduct[] = [
  ...ruProducts([610301, 610101, 610201]),
  ...RU_PRODUCTS.filter((p) => p.name.startsWith("Privilege")),
];

/* --------------------------------- Баланс --------------------------------- */

/** Домены «Баланса» — все домены канона, кроме кожи (она в «Красоте»), где есть товары. */
export const BALANCE_DOMAINS = Object.keys(DOMAIN_SHORT)
  .filter((d) => d !== "skin_hair_nails")
  .map((id) => {
    const inDomain = RU_PRODUCTS.filter((p) => p.domains.includes(id) && p.phase.includes("personalization"));
    return {
      id,
      label: DOMAIN_SHORT[id],
      packs: inDomain.filter((p) => p.set),
      products: inDomain.filter((p) => !p.set && !p.beauty.includes("out")),
    };
  })
  .filter((d) => d.packs.length + d.products.length > 0);
