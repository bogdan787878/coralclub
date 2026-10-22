"use client";

import Image from "next/image";
import { addItem, useCart, type CartLine } from "@/lib/cart";
import {
  FREE_SHIPPING_FROM,
  FRIEND_PRODUCTS,
  formatMoney,
  friendProductById,
  friendTotals,
} from "@/lib/friendCatalog";
import styles from "./FriendCartParts.module.css";

/** Savings so far + progress to free shipping, above the cart lines. */
export function CartBanner({ lines }: { lines: CartLine[] }) {
  const { club, saving } = friendTotals(lines);
  const left = Math.max(0, FREE_SHIPPING_FROM - club);
  return (
    <div className={styles.banner}>
      {saving > 0 && (
        <p className={styles.saving}>
          <span className={styles.dot} aria-hidden="true" />
          You’re saving {formatMoney(saving)} with member prices
        </p>
      )}
      <div className={styles.ship}>
        <p>
          {left > 0
            ? `Add ${formatMoney(left)} more for free shipping`
            : "You’ve unlocked free shipping"}
        </p>
        <div
          className={styles.bar}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={FREE_SHIPPING_FROM}
          aria-valuenow={Math.min(club, FREE_SHIPPING_FROM)}
        >
          <span
            style={{
              width: `${Math.min(100, (club / FREE_SHIPPING_FROM) * 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/** A line's price: regular struck through, member price, and what it saves. */
export function LinePrice({ line }: { line: CartLine }) {
  const p = friendProductById(line.coralId);
  if (!p) return <span className={styles.member}>{line.price}</span>;
  const saved = (p.regular - p.club) * line.qty;
  return (
    <span className={styles.price}>
      <span className={styles.member}>{formatMoney(p.club)}</span>{" "}
      <span className={styles.was}>{formatMoney(p.regular)}</span>
      {saved > 0 && (
        <span className={styles.savings}>{formatMoney(saved)} savings</span>
      )}
    </span>
  );
}

/** «You may also like»: the project's other products, one tap to add. */
export function Recommendations() {
  const cart = useCart();
  const inCart = new Set(cart.map((l) => l.coralId));
  const others = FRIEND_PRODUCTS.filter((p) => !inCart.has(p.coralId));
  if (!others.length) return null;
  return (
    <section className={styles.recs} aria-label="You may also like">
      <h3 className={styles.recsTitle}>You may also like</h3>
      <ul className={styles.recsList}>
        {others.map((p) => (
          <li key={p.slug} className={styles.rec}>
            <span className={styles.recImg}>
              {p.images[0] && (
                <Image src={p.images[0].src} alt="" fill sizes="96px" />
              )}
            </span>
            <span className={styles.recName}>{p.name}</span>
            <span className={styles.recPrice}>
              {formatMoney(p.club)}{" "}
              <span className={styles.was}>{formatMoney(p.regular)}</span>
            </span>
            <button
              type="button"
              className={styles.recAdd}
              data-analytics-id="cart_recommend_add"
              onClick={() =>
                addItem({
                  coralId: p.coralId,
                  slug: p.slug,
                  name: p.form ? `${p.name} – ${p.form}` : p.name,
                  price: formatMoney(p.club),
                  image: p.images[0]?.src,
                })
              }
            >
              Add
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Discount / subtotal / shipping rows above the checkout button. */
export function CartSummary({ lines }: { lines: CartLine[] }) {
  const { club, saving } = friendTotals(lines);
  return (
    <dl className={styles.summary}>
      {saving > 0 && (
        <div className={styles.discount}>
          <dt>Member discount</dt>
          <dd>−{formatMoney(saving)}</dd>
        </div>
      )}
      <div>
        <dt>Subtotal</dt>
        <dd>{formatMoney(club)}</dd>
      </div>
      <div>
        <dt>Shipping</dt>
        <dd>{club >= FREE_SHIPPING_FROM ? "Free" : "At checkout"}</dd>
      </div>
    </dl>
  );
}
