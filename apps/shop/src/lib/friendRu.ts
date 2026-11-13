/**
 * Русские названия товаров «Друга клуба» (витрина России). Длинные тексты страницы товара — описание, применение,
 * состав — приходят из API каталога России (guestProductDetail), здесь только то, что видно в карточках и корзине.
 */
import type { FriendProduct } from "./friendCatalog";
import type { Lang } from "./friendLang";

const RU: Record<string, { name: string; form: string; tag: string }> = {
  "hydramax-plus": { name: "Гидрамакс Плюс", form: "набор на 30 дней", tag: "Набор на 30 дней" },
  hydramax: { name: "Гидрамакс", form: "набор на 30 дней", tag: "Набор на 30 дней" },
  "coral-mine-silver": { name: "Корал-Майн Сильвер", form: "", tag: "Минерализация воды" },
  oceanmin: { name: "Оушенмин", form: "15 стиков", tag: "Магний" },
  "h-500": { name: "H-500", form: "120 капсул", tag: "Калий + магний" },
};

/** Название товара на языке страницы (без фасовки). */
export const friendName = (p: Pick<FriendProduct, "slug" | "name">, lang: Lang): string =>
  lang === "ru" ? (RU[p.slug]?.name ?? p.name) : p.name;

/** Фасовка на языке страницы («набор на 30 дней»). */
export const friendForm = (p: Pick<FriendProduct, "slug" | "form">, lang: Lang): string =>
  lang === "ru" ? (RU[p.slug]?.form ?? p.form) : p.form;

/** «Название – фасовка» на языке страницы. */
export function friendTitle(p: Pick<FriendProduct, "slug" | "name" | "form">, lang: Lang): string {
  const name = friendName(p, lang);
  const form = lang === "ru" ? (RU[p.slug]?.form ?? p.form) : p.form;
  return form ? `${name} – ${form}` : name;
}

/** Короткая метка над названием в карточке. */
export const friendTag = (p: Pick<FriendProduct, "slug" | "tag">, lang: Lang): string =>
  lang === "ru" ? (RU[p.slug]?.tag ?? p.tag) : p.tag;
