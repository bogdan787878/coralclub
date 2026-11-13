/**
 * Язык витрины «Друга клуба» следует за страной магазина (флаг в шапке): Россия — русский, остальные — английский.
 * Страницы собираются статично на английском; на клиенте, когда выбрана Россия, тексты меняются на русские.
 */
import { getFriendCountry, isMultiSite, useFriendCountry, useMultiSite } from "./friendCountry";
import { MARKET } from "./market";

export type Lang = "en" | "ru";

export const langOf = (country: string): Lang => (country === "RU" ? "ru" : "en");

/** Страна, чей магазин сейчас работает (выбранная флагом, если доступно несколько сайтов). */
export function useFriendSite(): string {
  const chosen = useFriendCountry();
  return useMultiSite() ? chosen : MARKET.code;
}

/** Язык страниц (перерисовка при смене страны). */
export const useFriendLang = (): Lang => langOf(useFriendSite());

/** То же вне React (обработчики событий). */
export const getFriendLang = (): Lang => langOf(isMultiSite() ? getFriendCountry() : MARKET.code);

/** Текст на языке страницы: `tr(lang, "Add to cart", "В корзину")`. */
export const tr = <T,>(lang: Lang, en: T, ru: T): T => (lang === "ru" ? ru : en);

/** Язык запросов к API магазина и каталога для страны (`language` / `langss`). */
export const apiLanguageFor = (country: string): string => (country === "RU" ? "ru" : MARKET.apiLanguage);
