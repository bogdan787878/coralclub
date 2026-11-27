"use client";

import { Carousel } from "@/components/organisms/Carousel";
import { ProductCard } from "@/components/organisms/ProductCard";
import { CARD_RU } from "@/components/organisms/ProductCard";
import { addRu, qtyOf, setRuQty, useRuCart } from "@/lib/ru/cart";
import { ruHref, rub, ruTitle, type RuProduct } from "@/lib/ru/shop";
import { useRuMember, useRuPrices } from "@/lib/ru/live";

/** Карточка товара магазина России: цена участника, зачёркнутая обычная и тег скидки — для гостя и участника. */
function RuCard({ p, index, wide }: { p: RuProduct; index: number; wide?: boolean }) {
  const member = useRuMember();
  const prices = useRuPrices();
  const cart = useRuCart();
  const live = prices.get(p.code);
  const club = live?.club ?? null;
  const retail = live?.retail ?? null;
  const sold = live ? live.available && club !== null : true;
  const title = ruTitle(p);

  // для всех одинаково: цена участника, зачёркнутая обычная и тег скидки (вход — при оформлении заказа)
  const off = club !== null && retail && retail > club ? Math.round((1 - club / retail) * 100) : 0;
  const price = !live ? "…" : !sold ? "Нет в наличии" : rub(club as number);
  const was = live && sold && off > 0 ? rub(retail as number) : undefined;

  return (
    <div data-analytics-item={p.code} data-analytics-index={index} style={{ display: "contents" }}>
      <ProductCard
        fluid
        wide={wide}
        title={title}
        tag={p.tag}
        labels={CARD_RU}
        price={price}
        priceWas={was}
        priceTag={was ? `−${off}%` : undefined}
        href={ruHref(p.slug)}
        cartHref={ruHref(p.slug)}
        images={wide && p.images.length > 1 ? [p.images[1], p.images[0], ...p.images.slice(2)] : p.images}
        cartQty={qtyOf(cart, p.code)}
        onSetQty={(next) => setRuQty(p.code, next)}
        onAddToCart={live && sold ? () => addRu(p, Boolean(member), rub(club as number), was) : undefined}
      />
    </div>
  );
}

/**
 * Ряд карточек (карусель на телефоне, сетка на вебе). `availableFirst` — товары, которых нет в наличии в городе
 * покупателя, в конец ряда (для подборок; состав набора остаётся по порядку).
 */
export function RuCards({
  products,
  label,
  listId,
  minCols,
  availableFirst,
}: {
  products: RuProduct[];
  label: string;
  listId: string;
  minCols?: number;
  availableFirst?: boolean;
}) {
  const prices = useRuPrices();
  const sold = (p: RuProduct) => {
    const live = prices.get(p.code);
    return !live || (live.available && live.club !== null);
  };
  const list = availableFirst ? [...products.filter(sold), ...products.filter((p) => !sold(p))] : products;
  return (
    <div data-analytics-list={listId} data-analytics-list-items={list.map((p) => p.code).join(",")}>
      <Carousel label={label} maxCols={4} minCols={minCols} stretchFew>
        {list.map((p, i) => (
          <RuCard key={p.slug} p={p} index={i + 1} wide={products.length === 1} />
        ))}
      </Carousel>
    </div>
  );
}
