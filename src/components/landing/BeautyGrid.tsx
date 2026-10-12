"use client";

import { addItem, setQty, useCart } from "@/lib/cart";
import { productHref } from "@/lib/catalog";
import type { PhaseProductCard } from "@/lib/products";
import { ProductCard } from "@/components/organisms";
import styles from "./BeautyGrid.module.css";

/** The product grid of the hidden /beauty-system section — each card sits
 *  in an anchor target (#slug) so landing cards can deep-link to it. */
export function BeautyGrid({ cards }: { cards: PhaseProductCard[] }) {
  const cart = useCart();
  const qtyOf = (coralId?: string) =>
    coralId ? (cart.find((l) => l.coralId === coralId)?.qty ?? 0) : 0;

  return (
    <div className={styles.grid}>
      {cards.map((p) => (
        <div key={p.slug} id={p.slug} className={styles.cell}>
          <ProductCard
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
        </div>
      ))}
    </div>
  );
}
