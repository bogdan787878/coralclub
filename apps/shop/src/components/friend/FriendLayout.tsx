"use client";

import Script from "next/script";
import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { CountryMenu } from "@/components/checkout";
import { asset } from "@/lib/asset";
import { removeItem, useCart } from "@/lib/cart";
import { loginUrl } from "@/lib/friend";
import { friendProductById } from "@/lib/friendCatalog";
import { requestFriendCountry, useFriendCountries, useFriendCountry, useMultiSite } from "@/lib/friendCountry";
import { SHOP_SITES } from "@/lib/shopSites";

/**
 * Витрина «Друга клуба» в общем Layout продукта (<cc-layout>, подключается по адресу) вместо своей шапки:
 * та же шапка и нижнее меню, что в кабинете, на английском; корзина — гостевая (coralclub.cart.friend), её
 * страница — /friend/cart/ (приложение корзины). Справа в шапке — флаг страны.
 */
export function FriendLayout() {
  const path = usePathname() ?? "";
  const country = useFriendCountry();
  const known = useFriendCountries();
  const multiSite = useMultiSite(); // через локальный прокси у каждой страны свой сайт магазина
  const countries = useMemo<Record<string, string>>(() => (multiSite ? Object.fromEntries(Object.entries(SHOP_SITES).map(([code, v]) => [code, v.name])) : known), [multiSite, known]);
  const cart = useCart();
  // артикулы прежнего рынка (или снятые с продажи) были бы мёртвыми строками корзины: убираем
  useEffect(() => {
    for (const l of cart) if (!friendProductById(l.coralId)) removeItem(l.coralId);
  }, [cart]);

  const inCheckout = path.startsWith("/friend/checkout");
  // у созданного заказа страна уже выбрана
  const hasOrder = path.startsWith("/friend/checkout/pay") || path.startsWith("/friend/checkout/done");
  const links = JSON.stringify({ home: asset("/friend/"), catalog: asset("/friend/#hydration"), cart: asset("/friend/cart/"), me: loginUrl() });
  const active = path.startsWith("/friend/cart") ? "cart" : /^\/friend\/?$/.test(path) ? "home" : "";
  return (
    <>
      <Script src={asset("/layout/layout.js")} strategy="afterInteractive" />
      <cc-layout
        locale="en"
        cart="local"
        cart-key="coralclub.cart.friend"
        tabs="home catalog cart me"
        labels={JSON.stringify({ catalog: "Shop", me: "Sign in" })}
        links={links}
        active={active}
        {...(inCheckout ? { parts: "header" } : {})}
      >
        {!hasOrder && (
          <div slot="corner">
            <CountryMenu countries={countries} value={country} onChange={requestFriendCountry} />
          </div>
        )}
      </cc-layout>
    </>
  );
}
