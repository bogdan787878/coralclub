"use client";

import { useRouter } from "next/navigation";
import { onCartOpen, removeItem, useCart } from "@/lib/cart";
import {
  CartDrawer,
  type CartDrawerLabels,
} from "@/components/cart/CartDrawer";
import { formatMoney, friendProductById } from "@/lib/friendCatalog";
import { useEffect, useState } from "react";
import { useFriend } from "./FriendProvider";
import {
  CartBanner,
  CartSummary,
  LinePrice,
  Recommendations,
} from "./FriendCartParts";
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
 * The project's cart drawer, opened from the header's cart icon (once, in the
 * layout). "Check out" goes to the project's own checkout page, which hands
 * the cart to the shop's basket.
 */
export function FriendCartDrawer() {
  const router = useRouter();
  const { friend: who } = useFriend();
  const [open, setOpen] = useState(false);
  const cart = useCart();

  useEffect(() => onCartOpen(() => setOpen(true)), []);
  // articles of an earlier market (or a product the shop no longer sells here)
  // would be dead lines in this cart: drop them
  useEffect(() => {
    for (const l of cart) {
      if (!friendProductById(l.coralId)) removeItem(l.coralId);
    }
  }, [cart]);

  return (
    <CartDrawer
      open={open}
      onClose={() => setOpen(false)}
      labels={LABELS}
      formatMoney={formatMoney}
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
  );
}
