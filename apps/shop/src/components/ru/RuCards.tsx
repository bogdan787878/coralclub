"use client";

import { Carousel, ProductCard } from "@/components/organisms";
import { CARD_RU } from "@/components/organisms/ProductCard";
import { addRu, qtyOf, setRuQty, useRuCart } from "@/lib/ru/cart";
import { ruHref, rub, ruTitle, type RuProduct } from "@/lib/ru/shop";
import { useRuMember, useRuPrices } from "@/lib/ru/live";

/**
 * Карточка товара магазина России. Гость: обычная цена и под ней цена участника (её он получит после
 * регистрации); участник: только его цена.
 */
function RuCard({ p, index, wide }: { p: RuProduct; index: number; wide?: boolean }) {
  const member = useRuMember();
  const prices = useRuPrices();
  const cart = useRuCart();
  const live = prices.get(p.code);
  const club = live?.club ?? null;
  const retail = live?.retail ?? null;
  const sold = live ? live.available && club !== null : true;
  const title = ruTitle(p);

  let price: string;
  let note: string | undefined;
  if (!live) price = "…";
  else if (!sold) price = "Нет в наличии";
  else if (member) price = rub(club as number);
  else {
    price = rub(retail ?? (club as number));
    note = retail && club !== null && retail > club ? `${rub(club)} — цена участника` : undefined;
  }

  return (
    <div data-analytics-item={p.code} data-analytics-index={index} style={{ display: "contents" }}>
      <ProductCard
        fluid
        wide={wide}
        title={title}
        tag={p.tag}
        labels={CARD_RU}
        price={price}
        priceNote={note}
        href={ruHref(p.slug)}
        cartHref={ruHref(p.slug)}
        images={wide && p.images.length > 1 ? [p.images[1], p.images[0], ...p.images.slice(2)] : p.images}
        cartQty={qtyOf(cart, p.code)}
        onSetQty={(next) => setRuQty(p.code, next)}
        onAddToCart={live && sold ? () => addRu(p, Boolean(member), rub(retail ?? (club as number))) : undefined}
      />
    </div>
  );
}

/** Ряд карточек (карусель на телефоне, сетка на вебе). */
export function RuCards({ products, label, listId, minCols }: { products: RuProduct[]; label: string; listId: string; minCols?: number }) {
  return (
    <div data-analytics-list={listId} data-analytics-list-items={products.map((p) => p.code).join(",")}>
      <Carousel label={label} maxCols={4} minCols={minCols} stretchFew>
        {products.map((p, i) => (
          <RuCard key={p.slug} p={p} index={i + 1} wide={products.length === 1} />
        ))}
      </Carousel>
    </div>
  );
}
