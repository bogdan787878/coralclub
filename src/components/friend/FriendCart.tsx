"use client";

import { useRouter } from "next/navigation";
import { cartCount, onCartOpen, openCart, useCart } from "@/lib/cart";
import {
  CartDrawer,
  type CartDrawerLabels,
} from "@/components/cart/CartDrawer";
import { BagIcon } from "@/components/cart/icons";
import { formatUsd } from "@/lib/friendCatalog";
import { useEffect, useState } from "react";
import { useFriend } from "./FriendProvider";
import {
  CartBanner,
  CartSummary,
  LinePrice,
  Recommendations,
} from "./FriendCartParts";
import styles from "../landing/LandingCartButton.module.css";
import friend from "./Friend.module.css";

const LABELS: CartDrawerLabels = {
  aria: "Cart",
  closeCart: "Close cart",
  title: "Your cart",
  close: "Close",
  empty: "Your cart is empty.",
  remove: "Remove",
  decrease: (name) => `Decrease ${name}`,
  increase: (name) => `Increase ${name}`,
  subtotal: "Subtotal at member prices",
  note: "",
  checkout: "Checkout",
  clear: "",
};

/**
 * The project's floating cart + drawer. "Check out" goes to the project's own
 * checkout page, which hands the cart to the shop's basket.
 */
export function FriendCartButton({ aboveBar = false }: { aboveBar?: boolean }) {
  const router = useRouter();
  const { friend: who } = useFriend();
  const [open, setOpen] = useState(false);
  const cart = useCart();
  const count = cartCount(cart);

  useEffect(() => onCartOpen(() => setOpen(true)), []);

  return (
    <>
      {count > 0 && (
        <button
          type="button"
          className={`${styles.fab}${aboveBar ? ` ${styles.aboveBar}` : ""}`}
          onClick={openCart}
          aria-label={`Cart, ${count} items`}
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
        formatMoney={formatUsd}
        onCheckout={() => router.push("/friend/checkout/")}
        banner={<CartBanner lines={cart} />}
        renderPrice={(line) => <LinePrice line={line} />}
        recommendations={<Recommendations />}
        summary={<CartSummary lines={cart} />}
        binAtOne
        hideRemove
        extra={
          who && (
            <p className={friend.drawerNote}>
              No sign-up needed. The sale goes to <strong>{who.name}</strong> ·
              Coral ID {who.memberId}
            </p>
          )
        }
      />
    </>
  );
}
