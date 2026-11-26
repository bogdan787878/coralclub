"use client";

import Script from "next/script";
import { useEffect, type ReactNode } from "react";
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
    catalog: asset(`${RU_BASE}/#minerals`),
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

  return (
    <>
      <Script src={asset("/layout/layout.js")} strategy="afterInteractive" />
      {/* источник корзины Layout выбирает один раз за загрузку страницы: ждём, пока станет известно, вошёл ли участник */}
      {member !== null && (
        <cc-layout
          key={member ? "member" : "guest"}
          locale="ru"
          {...(member ? {} : { cart: "local", "cart-key": RU_CART_KEY })}
          tabs="home catalog cart me"
          labels={JSON.stringify({ catalog: "Каталог", me: member ? "Аккаунт" : "Войти" })}
          links={links}
          active={active}
          {...(inCheckout ? { parts: "header" } : {})}
        >
          <div slot="corner">
            <a className={menu.flagBtn} href={asset(`${RU_BASE}/#minerals`)} aria-label="Поиск" style={{ color: "inherit" }}>
              <Icon name="search" />
            </a>
          </div>
        </cc-layout>
      )}
      {children}
    </>
  );
}
