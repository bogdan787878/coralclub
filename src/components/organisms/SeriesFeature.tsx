"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Container, Heading } from "@/components/ui";
import { addItem, useCart, setQty } from "@/lib/cart";
import { productHref } from "@/lib/catalog";
import { ImageSlider } from "./ImageSlider";
import type { Product } from "@/lib/products";
import styles from "./SeriesFeature.module.css";

export type SeriesFeatureProps = {
  /** Name of the set, e.g. "Hydration" → "The Hydration Series". */
  seriesName: string;
  /** Overrides the default "The {seriesName} Series" heading. */
  heading?: ReactNode;
  /** The product that represents the set. */
  product: Product;
};

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5h2.2l1.9 9.6a2 2 0 0 0 2 1.6h7a2 2 0 0 0 2-1.6L21 8.5H6.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20" r="1.4" fill="currentColor" />
      <circle cx="17" cy="20" r="1.4" fill="currentColor" />
    </svg>
  );
}

/**
 * SeriesFeature — the block under the phase carousel that spotlights the set
 * as a whole: title, an image slider, the set product's name + price and a
 * floating cart button on the image (same control as the carousel cards).
 * Shown only for the fixed phase sets.
 */
export function SeriesFeature({
  seriesName,
  heading,
  product,
}: SeriesFeatureProps) {
  const cart = useCart();
  const [acted, setActed] = useState(false);
  const anim = acted ? ` ${styles.animIn}` : "";

  const club = product.prices[0].price;
  const regular = product.prices[1].price;
  const shopHref = product.prices[1].cta.href;
  const images = product.pdpImages.map((src) => ({ src, alt: product.name }));

  const coralId = product.coralId;
  const qty = coralId
    ? (cart.find((l) => l.coralId === coralId)?.qty ?? 0)
    : 0;

  const href = productHref(product.slug);

  const add = () => {
    setActed(true);
    addItem({
      coralId: coralId as string,
      slug: product.slug,
      name: product.name,
      price: club,
      image: images[0]?.src,
    });
  };

  return (
    <Container>
      <div className={styles.block}>
        <Heading as="h2" className={styles.title}>
          {heading ?? `The ${seriesName} Series`}
        </Heading>

        <div className={styles.media}>
          <div className={styles.mediaInner}>
            <ImageSlider images={images} sizes="100vw" fit="cover" href={href} />
          </div>
        </div>

        {/* stretched link — covers the whole block */}
        <Link href={href} className={styles.name}>
          {product.headline}
        </Link>

        <div className={styles.priceRow}>
          <p className={styles.price}>
            <span className={styles.now}>{club}</span>
            <span className={styles.was}>{regular}</span>
          </p>

          {coralId ? (
            qty > 0 ? (
              <span className={styles.stepper + anim}>
                <button
                  type="button"
                  aria-label="Remove one"
                  onClick={() => {
                    setActed(true);
                    setQty(coralId, qty - 1);
                  }}
                >
                  −
                </button>
                <span className={styles.stepperCount} aria-live="polite">
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label="Add one"
                  onClick={() => {
                    setActed(true);
                    setQty(coralId, qty + 1);
                  }}
                >
                  +
                </button>
              </span>
            ) : (
              <button
                type="button"
                className={styles.cart + anim}
                onClick={add}
                aria-label="Add to cart"
              >
                <CartIcon />
              </button>
            )
          ) : (
            <a
              className={styles.cart}
              href={shopHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Add to cart"
            >
              <CartIcon />
            </a>
          )}
        </div>
      </div>
    </Container>
  );
}
