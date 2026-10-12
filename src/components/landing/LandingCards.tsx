"use client";

import { addItem, setQty, useCart } from "@/lib/cart";
import type { PhaseProductCard } from "@/lib/products";
import { Carousel, ProductCard } from "@/components/organisms";

/**
 * LandingCards — the product carousel. Tapping a card goes to the hidden
 * "Система красоты" section (/beauty-system) instead of the regular PDP,
 * where the products can be bought without registering.
 */
export function LandingCards({ cards, hrefBase }: { cards: PhaseProductCard[]; hrefBase: string }) {
  const cart = useCart();
  const qtyOf = (coralId?: string) =>
    coralId ? (cart.find((l) => l.coralId === coralId)?.qty ?? 0) : 0;

  return (
    <Carousel label="Продукты системы красоты">
      {cards.map((p) => (
        <ProductCard
          key={p.slug}
          fluid
          title={p.headline}
          category={p.category}
          price={p.price}
          priceWas={p.priceWas}
          href={`${hrefBase}#${p.slug}`}
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
    </Carousel>
  );
}
