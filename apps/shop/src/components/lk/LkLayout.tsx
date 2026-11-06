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
  const links = JSON.stringify({ cart: asset("/lk/cart/") });
  const active = path.startsWith("/lk/cart") ? "cart" : path.startsWith("/lk/checkout") ? "" : "me";
  return (
    <>
      <Script src={asset("/layout/layout.js")} strategy="afterInteractive" />
      <cc-layout active={active} links={links} />
    </>
  );
}
