"use client";

import { addItem, setQty, useCart } from "@/lib/cart";
import { productHref } from "@/lib/catalog";
import type { PhaseProductCard } from "@/lib/products";
import { ProductCard } from "@/components/organisms";
import { QuizGridCard } from "./QuizGridCard";
import styles from "./AltCatalogGrid.module.css";

export type AltCatalogGridProps = {
  cards: PhaseProductCard[];
  /** Shows the quiz tile as the first cell (spanning 2×2) — only the
   *  first rendered domain section should set this. */
  withQuiz?: boolean;
};

/**
 * AltCatalogGrid — DomainProductGrid's /alt counterpart: same product grid,
 * with the quiz surfaced as a native 2×2 tile in the grid itself (see
 * QuizGridCard) instead of a separate promo strip.
 */
export function AltCatalogGrid({ cards, withQuiz = false }: AltCatalogGridProps) {
  const cart = useCart();
  const qtyOf = (coralId?: string) =>
    coralId ? (cart.find((l) => l.coralId === coralId)?.qty ?? 0) : 0;

  return (
    <div className={styles.grid}>
      {withQuiz && <QuizGridCard />}
      {cards.map((p) => (
        <ProductCard
          key={p.slug}
          fluid
          title={p.headline}
          category={p.category}
          price={p.price}
          priceWas={p.priceWas}
          href={productHref(p.slug)}
          cartHref={p.cartHref}
          onAddToCart={
            p.coralId
              ? () =>
                  addItem({
                    coralId: p.coralId as string,
                    slug: p.slug,
                    name: p.name,
                    price: p.price,
                    image: p.images[0]?.src,
                  })
              : undefined
          }
          cartQty={qtyOf(p.coralId)}
          onSetQty={p.coralId ? (n) => setQty(p.coralId as string, n) : undefined}
          images={p.images}
        />
      ))}
    </div>
  );
}
