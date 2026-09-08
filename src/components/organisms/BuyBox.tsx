"use client";

import { useEffect, useRef, useState } from "react";
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
 * BuyBox — the price selector plus the primary action. Club tier → become a
 * member (link). Regular tier → add to the local cart, which later hands off
 * to coralclub.ru's basket. Falls back to the redirect link when the product
 * has no coralclub.ru id yet.
 */
export function BuyBox({ options, product }: BuyBoxProps) {
  const [selectedId, setSelectedId] = useState(options[0]?.id);
  const [added, setAdded] = useState(false);
  const selected = options.find((o) => o.id === selectedId) ?? options[0];

  // collapse the price toggle on scroll-down, reveal it on scroll-up
  const [pricesHidden, setPricesHidden] = useState(false);
  const lastY = useRef(0);
  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY.current;
      if (Math.abs(dy) < 6) return;
      if (y < 80) setPricesHidden(false);
      else if (dy > 0) setPricesHidden(true);
      else setPricesHidden(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <div className={styles.bar}>
      <div className={styles.inner}>
        <div
          className={styles.prices}
          style={
            pricesHidden
              ? {
                  maxHeight: 0,
                  paddingTop: 0,
                  marginBottom: 0,
                  opacity: 0,
                  pointerEvents: "none",
                }
              : undefined
          }
        >
          <PriceSelector
            options={options}
            value={selectedId}
            onChange={setSelectedId}
          />
        </div>

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
  );
}
