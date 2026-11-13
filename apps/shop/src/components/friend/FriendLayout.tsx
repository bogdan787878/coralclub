"use client";

import Script from "next/script";
import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { CountryMenu } from "@/components/checkout";
import { COUNTRY_RU } from "@/components/checkout/labels";
import { asset } from "@/lib/asset";
import { removeItem, replaceCart, useCart } from "@/lib/cart";
import { useFriendLang } from "@/lib/friendLang";
import { friendTitle } from "@/lib/friendRu";
import { loginUrl } from "@/lib/friend";
import { friendProductById } from "@/lib/friendCatalog";
import { friendSiteList, requestFriendCountry, useFriendCountries, useFriendCountry, useMultiSite } from "@/lib/friendCountry";

/**
 * Витрина «Друга клуба» в общем Layout продукта (<cc-layout>, подключается по адресу) вместо своей шапки:
 * та же шапка и нижнее меню, что в кабинете, на английском; корзина — гостевая (coralclub.cart.friend), её
 * страница — /friend/cart/ (приложение корзины). Справа в шапке — флаг страны.
 */
const COUNTRY_NAMES_RU: Record<string, string> = { DE: "Германия", RU: "Россия" };

export function FriendLayout() {
  const path = usePathname() ?? "";
  const country = useFriendCountry();
  const known = useFriendCountries();
  const multiSite = useMultiSite(); // у каждой страны свой сайт магазина (через шлюз или локальный прокси)
  const countries = useMemo<Record<string, string>>(() => (multiSite ? friendSiteList() : known), [multiSite, known]);
  const cart = useCart();
  const lang = useFriendLang();
  const ru = lang === "ru";
  // названия стран в меню флага — на языке страницы
  const names = useMemo<Record<string, string>>(() => (ru ? Object.fromEntries(Object.entries(countries).map(([c, n]) => [c, COUNTRY_NAMES_RU[c] ?? n])) : countries), [ru, countries]);
  // строки корзины хранят название на момент добавления: при смене языка переписываем
  useEffect(() => {
    let changed = false;
    const next = cart.map((l) => {
      const p = friendProductById(l.coralId);
      const name = p ? friendTitle(p, lang) : l.name;
      if (name !== l.name) changed = true;
      return { ...l, name };
    });
    if (changed) replaceCart(next);
  }, [cart, lang]);
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
        locale={ru ? "ru" : "en"}
        cart="local"
        cart-key="coralclub.cart.friend"
        tabs="home catalog cart me"
        labels={JSON.stringify(ru ? { catalog: "Каталог", me: "Войти" } : { catalog: "Shop", me: "Sign in" })}
        links={links}
        active={active}
        {...(inCheckout ? { parts: "header" } : {})}
      >
        {!hasOrder && (
          <div slot="corner">
            <CountryMenu countries={names} value={country} onChange={requestFriendCountry} labels={ru ? COUNTRY_RU : undefined} />
          </div>
        )}
      </cc-layout>
    </>
  );
}
