"use client";

import type { Product } from "@coral/api";
import { getStore } from "@coral/cart/store";
import { ProductCard } from "@/components/organisms";
import { useCart } from "@/lib/cart";
import { rub } from "@/lib/lk/catalog";

/** Адрес страницы товара кабинета (статический сайт: код товара в адресе, данные приходят из API). */
export const lkProductHref = (code: number) => `/lk/product/?code=${code}`;

/**
 * Карточка товара участника: карточка витрины (ProductCard), цена участника и обычная, переход на страницу товара,
 * корзина — общее хранилище (бейдж в Layout, приложение корзины).
 */
export function MemberCard({ p }: { p: Product }) {
  const cart = useCart(); // копия корзины участника
  const qty = cart.find((l) => l.coralId === String(p.code))?.qty ?? 0;
  const store = getStore();
  const off = p.club !== null && p.retail && p.retail > p.club ? Math.round((1 - p.club / p.retail) * 100) : 0;
  return (
    <ProductCard
      fluid
      title={p.note ? `${p.name} – ${p.note}` : p.name}
      tag={p.badges[0]}
      price={p.club !== null ? rub(p.club, p.currency) : "Цена при оформлении"}
      priceWas={off ? rub(p.retail ?? 0, p.currency) : undefined}
      priceTag={off ? `−${off}%` : undefined}
      href={lkProductHref(p.code)}
      images={p.image ? [{ src: p.image, alt: p.name }] : []}
      cartQty={qty}
      onSetQty={(next) => void store.setQty(String(p.code), next)}
      onAddToCart={p.available ? () => void store.add(p.code, 1) : undefined}
    />
  );
}
