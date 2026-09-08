"use client";

import { useState } from "react";
import { cartCount, useCart } from "@/lib/cart";
import { CartDrawer } from "./CartDrawer";
import { BagIcon } from "./icons";
import styles from "./CartButton.module.css";

/**
 * CartButton — cart icon + item-count badge. Opens the local cart drawer.
 * Pass `className` to restyle the trigger (e.g. floating over the PDP image).
 */
export function CartButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const count = cartCount(useCart());

  return (
    <>
      <button
        type="button"
        className={className ?? styles.button}
        onClick={() => setOpen(true)}
        aria-label={count ? `Cart, ${count} items` : "Cart"}
      >
        <BagIcon />
        {count > 0 && <span className={styles.badge}>{count}</span>}
      </button>

      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
