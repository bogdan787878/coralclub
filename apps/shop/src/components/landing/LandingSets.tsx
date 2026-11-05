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

function SetCard({ set, index }: { set: LandingSetRu; index: number }) {
  const cart = useCart();
  const qty = cart.find((l) => l.coralId === set.ruId)?.qty ?? 0;
  const price = formatRub(set.priceRub);

  return (
    <div
      data-analytics-item={set.ruId}
      data-analytics-index={index}
      style={{ display: "contents" }}
    >
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
    </div>
  );
}

/** "Выгодные наборы" — the same small card carousel as the product blocks. */
export function LandingSets() {
  return (
    <div
      data-analytics-list="landing_sets"
      data-analytics-list-name="Выгодные наборы"
      data-analytics-list-items={LANDING_SETS_RU.map((s) => s.ruId).join(",")}
    >
      <Carousel label="Выгодные наборы" maxCols={4}>
        {LANDING_SETS_RU.map((set, i) => (
          <SetCard key={set.ruId} set={set} index={i + 1} />
        ))}
      </Carousel>
    </div>
  );
}
