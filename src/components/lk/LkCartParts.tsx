"use client";

import { useEffect, useState } from "react";
import { addItem, priceValue, type CartLine } from "@/lib/cart";
import { HYDRATION_CODES, fetchProducts, rub, type LkProduct } from "@/lib/lk/catalog";
import styles from "@/components/cart/CartParts.module.css";

const savingOf = (lines: CartLine[]) =>
  lines.reduce((sum, l) => {
    const was = l.was ? priceValue(l.was) : 0;
    const now = priceValue(l.price);
    return was > now ? sum + (was - now) * l.qty : sum;
  }, 0);

const subtotalOf = (lines: CartLine[]) => lines.reduce((sum, l) => sum + priceValue(l.price) * l.qty, 0);

/** Savings so far, above the cart lines (the member area's twin of the friend project's CartBanner). */
export function LkCartBanner({ lines }: { lines: CartLine[] }) {
  const saving = savingOf(lines);
  if (saving <= 0) return null;
  return (
    <div className={styles.banner}>
      <p className={styles.saving}>
        <span className={styles.dot} aria-hidden="true" />
        Вы экономите {rub(saving)} на ценах участника
      </p>
    </div>
  );
}

/** A line's price: regular struck through, member price, and what it saves. */
export function LkLinePrice({ line }: { line: CartLine }) {
  const now = priceValue(line.price);
  const was = line.was ? priceValue(line.was) : 0;
  if (!line.price) return <span className={styles.member}>Цена при оформлении</span>;
  return (
    <span className={styles.price}>
      <span className={styles.member}>{line.price}</span>
      {was > now && (
        <>
          {" "}
          <span className={styles.was}>{line.was}</span>
          <span className={styles.savings}>Экономия {rub((was - now) * line.qty)}</span>
        </>
      )}
    </span>
  );
}

/** Discount / subtotal / shipping rows above the checkout button. */
export function LkCartSummary({ lines }: { lines: CartLine[] }) {
  const saving = savingOf(lines);
  return (
    <dl className={styles.summary}>
      {saving > 0 && (
        <div className={styles.discount}>
          <dt>Скидка участника</dt>
          <dd>−{rub(saving)}</dd>
        </div>
      )}
      <div>
        <dt>Товары</dt>
        <dd>{rub(subtotalOf(lines))}</dd>
      </div>
      <div>
        <dt>Доставка</dt>
        <dd>при оформлении</dd>
      </div>
    </dl>
  );
}

/** «Вам может понравиться»: the Hydration section's other products, one tap to add. */
export function LkRecommendations({ lines }: { lines: CartLine[] }) {
  const [products, setProducts] = useState<LkProduct[]>([]);
  useEffect(() => {
    let alive = true;
    fetchProducts(HYDRATION_CODES).then((p) => alive && setProducts(p));
    return () => {
      alive = false;
    };
  }, []);
  const inCart = new Set(lines.map((l) => l.coralId));
  const others = products.filter((p) => !inCart.has(String(p.code)) && p.available && p.club !== null);
  if (!others.length) return null;
  return (
    <section className={styles.recs} aria-label="Вам может понравиться">
      <h3 className={styles.recsTitle}>Вам может понравиться</h3>
      <ul className={styles.recsList}>
        {others.map((p) => (
          <li key={p.code} className={styles.rec}>
            <span className={styles.recImg}>
              {/* eslint-disable-next-line @next/next/no-img-element -- the shop's own picture, an absolute address */}
              {p.image && <img src={p.image} alt="" />}
            </span>
            <span className={styles.recName}>{p.name}</span>
            <span className={styles.recPrice}>
              {rub(p.club ?? 0, p.currency)}
              {p.retail && p.club !== null && p.retail > p.club && (
                <>
                  {" "}
                  <span className={styles.was}>{rub(p.retail, p.currency)}</span>
                </>
              )}
            </span>
            <button
              type="button"
              className={styles.recAdd}
              onClick={() =>
                addItem({
                  coralId: String(p.code),
                  slug: String(p.code),
                  name: p.note ? `${p.name}, ${p.note}` : p.name,
                  price: rub(p.club ?? 0, p.currency),
                  image: p.image || undefined,
                  was: p.retail && p.club !== null && p.retail > p.club ? rub(p.retail, p.currency) : undefined,
                })
              }
            >
              Добавить
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
