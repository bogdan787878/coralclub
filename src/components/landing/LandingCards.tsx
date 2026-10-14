import type { PhaseProductCard } from "@/lib/products";
import { landingPdpHref } from "@/lib/landingCatalogRu";
import { Carousel, ProductCard } from "@/components/organisms";

/**
 * LandingCards — the product carousel. Every card (and its cart button)
 * opens that product's Russian page of this landing; the purchase itself
 * is handed off to the main shop from there.
 */
export function LandingCards({ cards }: { cards: PhaseProductCard[] }) {
  return (
    <Carousel label="Продукты системы красоты" maxCols={4}>
      {cards.map((p) => {
        const href = landingPdpHref(p.slug);
        return (
          <ProductCard
            key={p.slug}
            fluid
            title={p.headline}
            category={p.category}
            price={p.price}
            priceWas={p.priceWas}
            href={href}
            cartHref={href}
            images={p.images}
          />
        );
      })}
    </Carousel>
  );
}
