"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { addItem } from "@/lib/cart";
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
 * BuyBox — pinned bottom bar: the price (club price, with the regular price
 * struck through and the savings tag) on the left, one "Add to Cart" action
 * on the right. No tier toggle. Regular-price value is what goes into the
 * cart line; checkout hands the whole cart to coralclub.ru.
 */
export function BuyBox({ options, product }: BuyBoxProps) {
  const [added, setAdded] = useState(false);

  const club = options.find((o) => o.id === "club") ?? options[0];
  const regular = options.find((o) => o.id === "regular") ?? options[0];
  const canAddToCart = Boolean(product.coralId);
  const shopHref = regular.cta.href;

  const addToCart = () => {
    addItem({
      coralId: product.coralId as string,
      slug: product.slug,
      name: product.name,
      price: regular.price,
      image: product.image,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.priceBlock}>
          <span className={styles.now}>{club.price}</span>
          <span className={styles.was}>{regular.price}</span>
          {club.note && <span className={styles.savings}>{club.note}</span>}
        </div>

        {canAddToCart ? (
          <Button
            variant="primary"
            className={styles.action}
            onClick={addToCart}
          >
            {added ? "Added ✓" : "Add to Cart"}
          </Button>
        ) : (
          <Button
            variant="primary"
            className={styles.action}
            href={shopHref}
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
