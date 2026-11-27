"use client";

import Script from "next/script";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui";
import { asset } from "@/lib/asset";
import { refreshCart } from "@/lib/cart";
import { forgetGatewaySession, gatewayTransport } from "@/lib/gateway";
import { gatewayUrl } from "@/lib/lk/config";
import { followLayoutCart, loadMemberCart } from "@/lib/lk/memberCart";
import { getToken } from "@/lib/lk/session";
import { setShopTransport } from "@/lib/shopApi";
import { RU_BASE, RU_CART_KEY } from "@/lib/ru/shop";
import { useRuMember } from "@/lib/ru/live";
import menu from "@/components/checkout/CountryMenu.module.css";
import { RuCityButton, RuCitySheet } from "./RuCity";

/** Телефон и планшет (до 1024px) — там на странице товара своя верхняя полоса вместо шапки магазина. */
const PHONE = "(max-width: 1023px)";
function usePhone(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(PHONE);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
}

/**
 * Рамка магазина России: общий Layout продукта (шапка, нижнее меню на телефоне, бейдж корзины) и, когда
 * участник вошёл, запросы магазина через шлюз чек-аута с его токеном. Корзина в Layout — гостевая
 * (в браузере) до входа и корзина участника после него. Личного кабинета нет: «Войти» ведёт на вход.
 */
export function RuShell({ children }: { children: ReactNode }) {
  const member = useRuMember();
  const path = usePathname() ?? "";

  useEffect(() => {
    if (!member) return;
    setShopTransport(gatewayTransport({ baseUrl: gatewayUrl(), getToken }));
    refreshCart();
    const stop = followLayoutCart(); // копия корзины участника для оформления
    void loadMemberCart();
    return () => {
      stop();
      setShopTransport(null);
      forgetGatewaySession();
    };
  }, [member]);

  const links = JSON.stringify({
    home: asset(`${RU_BASE}/`),
    catalog: asset(`${RU_BASE}/#phase`),
    cart: asset(`${RU_BASE}/cart/`),
    me: asset(`${RU_BASE}/login/`),
  });
  const active = path.startsWith(`${RU_BASE}/cart`)
    ? "cart"
    : path.startsWith(`${RU_BASE}/login`)
      ? "me"
      : new RegExp(`^${RU_BASE}/?$`).test(path)
        ? "home"
        : "";
  const inCheckout = path.startsWith(`${RU_BASE}/checkout`);
  // страница товара на телефоне: без шапки (кнопки «назад» и «поделиться» — над фото, как у маркетплейсов)
  const phone = usePhone();
  const pdpPhone = phone && path.startsWith(`${RU_BASE}/product/`);
  // как на главной магазина: на главной нижнее меню появляется, когда докрутили до первого раздела после обложки
  const isHome = active === "home";

  return (
    <>
      <Script src={asset("/layout/layout.js")} strategy="afterInteractive" />
      {/* источник корзины Layout выбирает один раз за загрузку страницы: ждём, пока станет известно, вошёл ли участник */}
      {member !== null && (
        <cc-layout
          key={`${member ? "member" : "guest"}-${isHome ? "home" : "page"}`}
          {...(isHome ? { "reveal-after": "phase" } : {})}
          locale="ru"
          {...(member ? {} : { cart: "local", "cart-key": RU_CART_KEY })}
          tabs="home catalog cart me"
          labels={JSON.stringify({ catalog: "Каталог", me: member ? "Аккаунт" : "Войти" })}
          links={links}
          active={active}
          {...(inCheckout ? { parts: "header" } : pdpPhone ? { parts: "tabbar" } : {})}
        >
          <div slot="corner" style={{ display: "flex", alignItems: "center" }}>
            {!inCheckout && <RuCityButton />}
            <a className={menu.flagBtn} href={asset(`${RU_BASE}/#phase`)} aria-label="Поиск" style={{ color: "inherit" }}>
              <Icon name="search" />
            </a>
          </div>
        </cc-layout>
      )}
      {children}
      {!inCheckout && <RuCitySheet isHome={isHome} />}
    </>
  );
}
