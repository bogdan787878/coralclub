"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  basketHandoffUrl,
  type CartLine,
  cartSubtotal,
  clearCart,
  formatUsd,
  removeItem,
  setQty,
  useCart,
} from "@/lib/cart";
import { CloseIcon, MinusIcon, PlusIcon, TrashIcon } from "./icons";
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
  /** Currency formatter for the subtotal (default: US dollars). */
  formatMoney?: (value: number) => string;
  /** Builds the checkout link from the cart lines, instead of the
   *  coralclub.us basket hand-off. */
  checkoutUrl?: (lines: CartLine[]) => string;
  /** A promo block above the subtotal: copy-able code + a short hint. */
  promo?: { code: string; text: string; copiedLabel: string };
  /** Replaces "open the link in a new tab" (e.g. to go to a page of its own). */
  onCheckout?: (lines: CartLine[]) => void;
  /** Anything to show right above the checkout button. */
  extra?: ReactNode;
  /** Above the lines (savings, free-shipping progress …). */
  banner?: ReactNode;
  /** Below the lines, inside the scrolling area ("you may also like"). */
  recommendations?: ReactNode;
  /** Replaces the grey price under a line's name. */
  renderPrice?: (line: CartLine) => ReactNode;
  /** Replaces the single subtotal row (discount / subtotal / shipping rows). */
  summary?: ReactNode;
  /** At quantity 1 the minus button becomes a bin (removes the line). */
  binAtOne?: boolean;
  /** Hide the text «Remove» link of a line. */
  hideRemove?: boolean;
};

/**
 * CartDrawer — the local cart. Lines live in localStorage; checkout hands
 * the whole cart to coralclub.us's basket in one link.
 */
export function CartDrawer({
  open,
  onClose,
  labels = EN_LABELS,
  formatMoney = formatUsd,
  checkoutUrl,
  promo,
  onCheckout,
  extra,
  banner,
  recommendations,
  renderPrice,
  summary,
  binAtOne,
  hideRemove,
}: CartDrawerProps) {
  const lines = useCart();
  const [copied, setCopied] = useState(false);
  const subtotal = cartSubtotal(lines);

  // the analytics layer reports "view_cart" when the drawer opens
  useEffect(() => {
    if (open) window.dispatchEvent(new Event("coralclub:cart:view"));
  }, [open]);

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

  const copyPromo = async () => {
    if (!promo) return;
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — the code stays visible to copy by hand */
    }
  };

  const checkout = () => {
    if (!lines.length) return;
    if (onCheckout) {
      onCheckout(lines);
      return;
    }
    window.open(
      checkoutUrl ? checkoutUrl(lines) : basketHandoffUrl(lines),
      "_blank",
      "noopener,noreferrer",
    );
  };

  // portal to <body> so the drawer isn't trapped inside a lower stacking
  // context (e.g. the PDP's fixed controls / buy bar)
  return createPortal(
    <div
      className={styles.root}
      role="dialog"
      aria-modal="true"
      aria-label={labels.aria}
      data-analytics-location="cart"
    >
      <button
        type="button"
        className={styles.scrim}
        aria-label={labels.closeCart}
        data-analytics-id="cart_close_scrim"
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
            data-analytics-id="cart_close_btn"
          >
            <CloseIcon />
          </button>
        </header>

        <div className={styles.body}>
          {lines.length > 0 && banner}
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
                    {renderPrice ? (
                      renderPrice(l)
                    ) : (
                      <span className={styles.linePrice}>{l.price}</span>
                    )}

                    <div className={styles.qty}>
                      <button
                        type="button"
                        onClick={() => setQty(l.coralId, l.qty - 1)}
                        aria-label={
                          binAtOne && l.qty <= 1
                            ? labels.remove
                            : labels.decrease(l.name)
                        }
                        data-analytics-id="cart_qty_dec"
                      >
                        {binAtOne && l.qty <= 1 ? <TrashIcon /> : <MinusIcon />}
                      </button>
                      <span aria-live="polite">{l.qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(l.coralId, l.qty + 1)}
                        aria-label={labels.increase(l.name)}
                        data-analytics-id="cart_qty_inc"
                      >
                        <PlusIcon />
                      </button>
                    </div>
                  </div>

                  {!hideRemove && (
                    <button
                      type="button"
                      className={styles.remove}
                      data-analytics-id="cart_item_remove"
                      onClick={() => removeItem(l.coralId)}
                    >
                      {labels.remove}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {lines.length > 0 && recommendations}
        </div>

        <footer className={styles.foot}>
          {promo && lines.length > 0 && (
            <div className={styles.promo}>
              <p className={styles.promoText}>{promo.text}</p>
              <button
                type="button"
                className={styles.promoCode}
                onClick={copyPromo}
                aria-label={`${promo.code}`}
                data-analytics-id="cart_promo_code"
              >
                {promo.code}
                <span aria-live="polite" className={styles.promoCopied}>
                  {copied ? promo.copiedLabel : ""}
                </span>
              </button>
            </div>
          )}
          {summary ?? (
            <div className={styles.subtotal}>
              <span>{labels.subtotal}</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
          )}
          {labels.note && <p className={styles.note}>{labels.note}</p>}
          {extra}
          <button
            type="button"
            className={styles.checkout}
            data-analytics-id="cart_checkout_submit"
            onClick={checkout}
            disabled={lines.length === 0}
          >
            {labels.checkout}
          </button>
          {labels.clear && lines.length > 0 && (
            <button
              type="button"
              className={styles.clear}
              data-analytics-id="cart_clear"
              onClick={clearCart}
            >
              {labels.clear}
            </button>
          )}
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
