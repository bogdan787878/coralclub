"use client";

import { useEffect, useState } from "react";
import { cartCount, onCartOpen, openCart, useCart } from "@/lib/cart";
import {
  CartDrawer,
  type CartDrawerLabels,
} from "@/components/cart/CartDrawer";
import { BagIcon } from "@/components/cart/icons";
import { openShopCheckout } from "@/lib/shopCheckout";
import { formatRub } from "@/lib/landingCatalogRu";
import styles from "./LandingCartButton.module.css";

const LABELS_RU: CartDrawerLabels = {
  aria: "Корзина",
  closeCart: "Закрыть корзину",
  title: "Ваша корзина",
  close: "Закрыть",
  empty: "В корзине пока пусто.",
  remove: "Удалить",
  decrease: (name) => `Убрать одну штуку: ${name}`,
  increase: (name) => `Добавить ещё одну: ${name}`,
  subtotal: "Итого",
  note: "",
  checkout: "Оформить",
  clear: "",
};

/**
 * LandingCartDrawer — the Russian cart drawer without a trigger of its own:
 * it opens on `openCart()` requests (the floating cart, the PDP's "В корзине" button).
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
      onCheckout={(lines) => void openShopCheckout(lines)}
      extra={
        <p className={styles.discountNote}>
          Клиентам L.A.B&nbsp;Space — скидка 20% на продукты Системы Красоты
        </p>
      }
    />
  );
}

/**
 * LandingCartButton — the landings' floating cart: a round icon button with
 * an item-count badge pinned to the bottom-right, opening the same local
 * cart drawer the shop uses (Russian strings, roubles). Classic logic: it
 * only appears once there is at least one item in the cart. `aboveBar` lifts
 * it clear of the PDP's pinned buy bar on phones.
 */
export function LandingCartButton({
  aboveBar = false,
}: {
  aboveBar?: boolean;
}) {
  const count = cartCount(useCart());

  return (
    <>
      {count > 0 && (
        <button
          type="button"
          className={`${styles.fab}${aboveBar ? ` ${styles.aboveBar}` : ""}`}
          onClick={openCart}
          aria-label={`Корзина, товаров: ${count}`}
          data-analytics-id="header_cart_icon"
          data-analytics-location="header"
        >
          <BagIcon />
          <span className={styles.badge}>{count}</span>
        </button>
      )}

      <LandingCartDrawer />
    </>
  );
}
