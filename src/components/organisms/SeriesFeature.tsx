"use client";

import { Button, Container, Heading } from "@/components/ui";
import { addItem, useCart, setQty } from "@/lib/cart";
import { ImageSlider } from "./ImageSlider";
import type { PhaseProductCard } from "@/lib/products";
import styles from "./SeriesFeature.module.css";

export type SeriesFeatureProps = {
  /** Name of the set, e.g. "Hydration" → "The Hydration Series". */
  seriesName: string;
  /** The flagship product that represents the set. */
  product: PhaseProductCard;
};

/**
 * SeriesFeature — the block under the phase carousel that spotlights the set
 * as a whole: title, an image slider, the flagship product's name + price
 * and one Add-to-Cart action. Shown only for the fixed phase sets.
 */
export function SeriesFeature({ seriesName, product }: SeriesFeatureProps) {
  const cart = useCart();
  const qty = product.coralId
    ? (cart.find((l) => l.coralId === product.coralId)?.qty ?? 0)
    : 0;

  const add = () =>
    addItem({
      coralId: product.coralId as string,
      slug: product.slug,
      name: product.name,
      price: product.priceWas,
      image: product.images[0]?.src,
    });

  return (
    <Container>
      <div className={styles.block}>
          <Heading as="h2" className={styles.title}>
            The {seriesName} Series
          </Heading>

          <div className={styles.media}>
            <div className={styles.mediaInner}>
              <ImageSlider images={product.images} sizes="100vw" />
            </div>
          </div>

          <div className={styles.name}>{product.headline}</div>

          <p className={styles.price}>
            <span className={styles.now}>{product.price}</span>
            <span className={styles.was}>{product.priceWas}</span>
          </p>

          {product.coralId && qty > 0 ? (
            <div className={styles.stepper}>
              <button
                type="button"
                aria-label="Remove one"
                onClick={() => setQty(product.coralId as string, qty - 1)}
              >
                −
              </button>
              <span aria-live="polite">{qty}</span>
              <button
                type="button"
                aria-label="Add one"
                onClick={() => setQty(product.coralId as string, qty + 1)}
              >
                +
              </button>
            </div>
          ) : product.coralId ? (
            <Button variant="primary" block onClick={add}>
              Add to Cart
            </Button>
          ) : (
            <Button variant="primary" block href={product.cartHref}>
              Add to Cart
            </Button>
          )}
      </div>
    </Container>
  );
}
