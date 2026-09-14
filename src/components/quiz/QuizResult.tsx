"use client";

import Link from "next/link";
import { buildSelection, recapLines, type Answers } from "@/lib/quiz";
import { productHref } from "@/lib/catalog";
import type { Product } from "@/lib/products";
import { addItem, formatUsd, priceValue, setQty, useCart } from "@/lib/cart";
import styles from "./QuizResult.module.css";

export function QuizResult({ answers }: { answers: Answers }) {
  const products = buildSelection(answers);
  const recap = recapLines(answers);
  const cart = useCart();

  const qtyOf = (coralId?: string) =>
    coralId ? (cart.find((l) => l.coralId === coralId)?.qty ?? 0) : 0;

  const addProduct = (p: Product) => {
    if (!p.coralId) return;
    addItem({
      coralId: p.coralId,
      slug: p.slug,
      name: p.name,
      price: p.prices[0].price,
      image: p.image,
    });
  };

  const addAll = () => products.forEach(addProduct);

  const cartable = products.filter((p) => p.coralId);
  const nowTotal = cartable.reduce((sum, p) => sum + priceValue(p.prices[0].price), 0);
  const wasTotal = cartable.reduce((sum, p) => sum + priceValue(p.prices[1]?.price ?? p.prices[0].price), 0);
  const savingsPct = wasTotal > nowTotal ? Math.round((1 - nowTotal / wasTotal) * 100) : 0;
  const allInCart = cartable.length > 0 && cartable.every((p) => qtyOf(p.coralId) > 0);

  return (
    <div className={styles.result}>
      <p className={styles.kicker}>Done</p>
      <h1 className={styles.title}>Your selection</h1>

      {recap.length > 0 && (
        <div className={styles.recap}>
          <ul>
            {recap.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <ul className={styles.products} role="list">
        {products.map((p) => {
          const qty = qtyOf(p.coralId);
          return (
            <li key={p.slug} className={styles.product}>
              <Link href={productHref(p.slug)} className={styles.productLink}>
                <span className={styles.productBody}>
                  <span className={styles.productName}>{p.name}</span>
                  <span className={styles.productCat}>{p.category}</span>
                </span>
                <span className={styles.productPrice}>
                  <span className={styles.now}>{p.prices[0].price}</span>
                  <span className={styles.was}>{p.prices[1]?.price}</span>
                </span>
              </Link>

              {p.coralId &&
                (qty > 0 ? (
                  <span className={styles.stepper}>
                    <button
                      type="button"
                      aria-label={`Remove one ${p.name}`}
                      onClick={() => setQty(p.coralId as string, qty - 1)}
                    >
                      −
                    </button>
                    <span className={styles.stepperCount} aria-live="polite">
                      {qty}
                    </span>
                    <button
                      type="button"
                      aria-label={`Add one more ${p.name}`}
                      onClick={() => setQty(p.coralId as string, qty + 1)}
                    >
                      +
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => addProduct(p)}
                  >
                    Add to cart
                  </button>
                ))}
            </li>
          );
        })}
      </ul>

      {cartable.length > 0 && (
        <div className={styles.totalBar}>
          <div className={styles.totalInner}>
            <div className={styles.totalPriceBlock}>
              <div className={styles.totalPriceRow}>
                <span className={styles.totalNow}>{formatUsd(nowTotal)}</span>
                {wasTotal > nowTotal && (
                  <span className={styles.totalWas}>{formatUsd(wasTotal)}</span>
                )}
              </div>
              {savingsPct > 0 && (
                <span className={styles.totalSavings}>
                  Subscription price −{savingsPct}%
                </span>
              )}
            </div>
            <button
              type="button"
              className={styles.totalAction}
              disabled={allInCart}
              onClick={addAll}
            >
              {allInCart ? "In cart" : "Add all to cart"}
            </button>
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <Link href="/#phases" className={styles.primary}>
          Browse all categories
        </Link>
        <Link href="/" className={styles.secondary}>
          Home
        </Link>
      </div>
    </div>
  );
}
