"use client";

/**
 * «Поделиться корзиной» — реферальная корзина сайта магазина (как кнопка в корзине coralclub.ru):
 *   https://coralclub.ru/shop/shop_basket.php?<артикул>=<кол-во>&…&REF_MEMBER=<Coral ID>&REF_CODE=<реф. код>&TYPE=REF-BASKET
 * По ссылке товары ложатся в корзину сайта, а покупка засчитывается участнику. Участник — тот, кто вошёл; гость —
 * тот, по чьей ссылке он пришёл (?ref=), иначе ссылка без участника. Реферальный код — из API консультантов сайта.
 */
import { ensureMember } from "@coral/api";
import { savedRef } from "./ref";
import { findConsultant } from "./registration";

const SHOP = "https://coralclub.ru";

/**
 * Реферальная часть ссылки (REF_MEMBER, REF_CODE, TYPE) — заранее, при открытии корзины: в Safari системное
 * «Поделиться» открывается только сразу по нажатию, без запросов перед ним. Нет участника — пустая строка.
 */
export async function loadShareRef(member: boolean): Promise<string> {
  const who = member ? String((await ensureMember().catch(() => null)) ?? "") : savedRef();
  if (!who || !/^\d+$/.test(who)) return "";
  const c = await findConsultant({ memberId: who }).catch(() => null);
  return c?.refCode ? `REF_MEMBER=${encodeURIComponent(c.id)}&REF_CODE=${encodeURIComponent(c.refCode)}&TYPE=REF-BASKET` : "";
}

/** Ссылка на корзину сайта с этими товарами (и участником, если он известен). */
export function shareCartUrl(lines: { id: string; qty: number }[], ref: string): string {
  const q = lines.filter((l) => l.id && l.qty > 0).map((l) => `${encodeURIComponent(l.id)}=${l.qty}`);
  if (ref) q.push(ref);
  q.push("utm_source=copy-link", "utm_medium=cart-recom");
  return `${SHOP}/shop/shop_basket.php?${q.join("&")}`;
}
