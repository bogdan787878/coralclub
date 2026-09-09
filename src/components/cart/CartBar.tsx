"use client";

import { useEffect, useState } from "react";
import { cartCount, cartSubtotal, onCartOpen, useCart } from "@/lib/cart";
import { CartDrawer } from "./CartDrawer";
import { BagIcon } from "./icons";
import styles from "./CartBar.module.css";

function money(value: number): string {
  return Number.isInteger(value) ? `$${value}` : `$${value.toFixed(2)}`;
}

/**
 * CartBar — full-width cart button pinned to the bottom of the homepage.
 * Appears once something is in the local cart; shows a bag icon, the "Cart"
 * label and the running subtotal, and opens the cart drawer on tap.
 */
export function CartBar() {
  const lines = useCart();
  const [open, setOpen] = useState(false);
  const count = cartCount(lines);

  useEffect(() => onCartOpen(() => setOpen(true)), []);

  const total = money(cartSubtotal(lines));

  return (
    <>
      {count > 0 && <div className={styles.spacer} aria-hidden="true" />}

      {count > 0 && (
        <div className={styles.wrap}>
          <button
            type="button"
            className={styles.bar}
            onClick={() => setOpen(true)}
            aria-label={`Open cart — ${count} item${count === 1 ? "" : "s"}, ${total}`}
          >
            <BagIcon />
            <span className={styles.labelBlock}>
              <span className={styles.label}>Cart</span>
              <span className={styles.count}>
                {count} item{count === 1 ? "" : "s"}
              </span>
            </span>
            <span className={styles.total}>{total}</span>
            <svg
              className={styles.chevron}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
