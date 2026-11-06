/**
 * Точка входа приложения корзины. Собранный файл (cart.js) подключается сервисом по адресу на его странице корзины:
 *   <script src="/coralclub/cart/cart.js" defer></script>
 *   <cc-cart links='{"checkout":"#/checkout","shop":"#/catalog"}'></cc-cart>
 * window.coralCart: add(…), count(), refresh() — для сервисов без своей корзины.
 */
import { configureApi } from "@coral/api";
import { CcCart } from "./element";
import { getStore } from "./shared";

export const VERSION = "1.0.0";

declare global {
  interface Window {
    coralCart?: { version: string; add: (item: number | string | object, qty?: number) => Promise<void>; count: () => number; refresh: () => Promise<void> };
  }
}

if (typeof window !== "undefined" && !window.customElements.get("cc-cart")) {
  // на localhost можно подменить API ключами sessionStorage (см. @coral/api config)
  configureApi({ production: !/^(localhost|127\.0\.0\.1)$/.test(location.hostname) });
  const store = getStore();
  window.coralCart = { version: VERSION, add: (item, qty) => store.add(item as never, qty), count: store.count, refresh: () => store.refresh(true) };
  window.customElements.define("cc-cart", CcCart);
}
