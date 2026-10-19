"use client";

import { useRouter } from "next/navigation";
import { cartCount, onCartOpen, openCart, useCart } from "@/lib/cart";
import {
  CartDrawer,
  type CartDrawerLabels,
} from "@/components/cart/CartDrawer";
import { BagIcon } from "@/components/cart/icons";
import { formatRub } from "@/lib/landingCatalogRu";
import { useEffect, useState } from "react";
import { useFriend } from "./FriendProvider";
import styles from "../landing/LandingCartButton.module.css";
import friend from "./Friend.module.css";

const LABELS: CartDrawerLabels = {
  aria: "Корзина",
  closeCart: "Закрыть корзину",
  title: "Ваша корзина",
  close: "Закрыть",
  empty: "В корзине пока пусто.",
  remove: "Удалить",
  decrease: (name) => `Убрать одну штуку: ${name}`,
  increase: (name) => `Добавить ещё одну: ${name}`,
  subtotal: "Итого по клубной цене",
  note: "",
  checkout: "Оформить без регистрации",
  clear: "",
};

/**
 * The project's floating cart + drawer. "Оформить" goes to the project's own
 * checkout page, which hands the cart to the shop's basket.
 */
export function FriendCartButton({ aboveBar = false }: { aboveBar?: boolean }) {
  const router = useRouter();
  const { friend: who } = useFriend();
  const [open, setOpen] = useState(false);
  const count = cartCount(useCart());

  useEffect(() => onCartOpen(() => setOpen(true)), []);

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

      <CartDrawer
        open={open}
        onClose={() => setOpen(false)}
        labels={LABELS}
        formatMoney={formatRub}
        onCheckout={() => router.push("/friend/checkout/")}
        extra={
          who && (
            <p className={friend.drawerNote}>
              Покупка засчитается: <strong>{who.name}</strong> · Coral ID{" "}
              {who.memberId}
            </p>
          )
        }
      />
    </>
  );
}
