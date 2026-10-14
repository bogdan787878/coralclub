import type { PhaseProductCard } from "@/lib/products";
import {
  LANDING_PRODUCTS_RU,
  discountTag,
  landingPdpHref,
  type BeautySlug,
} from "@/lib/landingCatalogRu";
import { ProductTitle } from "./ProductTitle";
import { Carousel, ProductCard } from "@/components/organisms";

/**
 * LandingCards — the product carousel. Every card (and its cart button)
 * opens that product's Russian page of this landing; the purchase itself
 * is handed off to the main shop from there.
 */
export function LandingCards({
  cards,
  label = "Продукты системы красоты",
  minCols,
}: {
  cards: PhaseProductCard[];
  label?: string;
  /** Keep cards at grid-column size even when there are only a few. */
  minCols?: number;
}) {
  return (
    <Carousel label={label} maxCols={4} minCols={minCols} stretchFew>
      {cards.map((p) => {
        const href = landingPdpHref(p.slug);
        return (
          <ProductCard
            key={p.slug}
            fluid
            title={
              LANDING_PRODUCTS_RU[p.slug as BeautySlug] ? (
                <ProductTitle
                  title={LANDING_PRODUCTS_RU[p.slug as BeautySlug].title}
                  form={LANDING_PRODUCTS_RU[p.slug as BeautySlug].form}
                />
              ) : (
                p.headline
              )
            }
            price={p.price}
            priceWas={p.priceWas}
            priceTag={discountTag(p.slug)}
            // badge={packOf(p.slug)} — pack stickers are switched off for now
            href={href}
            cartHref={href}
            images={p.images}
          />
        );
      })}
    </Carousel>
  );
}
