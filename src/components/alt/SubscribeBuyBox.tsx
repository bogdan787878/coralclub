"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { addItem, setQty, useCart } from "@/lib/cart";
import type { BuyBoxOption, BuyBoxProduct } from "@/components/organisms";
import styles from "./SubscribeBuyBox.module.css";

export type SubscribeBuyBoxProps = {
  options: BuyBoxOption[];
  product: BuyBoxProduct;
};

const BENEFITS = ["Free shipping on every delivery", "Skip or cancel anytime", "Ships automatically each month"];

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * SubscribeBuyBox — BuyBox's /alt counterpart: defaults to the subscription
 * (club) price with an explicit "Subscribe & Save" vs "One-time" toggle and
 * a short benefits list, instead of just showing the club price struck
 * against regular with no framing.
 */
export function SubscribeBuyBox({ options, product }: SubscribeBuyBoxProps) {
  const cart = useCart();
  const [mode, setMode] = useState<"club" | "regular">("club");
  const club = options.find((o) => o.id === "club") ?? options[0];
  const regular = options.find((o) => o.id === "regular") ?? options[0];
  const selected = mode === "club" ? club : regular;
  const canAddToCart = Boolean(product.coralId);
  const qty = canAddToCart ? (cart.find((l) => l.coralId === product.coralId)?.qty ?? 0) : 0;

  const add = () => {
    addItem({
      coralId: product.coralId as string,
      slug: product.slug,
      name: product.name,
      price: selected.price,
      image: product.image,
    });
  };

  const bump = (next: number) => {
    setQty(product.coralId as string, next);
  };

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.toggle}>
          <button
            type="button"
            className={`${styles.toggleOption}${mode === "club" ? ` ${styles.selected}` : ""}`}
            onClick={() => setMode("club")}
          >
            <span className={styles.toggleLabel}>Subscribe &amp; Save</span>
            {club.note && <span className={styles.toggleNote}>{club.note}</span>}
          </button>
          <button
            type="button"
            className={`${styles.toggleOption}${mode === "regular" ? ` ${styles.selected}` : ""}`}
            onClick={() => setMode("regular")}
          >
            <span className={styles.toggleLabel}>One-time</span>
          </button>
        </div>

        <div className={styles.benefits}>
          {BENEFITS.map((b) => (
            <span className={styles.benefit} key={b}>
              <CheckIcon />
              {b}
            </span>
          ))}
        </div>

        <div className={styles.row}>
          <div className={styles.priceBlock}>
            <div className={styles.priceRow}>
              <span className={styles.now}>{selected.price}</span>
              {mode === "club" && <span className={styles.was}>{regular.price}</span>}
            </div>
          </div>

          {canAddToCart && qty > 0 ? (
            <div className={styles.actions}>
              <div className={styles.stepper}>
                <button type="button" aria-label="Remove one" onClick={() => bump(qty - 1)}>
                  −
                </button>
                <span className={styles.stepperCount} aria-live="polite">
                  {qty}
                </span>
                <button type="button" aria-label="Add one" onClick={() => bump(qty + 1)}>
                  +
                </button>
              </div>
            </div>
          ) : canAddToCart ? (
            <Button variant="primary" className={styles.action} onClick={add}>
              Add to Cart
            </Button>
          ) : (
            <Button
              variant="primary"
              className={styles.action}
              href={selected.cta.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              Add to Cart
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
