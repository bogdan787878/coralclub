"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import { RuHeaderSearch } from "./RuHeaderSearch";
import { captureRef } from "@/lib/ru/ref";
import shell from "./RuShell.module.css";

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
    catalog: asset(`${RU_BASE}/catalog/`),
    cart: asset(`${RU_BASE}/cart/`),
    me: asset(`${RU_BASE}/login/`),
  });
  const active = path.startsWith(`${RU_BASE}/catalog`)
    ? "catalog"
    : path.startsWith(`${RU_BASE}/cart`)
    ? "cart"
    : path.startsWith(`${RU_BASE}/login`)
      ? "me"
      : new RegExp(`^${RU_BASE}/?$`).test(path)
        ? "home"
        : "";
  const inCheckout = path.startsWith(`${RU_BASE}/checkout`);
  const inSearch = path.startsWith(`${RU_BASE}/search`);
  const router = useRouter();
  // последняя страница перед поиском (рамка живёт между переходами внутри приложения)
  const beforeSearch = useRef("");
  useEffect(() => {
    if (!inSearch) beforeSearch.current = window.location.pathname.replace(process.env.NEXT_PUBLIC_BASE_PATH ?? "", "") + window.location.search;
  }, [path, inSearch]);
  /** Выйти из поиска — туда, откуда пришли (или на главную, если поиск открыли по ссылке). */
  const closeSearch = () => router.push(beforeSearch.current || `${RU_BASE}/`);

  // пригласительная ссылка (?ref=Coral ID) — запомнить, с какой бы страницы магазина ни пришли
  useEffect(() => captureRef(), [path]);

  // переходы как в iOS: ссылки магазина (и в шапке, и в нижнем меню Layout — они в его shadow DOM) открываются
  // внутри приложения, без перезагрузки; новая страница въезжает справа, «назад» — слева
  const [dir, setDir] = useState<1 | -1>(1);
  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.composedPath().find((n): n is HTMLAnchorElement => n instanceof HTMLAnchorElement);
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || !url.pathname.startsWith(`${basePath}${RU_BASE}/`)) return;
      // якорь на этой же странице — пусть браузер прокрутит сам
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
      e.preventDefault();
      setDir(1);
      router.push(url.pathname.slice(basePath.length) + url.search + url.hash);
    };
    const onPop = () => setDir(-1);
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPop);
    };
  }, [router]);
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
          {...(isHome ? { "reveal-after": "phases" } : {})}
          locale="ru"
          {...(member ? {} : { cart: "local", "cart-key": RU_CART_KEY })}
          tabs="home catalog cart me"
          labels={JSON.stringify({ catalog: "Каталог", me: member ? "Аккаунт" : "Войти" })}
          links={links}
          active={active}
          {...(pdpPhone ? { parts: "tabbar" } : {})}
        >
          {/* веб: поиск — сразу поле в шапке; на телефоне — иконка в углу */}
          <div slot="search">
            <RuHeaderSearch />
          </div>
          <div slot="corner" style={{ display: "flex", alignItems: "center" }}>
            {!inCheckout && <RuCityButton />}
            {inSearch ? (
              // в поиске лупа становится крестиком: выйти из режима поиска
              <button type="button" className={`${menu.flagBtn} ${shell.phoneOnly}`} onClick={closeSearch} aria-label="Закрыть поиск" style={{ color: "inherit" }}>
                <Icon name="close" />
              </button>
            ) : (
              // переход внутри приложения, без перезагрузки страницы — поиск появляется плавно
              <Link className={`${menu.flagBtn} ${shell.phoneOnly}`} href={`${RU_BASE}/search/`} aria-label="Поиск" style={{ color: "inherit" }}>
                <Icon name="search" />
              </Link>
            )}
          </div>
        </cc-layout>
      )}
      <div key={path} className={`${shell.page} ${dir > 0 ? shell.forward : shell.back}`}>
        {children}
      </div>
      {!inCheckout && <RuCitySheet isHome={isHome} />}
    </>
  );
}
