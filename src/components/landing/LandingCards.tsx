import type { PhaseProductCard } from "@/lib/products";
import { Carousel, ProductCard } from "@/components/organisms";

/**
 * LandingCards — the product carousel. The landing has no cart of its own:
 * a card (and its cart button) hands off to the matching product in the
 * main shop's hidden "Система красоты" section, where it can be bought
 * without registration.
 */
export function LandingCards({ cards, hrefBase }: { cards: PhaseProductCard[]; hrefBase: string }) {
  return (
    <Carousel label="Продукты системы красоты">
      {cards.map((p) => {
        const href = `${hrefBase}#${p.slug}`;
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
