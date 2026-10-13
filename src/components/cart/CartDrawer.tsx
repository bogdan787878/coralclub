"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
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

/** Strings a translated storefront can override (defaults are English). */
export type CartDrawerLabels = {
  aria: string;
  closeCart: string;
  title: string;
  close: string;
  empty: string;
  remove: string;
  decrease: (name: string) => string;
  increase: (name: string) => string;
  subtotal: string;
  note: string;
  checkout: string;
  clear: string;
};

const EN_LABELS: CartDrawerLabels = {
  aria: "Cart",
  closeCart: "Close cart",
  title: "Your cart",
  close: "Close",
  empty: "Your cart is empty.",
  remove: "Remove",
  decrease: (name) => `Decrease ${name}`,
  increase: (name) => `Increase ${name}`,
  subtotal: "Subtotal",
  note: "Checkout opens your Coral Club basket with these items added.",
  checkout: "Open basket on coralclub.us",
  clear: "Clear cart",
};

export type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  /** Overrides for a translated storefront (defaults are English). */
  labels?: CartDrawerLabels;
};

/**
 * CartDrawer — the local cart. Lines live in localStorage; checkout hands
 * the whole cart to coralclub.us's basket in one link.
 */
export function CartDrawer({
  open,
  onClose,
  labels = EN_LABELS,
}: CartDrawerProps) {
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

  if (!open || typeof document === "undefined") return null;

  const checkout = () => {
    if (!lines.length) return;
    window.open(basketHandoffUrl(lines), "_blank", "noopener,noreferrer");
  };

  // portal to <body> so the drawer isn't trapped inside a lower stacking
  // context (e.g. the PDP's fixed controls / buy bar)
  return createPortal(
    <div
      className={styles.root}
      role="dialog"
      aria-modal="true"
      aria-label={labels.aria}
    >
      <button
        type="button"
        className={styles.scrim}
        aria-label={labels.closeCart}
        onClick={onClose}
      />

      <aside className={styles.panel}>
        <header className={styles.head}>
          <span className={styles.title}>{labels.title}</span>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label={labels.close}
          >
            <CloseIcon />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className={styles.empty}>
            <p>{labels.empty}</p>
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
                      aria-label={labels.decrease(l.name)}
                    >
                      <MinusIcon />
                    </button>
                    <span aria-live="polite">{l.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(l.coralId, l.qty + 1)}
                      aria-label={labels.increase(l.name)}
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
                  {labels.remove}
                </button>
              </li>
            ))}
          </ul>
        )}

        <footer className={styles.foot}>
          <div className={styles.subtotal}>
            <span>{labels.subtotal}</span>
            <span>{formatUsd(subtotal)}</span>
          </div>
          <p className={styles.note}>{labels.note}</p>
          <button
            type="button"
            className={styles.checkout}
            onClick={checkout}
            disabled={lines.length === 0}
          >
            {labels.checkout}
          </button>
          {lines.length > 0 && (
            <button type="button" className={styles.clear} onClick={clearCart}>
              {labels.clear}
            </button>
          )}
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
