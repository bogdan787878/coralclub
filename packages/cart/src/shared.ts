/**
 * Одно хранилище корзины на страницу. Приложение корзины (cart.js) и Layout (layout.js) собираются отдельно и
 * несут каждый свою копию кода хранилища; работает та, что загрузилась первой: она кладёт себя в
 * window.__ccCartStore, вторая берёт её оттуда. Так бейдж в меню и страница корзины видят одно и то же.
 */
import * as own from "./store";

export type Store = typeof own;
type Holder = { __ccCartStore?: Store };

export function getStore(): Store {
  if (typeof window === "undefined") return own;
  const w = window as unknown as Holder;
  return (w.__ccCartStore ??= own);
}
export type { CartState, LocalLine, RawLine, Source, ViewLine } from "./store";
