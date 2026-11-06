/**
 * Точка входа Layout. Собранный файл (layout.js) подключается сервисами по адресу:
 *   <script src="/coralclub/layout/layout.js" defer></script>
 *   <cc-layout active="me" links='{"cart":"#/cart"}'></cc-layout>
 * Корзина — отдельное приложение (cart.js, <cc-cart>) на странице links.cart.
 */
import { configureApi } from "@coral/api";
import { getStore } from "@coral/cart/store";
import { CcLayout, cartPage } from "./element";

declare global {
  interface Window {
    coralLayout?: { version: string; cart: { open: () => void; count: () => number; refresh: () => Promise<void>; add: (item: number | string | object, qty?: number) => Promise<void> } };
  }
}

export const VERSION = "2.0.0";

if (typeof window !== "undefined" && !window.customElements.get("cc-layout")) {
  // на localhost можно подменить API ключами sessionStorage (см. @coral/api config)
  configureApi({ production: !/^(localhost|127\.0\.0\.1)$/.test(location.hostname) });
  const store = getStore();
  const openCart = () => window.location.assign(cartPage());
  window.coralLayout = { version: VERSION, cart: { open: openCart, count: store.count, refresh: () => store.refresh(true), add: (item, qty) => store.add(item as never, qty) } };
  window.addEventListener("coralclub:cart:open", openCart); // openCart() приложения магазина ведёт на страницу корзины
  window.customElements.define("cc-layout", CcLayout);
}
