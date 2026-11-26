"use client";

import { BuyBox } from "@/components/organisms";
import { addRu, qtyOf, setRuQty, useRuCart } from "@/lib/ru/cart";
import { RU_BASE, rub, ruTitle, type RuProduct } from "@/lib/ru/shop";
import styles from "./Ru.module.css";

/**
 * Блок покупки страницы товара — компонент главного магазина (BuyBox): на телефоне плашка над нижним меню, на
 * вебе колонка рядом с описанием. Цена участника, зачёркнутая обычная, под ними тег «Цена участника −N%»;
 * «В корзину» сменяется степпером «− N +». Одинаково для гостя и участника (вход — при оформлении заказа).
 */
export function RuBuyBox({
  p,
  member,
  club,
  retail,
  available,
}: {
  p: RuProduct;
  member: boolean;
  club: number | null;
  retail: number | null;
  available: boolean;
}) {
  const cart = useRuCart();

  if (!available || club === null) {
    return <p className={styles.regHint}>Сейчас нет в наличии.</p>;
  }

  const off = retail && retail > club ? Math.round((1 - club / retail) * 100) : 0;
  const was = off > 0 ? rub(retail as number) : undefined;
  const href = `${RU_BASE}/product/${p.slug}/`;
  return (
    <BuyBox
      product={{ coralId: String(p.code), slug: p.slug, name: ruTitle(p), image: p.images[0]?.src }}
      options={[
        { id: "club", label: "Цена участника", note: off ? `Цена участника −${off}%` : undefined, price: rub(club), cta: { label: "В корзину", href } },
        { id: "regular", label: "Обычная цена", price: was ?? "", cta: { label: "В корзину", href } },
      ]}
      labels={{ add: "В корзину", removeOne: "Убрать одну", addOne: "Добавить ещё" }}
      qty={qtyOf(cart, p.code)}
      onAdd={() => addRu(p, member, rub(club), was)}
      onSetQty={(next) => setRuQty(p.code, next)}
    />
  );
}
