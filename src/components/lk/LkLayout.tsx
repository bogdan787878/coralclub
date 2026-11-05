"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { asset } from "@/lib/asset";

/**
 * Общий Layout продукта (шапка, меню, корзина) в кабинете на Next. Это отдельный сервис: собранный layout.js
 * подключается по адресу, как в любом другом сервисе, а не импортом из кода. Корзина живёт в нём.
 */
export function LkLayout() {
  const path = usePathname() ?? "";
  const links = JSON.stringify({ checkout: asset("/lk/checkout/") });
  return (
    <>
      <Script src={asset("/layout/layout.js")} strategy="afterInteractive" />
      <cc-layout active={path.startsWith("/lk/checkout") ? "" : "me"} links={links} />
    </>
  );
}
