"use client";

import { useEffect, useState } from "react";
import { cartCount, onCartOpen, useCart } from "@/lib/cart";
import {
  CartDrawer,
  type CartDrawerLabels,
} from "@/components/cart/CartDrawer";
import { BagIcon } from "@/components/cart/icons";
import styles from "./LandingCartButton.module.css";

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
  note: "Оформление откроет корзину Coral Club с этими товарами.",
  checkout: "Перейти к оформлению",
  clear: "Очистить корзину",
};

/**
 * LandingCartButton — the landings' floating cart: a round icon button with
 * an item-count badge pinned to the bottom-right, opening the same local
 * cart drawer the shop uses (Russian strings). `aboveBuyBar` lifts it clear
 * of the PDP's pinned buy bar.
 */
export function LandingCartButton({
  aboveBuyBar = false,
}: {
  aboveBuyBar?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const count = cartCount(useCart());

  useEffect(() => onCartOpen(() => setOpen(true)), []);

  return (
    <>
      <button
        type="button"
        className={`${styles.fab}${aboveBuyBar ? ` ${styles.aboveBar}` : ""}`}
        onClick={() => setOpen(true)}
        aria-label={count ? `Корзина, товаров: ${count}` : "Корзина"}
      >
        <BagIcon />
        {count > 0 && <span className={styles.badge}>{count}</span>}
      </button>

      <CartDrawer
        open={open}
        onClose={() => setOpen(false)}
        labels={LABELS_RU}
      />
    </>
  );
}
