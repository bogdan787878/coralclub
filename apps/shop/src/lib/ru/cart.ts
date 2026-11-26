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
 * Положить в корзину. Участнику — по артикулу (цену считает сервер), гостю — строкой с ценой участника и
 * зачёркнутой обычной (так он видит корзину; войти или зарегистрироваться — при оформлении заказа).
 */
export function addRu(p: RuProduct, member: boolean, price: string, was?: string, qty = 1): void {
  const store = getStore();
  if (member) {
    void store.add(p.code, qty);
    return;
  }
  void store.add({ coralId: String(p.code), slug: p.slug, name: ruTitle(p), price, ...(was ? { was } : {}), image: p.images[0]?.src }, qty);
}

/**
 * Корзина гостя по текущим ценам: цена участника и зачёркнутая обычная (строки, положенные раньше, могли быть
 * по обычной цене). Пишет в браузер, только если что-то поменялось, и обновляет хранилище.
 */
export function repriceGuestCart(prices: ReadonlyMap<number, { club: number | null; retail: number | null }>, fmt: (n: number) => string): void {
  let lines: LocalLine[];
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(RU_CART_KEY) ?? "[]");
    if (!Array.isArray(raw)) return;
    lines = raw as LocalLine[];
  } catch {
    return;
  }
  let changed = false;
  const next = lines.map((l) => {
    const p = prices.get(Number(l.coralId));
    if (!p || p.club === null) return l;
    const price = fmt(p.club);
    const was = p.retail && p.retail > p.club ? fmt(p.retail) : undefined;
    if (l.price === price && l.was === was) return l;
    changed = true;
    const { was: _old, ...rest } = l;
    void _old;
    return { ...rest, price, ...(was ? { was } : {}) };
  });
  if (!changed) return;
  window.localStorage.setItem(RU_CART_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("cc:cart:refresh"));
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
