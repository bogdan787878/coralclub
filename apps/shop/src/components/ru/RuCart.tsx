"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { asset } from "@/lib/asset";
import cfLoader from "@/lib/cf-image-loader";
import { repriceGuestCart, useRuCart } from "@/lib/ru/cart";
import { RU_BASE, RU_CART_KEY, RU_PRODUCTS, ruProductByCode, rub, type RuProduct } from "@/lib/ru/shop";
import { useRuMember, useRuPrices } from "@/lib/ru/live";
import { cityKey, useRuCity } from "@/lib/ru/city";
import { loadDelivery } from "@/lib/ru/delivery";
import { loadShareRef, shareCartUrl } from "@/lib/ru/shareCart";
import friend from "@/components/friend/Friend.module.css";
import { RuCards } from "./RuCards";
import styles from "./RuCart.module.css";

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
  const el = useRef<HTMLElement & { imageUrl?: unknown; lineSub?: unknown; shareLink?: unknown }>(null);
  // реферальная корзина: участник (или тот, кто пригласил гостя) — заранее, ссылка по нажатию собирается сразу
  const shareRef = useRef("");
  useEffect(() => {
    if (member === null) return;
    let alive = true;
    loadShareRef(Boolean(member)).then((r) => {
      if (alive) shareRef.current = r;
    });
    return () => {
      alive = false;
    };
  }, [member]);
  const city = useRuCity();
  const [freeFrom, setFreeFrom] = useState<number | null>(null);

  // порог бесплатной доставки в городе покупателя — для полоски «ещё N до бесплатной доставки»
  const cityId = city ? cityKey(city) : "";
  useEffect(() => {
    if (!city) return;
    let alive = true;
    loadDelivery(city).then((list) => {
      const frees = list.filter((o) => o.price > 0).map((o) => o.free).filter((f): f is number => f !== null);
      if (alive) setFreeFrom(frees.length ? Math.min(...frees) : null);
    });
    return () => {
      alive = false;
    };
    // city — новый объект на каждый рендер: следим за ключом
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId]);

  // подпись под названием строки — как на карточке товара (домен или тип: «Суставы», «Набор на 30 дней»)
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    node.lineSub = (id: string) => ruProductByCode(id)?.tag ?? "";
    node.shareLink = (lines: { id: string; qty: number }[]) => shareCartUrl(lines, shareRef.current);
  }, [member]);

  // гость: строки корзины — по текущим ценам участника (положенные раньше могли быть по обычной)
  useEffect(() => {
    if (member === false && prices.size) repriceGuestCart(prices, rub);
  }, [member, prices]);

  useEffect(() => {
    const node = el.current;
    if (!node || member !== false) return;
    // фото строки — через Cloudflare Images (WebP/AVIF, 256 px), а не оригинал PNG
    node.imageUrl = (src: string) => (src.startsWith("/") ? cfLoader({ src, width: 256 }) : src);
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
        <cc-cart ref={el} key="member" locale="ru" links={links} {...(freeFrom ? { "free-from": String(freeFrom) } : {})}>
          <div slot="cart-extra">
            <RuCartRecs />
          </div>
        </cc-cart>
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
          {...(freeFrom ? { "free-from": String(freeFrom) } : {})}
        >
          <div slot="cart-extra">
            <RuCartRecs />
          </div>
        </cc-cart>
      )}
    </div>
  );
}

/**
 * «Вам может понравиться» под строками корзины — карусель карточек, как на главной: товары тех же доменов и фаз,
 * что уже в корзине (иначе — гидратация), которых в корзине нет и которые есть в наличии в городе.
 */
function RuCartRecs() {
  const cart = useRuCart();
  const prices = useRuPrices();
  const inCart = new Set(cart.lines.map((l) => l.id));
  const had = cart.lines.map((l) => ruProductByCode(l.id)).filter((p): p is RuProduct => Boolean(p));
  const domains = new Set(had.flatMap((p) => p.domains));
  const phases = new Set(had.flatMap((p) => p.phase));
  const sold = (p: RuProduct) => {
    const l = prices.get(p.code);
    return Boolean(l && l.available && l.club !== null);
  };
  const near = (p: RuProduct) => p.domains.some((d) => domains.has(d)) || p.phase.some((x) => phases.has(x));
  const pool = RU_PRODUCTS.filter((p) => !inCart.has(String(p.code)) && !p.set && sold(p));
  const list = [...pool.filter(near), ...pool.filter((p) => !near(p) && p.phase.includes("hydration"))].slice(0, 8);
  if (!list.length) return null;
  return (
    <div className={styles.recs}>
      <RuCards products={list} title="Вам может понравиться" label="Вам может понравиться" listId="cart_recommend" />
    </div>
  );
}
