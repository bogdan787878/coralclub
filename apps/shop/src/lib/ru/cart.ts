/**
 * Корзина магазина России. Хозяин — общее хранилище корзины (@coral/cart/store), его источник задаёт Layout:
 * гость — корзина в браузере (coralclub.cart.ru), участник — его корзина на сервере (API кабинета).
 * Здесь: чтение для экранов, добавление товара и перенос корзины гостя к участнику после входа.
 */
import { useSyncExternalStore } from "react";
import { addToBasket } from "@coral/api";
import { getStore, type CartState, type LocalLine } from "@coral/cart/store";
import { RU_CART_KEY, ruTitle, type RuProduct } from "./shop";

const SERVER: CartState = { status: "loading", lines: [], busy: false };

/** Состояние корзины (перерисовка при каждом изменении). */
export function useRuCart(): CartState {
  return useSyncExternalStore(
    (cb) => getStore().subscribe(() => cb()),
    () => getStore().cartState(),
    () => SERVER,
  );
}

/** Сколько штук товара в корзине. */
export const qtyOf = (s: CartState, code: number) => s.lines.find((l) => l.id === String(code))?.qty ?? 0;

/**
 * Положить в корзину. Участнику — по артикулу (цену считает сервер), гостю — строкой с обычной ценой
 * (по ней гость и видит корзину; цена участника — после входа).
 */
export function addRu(p: RuProduct, member: boolean, price: string, qty = 1): void {
  const store = getStore();
  if (member) {
    void store.add(p.code, qty);
    return;
  }
  void store.add({ coralId: String(p.code), slug: p.slug, name: ruTitle(p), price, image: p.images[0]?.src }, qty);
}

export const setRuQty = (code: number, qty: number) => void getStore().setQty(String(code), qty);

/** После входа: корзина гостя из браузера — в корзину участника на сервере, затем очищается. */
export async function moveGuestCartToMember(): Promise<number> {
  let lines: LocalLine[] = [];
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(RU_CART_KEY) ?? "[]");
    if (Array.isArray(raw)) lines = raw as LocalLine[];
  } catch {
    return 0;
  }
  let moved = 0;
  for (const l of lines) {
    const code = Number(l.coralId);
    if (!Number.isFinite(code) || !(l.qty > 0)) continue;
    if (await addToBasket(code, l.qty)) moved += l.qty;
  }
  try {
    window.localStorage.removeItem(RU_CART_KEY);
  } catch {
    /* ignore */
  }
  return moved;
}
