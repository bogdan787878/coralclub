"use client";

/**
 * Пригласительная ссылка магазина России: /ru/login/?tab=register&ref=<Coral ID дистрибьютора>. По ней открывается
 * регистрация магазина, консультант уже подставлен. ref запоминается в браузере (с любой страницы магазина), так
 * что человек может сначала посмотреть товары и зарегистрироваться позже.
 */
import { RU_BASE } from "./shop";

const KEY = "coralclub.ru.ref";

/** Запомнить ref из адреса страницы, если он есть. */
export function captureRef(): void {
  try {
    const ref = new URLSearchParams(window.location.search).get("ref")?.replace(/\D/g, "") ?? "";
    if (ref) window.localStorage.setItem(KEY, ref);
  } catch {
    /* без хранилища — ref только в этом адресе */
  }
}

/** Coral ID пригласившего: из адреса или запомненный. */
export function savedRef(): string {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("ref")?.replace(/\D/g, "") ?? "";
    return fromUrl || window.localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}

/** Личная пригласительная ссылка дистрибьютора в магазин России. */
export function inviteUrl(memberId: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${window.location.origin}${base}${RU_BASE}/login/?tab=register&ref=${encodeURIComponent(memberId)}`;
}
