"use client";

import { useEffect, useState } from "react";
import { cartCount, onCartOpen, openCart, useCart } from "@/lib/cart";
import {
  CartDrawer,
  type CartDrawerLabels,
} from "@/components/cart/CartDrawer";
import { BagIcon } from "@/components/cart/icons";
import { PROMO_CODE } from "@/lib/beautySystem";
import { formatRub } from "@/lib/landingCatalogRu";
import styles from "./LandingCartButton.module.css";

const PROMO = {
  code: PROMO_CODE,
  text: "Скопируйте промокод и примените на следующем шаге, чтобы получить дополнительную скидку 15%",
  copiedLabel: "скопировано",
};

/** The Russian shop's basket (its cart is session-based — no share link). */
const RU_BASKET_URL = "https://coralclub.ru/basket/";

const LABELS_RU: CartDrawerLabels = {
  aria: "Корзина",
  closeCart: "Закрыть корзину",
  title: "Ваша корзина",
  close: "Закрыть",
  empty: "В корзине пока пусто.",
  remove: "Удалить",
  decrease: (name) => `Убрать одну штуку: ${name}`,
  increase: (name) => `Добавить ещё одну: ${name}`,
  subtotal: "Итого",
  note: "Заказ оформляется на сайте coralclub.ru: добавьте эти товары в корзину там.",
  checkout: "Оформить на coralclub.ru",
  clear: "Очистить корзину",
};

/**
 * LandingCartDrawer — the Russian cart drawer without a trigger of its own:
 * it opens on `openCart()` requests (e.g. the PDP buy bar's chevron button).
 */
export function LandingCartDrawer() {
  const [open, setOpen] = useState(false);

  useEffect(() => onCartOpen(() => setOpen(true)), []);

  return (
    <CartDrawer
      open={open}
      onClose={() => setOpen(false)}
      labels={LABELS_RU}
      formatMoney={formatRub}
      checkoutHref={RU_BASKET_URL}
      promo={PROMO}
    />
  );
}

/**
 * LandingCartButton — the landings' floating cart: a round icon button with
 * an item-count badge pinned to the bottom-right, opening the same local
 * cart drawer the shop uses (Russian strings, roubles). Shown on the landing
 * page only — the PDP opens the same drawer from its buy bar instead.
 */
export function LandingCartButton() {
  const count = cartCount(useCart());

  return (
    <>
      <button
        type="button"
        className={styles.fab}
        onClick={openCart}
        aria-label={count ? `Корзина, товаров: ${count}` : "Корзина"}
      >
        <BagIcon />
        {count > 0 && <span className={styles.badge}>{count}</span>}
      </button>

      <LandingCartDrawer />
    </>
  );
}
