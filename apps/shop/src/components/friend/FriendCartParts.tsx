"use client";

import Image from "next/image";
import { addItem, useCart, type CartLine } from "@/lib/cart";
import { FRIEND_PRODUCTS, friendProductById } from "@/lib/friendCatalog";
import { useFriendPricing } from "@/lib/friendPricing";
import { tr, useFriendLang } from "@/lib/friendLang";
import { friendTitle } from "@/lib/friendRu";
import styles from "@/components/cart/CartParts.module.css";

/** Savings so far + progress to free shipping, above the cart lines. */
export function CartBanner({ lines }: { lines: CartLine[] }) {
  const pr = useFriendPricing();
  const { club, saving } = pr.totals(lines);
  const free = pr.freeFrom;
  const left = free === null ? 0 : Math.max(0, free - club);
  const lang = useFriendLang();
  return (
    <div className={styles.banner}>
      {saving > 0 && (
        <p className={styles.saving}>
          <span className={styles.dot} aria-hidden="true" />
          {tr(lang, `You’re saving ${pr.money(saving)} with member prices`, `Вы экономите ${pr.money(saving)} на ценах участника`)}
        </p>
      )}
      {free !== null && (
        <div className={styles.ship}>
          <p>
            {left > 0
              ? tr(lang, `Add ${pr.money(left)} more for free shipping`, `Ещё ${pr.money(left)} до бесплатной доставки`)
              : tr(lang, "You’ve unlocked free shipping", "Доставка будет бесплатной")}
          </p>
          <div
            className={styles.bar}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={free}
            aria-valuenow={Math.min(club, free)}
          >
            <span
              style={{
                width: `${Math.min(100, (club / free) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** A line's price: regular struck through, member price, and what it saves. */
export function LinePrice({ line }: { line: CartLine }) {
  const pr = useFriendPricing();
  const lang = useFriendLang();
  const p = friendProductById(line.coralId);
  if (!p) return <span className={styles.member}>{line.price}</span>;
  if (!pr.sold(p)) return <span className={styles.was}>{tr(lang, "Not sold here", "Нет в продаже")}</span>;
  const saved = (pr.regular(p) - pr.club(p)) * line.qty;
  return (
    <span className={styles.price}>
      <span className={styles.member}>{pr.money(pr.club(p))}</span>{" "}
      <span className={styles.was}>{pr.money(pr.regular(p))}</span>
      {saved > 0 && (
        <span className={styles.savings}>{tr(lang, `${pr.money(saved)} savings`, `Экономия ${pr.money(saved)}`)}</span>
      )}
    </span>
  );
}

/** «You may also like»: the project's other products, one tap to add. */
export function Recommendations() {
  const cart = useCart();
  const pr = useFriendPricing();
  const inCart = new Set(cart.map((l) => l.coralId));
  const lang = useFriendLang();
  const also = tr(lang, "You may also like", "Вам может понравиться");
  // what the country's site does not sell is not recommended
  const others = FRIEND_PRODUCTS.filter(
    (p) => !inCart.has(p.coralId) && pr.sold(p),
  );
  if (!others.length) return null;
  return (
    <section className={styles.recs} aria-label={also}>
      <h3 className={styles.recsTitle}>{also}</h3>
      <ul className={styles.recsList}>
        {others.map((p) => (
          <li key={p.slug} className={styles.rec}>
            <span className={styles.recImg}>
              {p.images[0] && (
                <Image src={p.images[0].src} alt="" fill sizes="96px" />
              )}
            </span>
            <span className={styles.recName}>{friendTitle({ ...p, form: "" }, lang)}</span>
            <span className={styles.recPrice}>
              {pr.money(pr.club(p))}{" "}
              <span className={styles.was}>{pr.money(pr.regular(p))}</span>
            </span>
            <button
              type="button"
              className={styles.recAdd}
              data-analytics-id="cart_recommend_add"
              onClick={() =>
                addItem({
                  coralId: p.coralId,
                  slug: p.slug,
                  name: friendTitle(p, lang),
                  price: pr.money(pr.club(p)),
                  image: p.images[0]?.src,
                })
              }
            >
              {tr(lang, "Add", "Добавить")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Discount / subtotal / shipping rows above the checkout button. */
export function CartSummary({ lines }: { lines: CartLine[] }) {
  const pr = useFriendPricing();
  const { club, saving } = pr.totals(lines);
  const lang = useFriendLang();
  return (
    <dl className={styles.summary}>
      {saving > 0 && (
        <div className={styles.discount}>
          <dt>{tr(lang, "Member discount", "Скидка участника")}</dt>
          <dd>−{pr.money(saving)}</dd>
        </div>
      )}
      <div>
        <dt>{tr(lang, "Subtotal", "Товары")}</dt>
        <dd>{pr.money(club)}</dd>
      </div>
      <div>
        <dt>{tr(lang, "Shipping", "Доставка")}</dt>
        <dd>
          {pr.freeFrom !== null && club >= pr.freeFrom ? tr(lang, "Free", "Бесплатно") : tr(lang, "At checkout", "При оформлении")}
        </dd>
      </div>
    </dl>
  );
}
