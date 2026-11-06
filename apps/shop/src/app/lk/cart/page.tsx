"use client";

import Script from "next/script";
import { asset } from "@/lib/asset";
import { LOGIN_URL } from "@/lib/lk/config";

/**
 * Корзина участника: отдельное приложение корзины (<cc-cart>, пакет @coral/cart), подключённое по адресу.
 * Оформление — следующий отдельный шаг (/lk/checkout/).
 */
export default function LkCartPage() {
  const links = JSON.stringify({ checkout: asset("/lk/checkout/"), shop: `${LOGIN_URL}#/catalog`, login: LOGIN_URL });
  return (
    <>
      <Script src={asset("/cart/cart.js")} strategy="afterInteractive" />
      <cc-cart links={links} />
    </>
  );
}
