"use client";

import type { PhaseProductCard } from "@/lib/products";
import { addItem, setQty, useCart } from "@/lib/cart";
import {
  LANDING_PRODUCTS_RU,
  discountTag,
  fullTitle,
  landingPdpHref,
  landingTag,
  type BeautySlug,
} from "@/lib/landingCatalogRu";
import { ProductTitle } from "./ProductTitle";
import { Carousel, ProductCard } from "@/components/organisms";

function LandingCard({
  p,
  reserveTag,
  index,
}: {
  p: PhaseProductCard;
  reserveTag: boolean;
  index: number;
}) {
  const cart = useCart();
  const ru = LANDING_PRODUCTS_RU[p.slug as BeautySlug];
  const href = landingPdpHref(p.slug);
  const qty = ru ? (cart.find((l) => l.coralId === ru.ruId)?.qty ?? 0) : 0;

  return (
    // analytics: which product / position this card is (see Analytics.tsx)
    <div
      data-analytics-item={ru?.ruId}
      data-analytics-index={index}
      style={{ display: "contents" }}
    >
      <ProductCard
        fluid
        title={
          ru ? <ProductTitle title={ru.title} form={ru.form} /> : p.headline
        }
        price={p.price}
        priceWas={p.priceWas}
        tag={landingTag(p.slug)}
        reserveTag={reserveTag}
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
    </div>
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
  listId,
  listName,
}: {
  cards: PhaseProductCard[];
  label?: string;
  /** Keep cards at grid-column size even when there are only a few. */
  minCols?: number;
  /** Analytics: which shelf this is (item_list_id / item_list_name). */
  listId?: string;
  listName?: string;
}) {
  // keep names/prices aligned when only some cards in the row carry a tag
  const reserveTag = cards.some((p) => landingTag(p.slug));
  const itemIds = cards
    .map((p) => LANDING_PRODUCTS_RU[p.slug as BeautySlug]?.ruId)
    .filter(Boolean)
    .join(",");
  return (
    <div
      data-analytics-list={listId}
      data-analytics-list-name={listName}
      data-analytics-list-items={itemIds}
    >
      <Carousel label={label} maxCols={4} minCols={minCols} stretchFew>
        {cards.map((p, i) => (
          <LandingCard
            key={p.slug}
            p={p}
            reserveTag={reserveTag}
            index={i + 1}
          />
        ))}
      </Carousel>
    </div>
  );
}
