"use client";

import { Carousel, ProductCard } from "@/components/organisms";
import { addItem, setQty, useCart } from "@/lib/cart";
import { asset } from "@/lib/asset";
import {
  LANDING_SETS_RU,
  formatRub,
  setRegularRub,
  type LandingSetRu,
} from "@/lib/landingCatalogRu";

function SetCard({ set }: { set: LandingSetRu }) {
  const cart = useCart();
  const qty = cart.find((l) => l.coralId === set.ruId)?.qty ?? 0;
  const price = formatRub(set.priceRub);

  return (
    <ProductCard
      fluid
      title={set.name}
      price={price}
      priceWas={formatRub(setRegularRub(set))}
      priceTag="−20%"
      images={[{ src: asset(set.image), alt: set.alt }]}
      cartQty={qty}
      onSetQty={(next) => setQty(set.ruId, next)}
      onAddToCart={() =>
        addItem({
          coralId: set.ruId,
          slug: `set-${set.ruId}`,
          name: set.name,
          price,
          image: asset(set.image),
        })
      }
    />
  );
}

/** "Выгодные наборы" — the same small card carousel as the product blocks. */
export function LandingSets() {
  return (
    <Carousel label="Выгодные наборы" maxCols={4}>
      {LANDING_SETS_RU.map((set) => (
        <SetCard key={set.ruId} set={set} />
      ))}
    </Carousel>
  );
}
