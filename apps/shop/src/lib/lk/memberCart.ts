/**
 * Корзина участника. Хозяин корзины: Layout (<cc-layout>, пакет @coral/layout), он показывает её в общем меню и
 * меняет корзину на сервере. Здесь только копия для экранов кабинета (оформление считает итоги по её строкам):
 * локальный store (lib/cart.ts, ключ `coralclub.cart.lk`) обновляется по событию Layout cc:cart:changed.
 */
import "./config";
import { readBasket, type BasketLine } from "@coral/api";
import { type CartLine, replaceCart } from "@/lib/cart";
import { rub } from "./catalog";

export { currentMemberId } from "@coral/api";

function toLines(lines: BasketLine[]): CartLine[] {
  return lines.map(({ code, qty, product: p }) => {
    const member = p?.club ?? null;
    return {
      coralId: String(code),
      slug: String(code),
      name: p?.name ?? `Артикул ${code}`,
      price: member !== null ? rub(member, p?.currency) : "",
      image: p?.image || undefined,
      was: member !== null && p?.retail && p.retail > member ? rub(p.retail, p.currency) : undefined,
      qty,
    };
  });
}

/** Прочитать корзину с сервера в копию (первый показ, до того как Layout загрузился). */
export async function loadMemberCart(): Promise<boolean> {
  const lines = await readBasket();
  if (!lines) return false;
  replaceCart(toLines(lines));
  return true;
}

/** Копия следует за Layout: каждое изменение корзины в общем меню сразу видно на экранах кабинета. */
export function followLayoutCart(): () => void {
  const on = (e: Event) => {
    const lines = (e as CustomEvent<{ lines?: BasketLine[] }>).detail?.lines;
    if (Array.isArray(lines)) replaceCart(toLines(lines));
  };
  window.addEventListener("cc:cart:changed", on);
  return () => window.removeEventListener("cc:cart:changed", on);
}

/** Сообщить Layout, что корзина изменилась на сервере (например, после оформления заказа). */
export function announceCartChanged(): void {
  window.dispatchEvent(new Event("cc:cart:refresh"));
}
