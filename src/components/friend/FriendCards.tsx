"use client";

import { Carousel, ProductCard } from "@/components/organisms";
import { ProductTitle } from "@/components/landing/ProductTitle";
import { addItem, setQty, useCart } from "@/lib/cart";
import { formatRub } from "@/lib/landingCatalogRu";
import { friendPdpHref, type FriendProduct } from "@/lib/friendCatalog";

function FriendCard({ p, index }: { p: FriendProduct; index: number }) {
  const cart = useCart();
  const qty = cart.find((l) => l.coralId === p.ruId)?.qty ?? 0;
  const club = formatRub(p.club);

  return (
    // analytics: which product / position this card is (see Analytics.tsx)
    <div
      data-analytics-item={p.ruId}
      data-analytics-index={index}
      style={{ display: "contents" }}
    >
      <ProductCard
        fluid
        title={<ProductTitle title={p.name} form={{ label: p.form }} />}
        tag={p.tag}
        price={club}
        priceWas={formatRub(p.regular)}
        priceTag="−20%"
        href={friendPdpHref(p.slug)}
        cartHref={friendPdpHref(p.slug)}
        images={p.images}
        cartQty={qty}
        onSetQty={(next) => setQty(p.ruId, next)}
        onAddToCart={() =>
          addItem({
            coralId: p.ruId,
            slug: p.slug,
            name: `${p.name} – ${p.form}`,
            price: club,
            image: p.images[0]?.src,
          })
        }
      />
    </div>
  );
}

/** A row / grid of the project's product cards (add to cart, club price). */
export function FriendCards({
  products,
  listId,
  listName,
  label,
  minCols,
}: {
  products: FriendProduct[];
  listId: string;
  listName: string;
  label: string;
  minCols?: number;
}) {
  return (
    <div
      data-analytics-list={listId}
      data-analytics-list-name={listName}
      data-analytics-list-items={products.map((p) => p.ruId).join(",")}
    >
      <Carousel label={label} maxCols={4} minCols={minCols} stretchFew>
        {products.map((p, i) => (
          <FriendCard key={p.slug} p={p} index={i + 1} />
        ))}
      </Carousel>
    </div>
  );
}
