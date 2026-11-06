"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { asset } from "@/lib/asset";

/**
 * Общий Layout продукта (шапка, меню с бейджем корзины) в кабинете на Next. Это отдельный сервис: собранный
 * layout.js подключается по адресу, как в любом другом сервисе, а не импортом из кода.
 */
export function LkLayout() {
  const path = usePathname() ?? "";
  const links = JSON.stringify({ home: asset("/lk/"), cart: asset("/lk/cart/"), me: asset("/lk/me/") }); // каталог и избранное — по умолчанию Layout (пока кабинет на чистом JS)
  const active = /^\/lk\/?$/.test(path) ? "home" : path.startsWith("/lk/cart") ? "cart" : path.startsWith("/lk/checkout") ? "" : "me";
  // внутренние страницы кабинета (кошелёк, заказы, профиль…) — без нижнего меню, как в кабинете на чистом JS
  const inner = /^\/lk\/(wallet|transfer|orders|profile|checkout)/.test(path);
  return (
    <>
      <Script src={asset("/layout/layout.js")} strategy="afterInteractive" />
      <cc-layout active={active} links={links} {...(inner ? { parts: "" } : {})} />
    </>
  );
}
