"use client";

import { useEffect } from "react";
import Image from "next/image";
import {
  basketHandoffUrl,
  cartSubtotal,
  clearCart,
  formatUsd,
  removeItem,
  setQty,
  useCart,
} from "@/lib/cart";
import { CloseIcon, MinusIcon, PlusIcon } from "./icons";
import styles from "./CartDrawer.module.css";

export type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * CartDrawer — the local cart. Lines live in localStorage; checkout hands
 * the whole cart to coralclub.ru's basket in one link.
 */
export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const lines = useCart();
  const subtotal = cartSubtotal(lines);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const checkout = () => {
    if (!lines.length) return;
    window.open(basketHandoffUrl(lines), "_blank", "noopener,noreferrer");
  };

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-label="Cart">
      <button
        type="button"
        className={styles.scrim}
        aria-label="Close cart"
        onClick={onClose}
      />

      <aside className={styles.panel}>
        <header className={styles.head}>
          <span className={styles.title}>Your cart</span>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className={styles.empty}>
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <ul className={styles.lines}>
            {lines.map((l) => (
              <li key={l.coralId} className={styles.line}>
                <span className={styles.thumb}>
                  {l.image ? (
                    <Image src={l.image} alt={l.name} fill sizes="64px" />
                  ) : null}
                </span>

                <div className={styles.lineBody}>
                  <span className={styles.lineName}>{l.name}</span>
                  <span className={styles.linePrice}>{l.price}</span>

                  <div className={styles.qty}>
                    <button
                      type="button"
                      onClick={() => setQty(l.coralId, l.qty - 1)}
                      aria-label={`Decrease ${l.name}`}
                    >
                      <MinusIcon />
                    </button>
                    <span aria-live="polite">{l.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(l.coralId, l.qty + 1)}
                      aria-label={`Increase ${l.name}`}
                    >
                      <PlusIcon />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => removeItem(l.coralId)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <footer className={styles.foot}>
          <div className={styles.subtotal}>
            <span>Subtotal</span>
            <span>{formatUsd(subtotal)}</span>
          </div>
          <p className={styles.note}>
            Checkout opens your Coral Club basket with these items added.
          </p>
          <button
            type="button"
            className={styles.checkout}
            onClick={checkout}
            disabled={lines.length === 0}
          >
            Open basket on coralclub.ru
          </button>
          {lines.length > 0 && (
            <button type="button" className={styles.clear} onClick={clearCart}>
              Clear cart
            </button>
          )}
        </footer>
      </aside>
    </div>
  );
}
