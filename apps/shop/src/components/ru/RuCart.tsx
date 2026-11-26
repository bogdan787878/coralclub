"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { asset } from "@/lib/asset";
import { repriceGuestCart } from "@/lib/ru/cart";
import { RU_BASE, RU_CART_KEY, rub } from "@/lib/ru/shop";
import { useRuMember, useRuPrices } from "@/lib/ru/live";
import friend from "@/components/friend/Friend.module.css";

const LOGIN_NEXT = `${RU_BASE}/login/?next=${encodeURIComponent(`${RU_BASE}/checkout/`)}`;

/**
 * Корзина магазина России — приложение корзины (<cc-cart>). Гость: корзина в браузере по ценам участника
 * (зачёркнута обычная), «Оформить заказ» ведёт на страницу входа и регистрации, после входа — в оформление.
 * Участник: его корзина на сервере по его ценам, оформление — /ru/checkout/.
 */
export function RuCart() {
  const member = useRuMember();
  const router = useRouter();
  const prices = useRuPrices();
  const el = useRef<HTMLElement & { imageUrl?: unknown }>(null);

  // гость: строки корзины — по текущим ценам участника (положенные раньше могли быть по обычной)
  useEffect(() => {
    if (member === false && prices.size) repriceGuestCart(prices, rub);
  }, [member, prices]);

  useEffect(() => {
    const node = el.current;
    if (!node || member !== false) return;
    node.imageUrl = (src: string) => (src.startsWith("/") ? asset(src) : src);
  }, [member]);

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const go = (e: Event) => {
      e.preventDefault();
      router.push(member ? `${RU_BASE}/checkout/` : LOGIN_NEXT);
    };
    node.addEventListener("cc:cart:checkout", go);
    return () => node.removeEventListener("cc:cart:checkout", go);
  }, [router, member]);

  if (member === null) return null;

  const links = JSON.stringify({ checkout: asset(member ? `${RU_BASE}/checkout/` : LOGIN_NEXT), shop: asset(`${RU_BASE}/`), login: asset(LOGIN_NEXT) });
  return (
    <div className={`appShell ${friend.page}`}>
      <Script src={asset("/cart/cart.js")} strategy="afterInteractive" />
      {member ? (
        <cc-cart ref={el} key="member" locale="ru" links={links} />
      ) : (
        <cc-cart
          ref={el}
          key="guest"
          cart="local"
          cart-key={RU_CART_KEY}
          locale="ru"
          currency="RUB"
          money-locale="ru-RU"
          links={links}
        />
      )}
    </div>
  );
}
