"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { addItem } from "@/lib/cart";
import { PriceSelector } from "./PriceSelector";
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
 * BuyBox — the price selector sits in the page body; only the primary
 * action is pinned to the bottom of the screen. Club tier → become a
 * member (link). Regular tier → add to the local cart, which later hands
 * off to coralclub.ru's basket (or the redirect link when there's no id).
 */
export function BuyBox({ options, product }: BuyBoxProps) {
  const [selectedId, setSelectedId] = useState(options[0]?.id);
  const [added, setAdded] = useState(false);
  const selected = options.find((o) => o.id === selectedId) ?? options[0];

  const regular = options.find((o) => o.id === "regular") ?? selected;
  const canAddToCart = selected.id === "regular" && Boolean(product.coralId);
  const external = /^https?:/.test(selected.cta.href);

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
    <>
      <PriceSelector
        options={options}
        value={selectedId}
        onChange={setSelectedId}
      />

      <div className={styles.bar}>
        <div className={styles.inner}>
          {canAddToCart ? (
            <Button
              variant="primary"
              block
              className={styles.action}
              onClick={addToCart}
            >
              {added ? "Added to cart ✓" : selected.cta.label}
            </Button>
          ) : (
            <Button
              variant="primary"
              block
              className={styles.action}
              href={selected.cta.href}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {selected.cta.label}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
