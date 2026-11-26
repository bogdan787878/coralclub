"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { LocalLine } from "@coral/cart/store";
import { asset } from "@/lib/asset";
import { useRuCart } from "@/lib/ru/cart";
import { RU_BASE, RU_CART_KEY, RU_REGISTRATION_URL, rub } from "@/lib/ru/shop";
import { useRuMember, useRuPrices } from "@/lib/ru/live";
import friend from "@/components/friend/Friend.module.css";
import styles from "./Ru.module.css";

const LOGIN_NEXT = `${RU_BASE}/login/?next=${encodeURIComponent(`${RU_BASE}/checkout/`)}`;

/**
 * Корзина магазина России — приложение корзины (<cc-cart>). Гость: корзина в браузере по обычным ценам,
 * сверху — сколько он сэкономит по цене участника; «Оформить заказ» ведёт на вход (и обратно в оформление).
 * Участник: его корзина на сервере по его ценам, оформление — /ru/checkout/.
 */
export function RuCart() {
  const member = useRuMember();
  const router = useRouter();
  const prices = useRuPrices();
  const cart = useRuCart();
  const el = useRef<HTMLElement & { linePrice?: unknown; imageUrl?: unknown }>(null);

  // гость: цена строки — обычная, под ней цена участника
  useEffect(() => {
    const node = el.current;
    if (!node || member !== false) return;
    node.linePrice = (raw: LocalLine) => {
      const p = prices.get(Number(raw.coralId));
      if (!p || p.club === null) return { now: raw.price };
      const regular = p.retail ?? p.club;
      return { now: rub(regular), save: regular > p.club ? `${rub(p.club * raw.qty)} по цене участника` : "" };
    };
    node.imageUrl = (src: string) => (src.startsWith("/") ? asset(src) : src);
  }, [member, prices]);

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

  let saving = 0;
  if (!member) {
    for (const l of cart.lines) {
      const p = prices.get(Number(l.id));
      if (p?.club != null && p.retail && p.retail > p.club) saving += (p.retail - p.club) * l.qty;
    }
  }

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
          labels={JSON.stringify({ subtotal: "Итого", checkout: "Войти и оформить" })}
        >
          {cart.lines.length > 0 && (
            <div slot="cart-banner" className={styles.cartBanner}>
              <p>
                {saving > 0 ? (
                  <>
                    По цене участника этот заказ дешевле на <strong>{rub(saving)}</strong>.
                  </>
                ) : (
                  "Покупки оформляют участники клуба."
                )}{" "}
                Войдите или зарегистрируйтесь — это бесплатно.
              </p>
              <div className={styles.cartBannerLinks}>
                <Link href={LOGIN_NEXT}>Войти</Link>
                <a href={RU_REGISTRATION_URL} target="_blank" rel="noopener noreferrer">
                  Зарегистрироваться
                </a>
              </div>
            </div>
          )}
        </cc-cart>
      )}
    </div>
  );
}
