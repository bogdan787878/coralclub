"use client";

import type { PhaseProductCard } from "@/lib/products";
import { addItem, setQty, useCart } from "@/lib/cart";
import {
  LANDING_PRODUCTS_RU,
  discountTag,
  fullTitle,
  landingPdpHref,
  type BeautySlug,
} from "@/lib/landingCatalogRu";
import { ProductTitle } from "./ProductTitle";
import { Carousel, ProductCard } from "@/components/organisms";

function LandingCard({ p }: { p: PhaseProductCard }) {
  const cart = useCart();
  const ru = LANDING_PRODUCTS_RU[p.slug as BeautySlug];
  const href = landingPdpHref(p.slug);
  const qty = ru ? (cart.find((l) => l.coralId === ru.ruId)?.qty ?? 0) : 0;

  return (
    <ProductCard
      fluid
      title={ru ? <ProductTitle title={ru.title} form={ru.form} /> : p.headline}
      price={p.price}
      priceWas={p.priceWas}
      priceTag={discountTag(p.slug)}
      // badge={packOf(p.slug)} — pack stickers are switched off for now
      href={href}
      cartHref={href}
      images={p.images}
      // the cart button adds to the local cart (the product page is one tap
      // away through the photo and the name)
      cartQty={qty}
      onSetQty={ru ? (next) => setQty(ru.ruId, next) : undefined}
      onAddToCart={
        ru
          ? () =>
              addItem({
                coralId: ru.ruId,
                slug: p.slug,
                name: fullTitle(p.slug),
                price: String(p.price),
                image: p.images?.[0]?.src,
              })
          : undefined
      }
    />
  );
}

/**
 * LandingCards — the product carousel. The photo and the name open that
 * product's Russian page of this landing; the cart button puts it in the
 * landing's own cart (checkout is handed off to the shop from there).
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
      {cards.map((p) => (
        <LandingCard key={p.slug} p={p} />
      ))}
    </Carousel>
  );
}
