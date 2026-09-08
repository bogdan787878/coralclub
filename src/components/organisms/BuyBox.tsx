"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { addItem, setQty, useCart } from "@/lib/cart";
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

export type BuyBoxProps = {
  options: BuyBoxOption[];
  product: BuyBoxProduct;
};

/**
 * BuyBox — pinned bottom bar: club price (regular price struck through +
 * savings tag) on the left, one action on the right. Once the product is in
 * the cart the action becomes a "− N +" stepper, like the carousel card.
 */
export function BuyBox({ options, product }: BuyBoxProps) {
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
      price: regular.price,
      image: product.image,
    });
  };

  const bump = (next: number) => {
    setActed(true);
    setQty(product.coralId as string, next);
  };

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.priceBlock}>
          <div className={styles.priceRow}>
            <span className={styles.now}>{club.price}</span>
            <span className={styles.was}>{regular.price}</span>
          </div>
          {club.note && <span className={styles.savings}>{club.note}</span>}
        </div>

        {canAddToCart && qty > 0 ? (
          <div className={styles.stepper + anim}>
            <button
              type="button"
              aria-label="Remove one"
              onClick={() => bump(qty - 1)}
            >
              −
            </button>
            <span className={styles.stepperCount} aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              aria-label="Add one"
              onClick={() => bump(qty + 1)}
            >
              +
            </button>
          </div>
        ) : canAddToCart ? (
          <Button
            variant="primary"
            className={styles.action + anim}
            onClick={add}
          >
            Add to Cart
          </Button>
        ) : (
          <Button
            variant="primary"
            className={styles.action}
            href={regular.cta.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            Add to Cart
          </Button>
        )}
      </div>
    </div>
  );
}
