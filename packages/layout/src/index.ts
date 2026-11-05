/**
 * Точка входа Layout. Собранный файл (layout.js) подключается сервисами по адресу:
 *   <script src="/coralclub/layout/layout.js" defer></script>
 *   <cc-layout active="me" links='{"checkout":"#/checkout"}'></cc-layout>
 */
import { configureApi } from "@coral/api";
import * as cart from "./cart";
import { CcLayout, listenKeys } from "./element";

declare global {
  interface Window {
    coralLayout?: { version: string; cart: { add: typeof cart.add; open: typeof cart.open; close: typeof cart.close; count: typeof cart.count; refresh: () => Promise<void> } };
  }
}

export const VERSION = "1.1.0";

if (typeof window !== "undefined" && !window.customElements.get("cc-layout")) {
  // адрес сборки для разработки: на localhost можно подменить API ключами sessionStorage (см. @coral/api config)
  configureApi({ production: !/^(localhost|127\.0\.0\.1)$/.test(location.hostname) });
  window.coralLayout = { version: VERSION, cart: { add: cart.add, open: cart.open, close: cart.close, count: cart.count, refresh: () => cart.refresh(true) } };
  window.customElements.define("cc-layout", CcLayout);
  listenKeys();
}
