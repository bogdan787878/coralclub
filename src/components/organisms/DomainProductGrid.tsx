"use client";

import { addItem, setQty, useCart } from "@/lib/cart";
import { productHref } from "@/lib/catalog";
import type { PhaseProductCard } from "@/lib/products";
import { ProductCard } from "./ProductCard";
import styles from "./DomainProductGrid.module.css";

/**
 * DomainProductGrid — one domain's product grid on /catalog, local-cart
 * wired like every other product card on the site (the page itself is a
 * server component and can't call useCart(), hence this small client
 * wrapper around just the grid).
 */
export function DomainProductGrid({ cards }: { cards: PhaseProductCard[] }) {
  const cart = useCart();
  const qtyOf = (coralId?: string) =>
    coralId ? (cart.find((l) => l.coralId === coralId)?.qty ?? 0) : 0;

  return (
    <div className={styles.productGrid}>
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
