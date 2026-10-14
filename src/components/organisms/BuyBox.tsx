"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { addItem, openCart, setQty, useCart } from "@/lib/cart";
import { ChevronRight } from "@/components/account/icons";
import styles from "./BuyBox.module.css";

export type BuyBoxOption = {
  id: string;
  label: string;
  note?: string;
  price: string;
  cta: { label: string; href: string };
};

export type BuyBoxProduct = {
  coralId?: string;
  slug: string;
  name: string;
  image?: string;
};

export type BuyBoxLabels = {
  add: string;
  removeOne: string;
  addOne: string;
  /** When set, a round chevron button next to the stepper opens the cart
   *  (the landings have no TabBar to reach it from). */
  openCart?: string;
};

export type BuyBoxProps = {
  options: BuyBoxOption[];
  product: BuyBoxProduct;
  /** Overrides for a translated storefront (defaults are English). */
  labels?: BuyBoxLabels;
  /** Sit flush with the viewport bottom on mobile — for standalone pages
   *  without the shop's TabBar (the landings). */
  pinned?: boolean;
  /** Compact bar fixed to the top of the viewport (web only) — price + CTA
   *  that stays in reach once the inline block has scrolled away. */
  top?: boolean;
};

/**
 * BuyBox — pinned bottom bar: club price (regular price struck through +
 * savings tag) on the left; on the right an "Add to Cart" button that,
 * once the product is in the cart, is replaced by a "− N +" stepper (the
 * bottom TabBar's own Cart tab is how you get to the drawer from here).
 */
export function BuyBox({
  options,
  product,
  labels,
  pinned = false,
  top = false,
}: BuyBoxProps) {
  const cart = useCart();
  const [acted, setActed] = useState(false);
  const club = options.find((o) => o.id === "club") ?? options[0];
  const regular = options.find((o) => o.id === "regular") ?? options[0];
  const canAddToCart = Boolean(product.coralId);
  const qty = canAddToCart
    ? (cart.find((l) => l.coralId === product.coralId)?.qty ?? 0)
    : 0;
  const anim = acted ? ` ${styles.animIn}` : "";

  const add = () => {
    setActed(true);
    addItem({
      coralId: product.coralId as string,
      slug: product.slug,
      name: product.name,
      price: club.price,
      image: product.image,
    });
  };

  const bump = (next: number) => {
    setActed(true);
    setQty(product.coralId as string, next);
  };

  return (
    <div
      className={`${styles.bar}${pinned ? ` ${styles.pinned}` : ""}${top ? ` ${styles.top}` : ""}`}
    >
      <div className={styles.inner}>
        {top && <span className={styles.topName}>{product.name}</span>}
        <div className={styles.priceBlock}>
          <div className={styles.priceRow}>
            <span className={styles.now}>{club.price}</span>
            <span className={styles.was}>{regular.price}</span>
          </div>
          {club.note && <span className={styles.savings}>{club.note}</span>}
        </div>

        {canAddToCart && qty > 0 ? (
          <div className={styles.actions}>
            <div className={`${styles.stepper}${anim}`}>
              <button
                type="button"
                aria-label={labels?.removeOne ?? "Remove one"}
                onClick={() => bump(qty - 1)}
              >
                −
              </button>
              <span className={styles.stepperCount} aria-live="polite">
                {qty}
              </span>
              <button
                type="button"
                aria-label={labels?.addOne ?? "Add one"}
                onClick={() => bump(qty + 1)}
              >
                +
              </button>
            </div>
            {labels?.openCart && (
              <button
                type="button"
                className={`${styles.cartGo}${anim}`}
                aria-label={labels.openCart}
                onClick={openCart}
              >
                <ChevronRight />
              </button>
            )}
          </div>
        ) : canAddToCart ? (
          <Button
            variant="primary"
            className={styles.action + anim}
            onClick={add}
          >
            {labels?.add ?? "Add to Cart"}
          </Button>
        ) : (
          <Button
            variant="primary"
            className={styles.action}
            href={regular.cta.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {labels?.add ?? "Add to Cart"}
          </Button>
        )}
      </div>
    </div>
  );
}
