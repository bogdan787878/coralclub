"use client";

import { Carousel, ProductCard } from "@/components/organisms";
import { addItem, setQty, useCart } from "@/lib/cart";
import { friendPdpHref, type FriendProduct } from "@/lib/friendCatalog";
import { useFriendPricing } from "@/lib/friendPricing";

function FriendCard({ p, index }: { p: FriendProduct; index: number }) {
  const cart = useCart();
  const qty = cart.find((l) => l.coralId === p.coralId)?.qty ?? 0;
  const pr = useFriendPricing();
  const sold = pr.sold(p);
  const club = sold ? pr.money(pr.club(p)) : "Not sold here";
  const title = p.form ? `${p.name} – ${p.form}` : p.name;

  return (
    // analytics: which product / position this card is (see Analytics.tsx)
    <div
      data-analytics-item={p.coralId}
      data-analytics-index={index}
      style={{ display: "contents" }}
    >
      <ProductCard
        fluid
        title={title}
        tag={p.tag}
        price={club}
        priceWas={sold ? pr.money(pr.regular(p)) : undefined}
        priceTag={sold ? "−20%" : undefined}
        href={friendPdpHref(p.slug)}
        cartHref={friendPdpHref(p.slug)}
        images={p.images}
        cartQty={qty}
        onSetQty={(next) => setQty(p.coralId, next)}
        onAddToCart={() =>
          addItem({
            coralId: p.coralId,
            slug: p.slug,
            name: title,
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
      data-analytics-list-items={products.map((p) => p.coralId).join(",")}
    >
      <Carousel label={label} maxCols={4} minCols={minCols} stretchFew>
        {products.map((p, i) => (
          <FriendCard key={p.slug} p={p} index={i + 1} />
        ))}
      </Carousel>
    </div>
  );
}
