"use client";

import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { asset } from "@/lib/asset";
import { track } from "@/lib/analytics";
import { CURRENCY, summarize } from "@/lib/analyticsRu";
import { priceValue, useCart } from "@/lib/cart";
import { shopBasketUrl } from "@/lib/friend";
import { formatRub } from "@/lib/landingCatalogRu";
import { useFriend } from "./FriendProvider";
import { FriendRegisterCta } from "./FriendRegisterCta";
import styles from "./Friend.module.css";

const REGULAR_FACTOR = 1.25;

/**
 * The project's checkout step: the order as the visitor built it, whose sale
 * it will be, and one button that hands the cart to the shop's basket (club
 * prices, no registration). The registration offer sits below, optional.
 */
export function FriendCheckout() {
  const lines = useCart();
  const { friend, source } = useFriend();

  const club = lines.reduce((sum, l) => sum + priceValue(l.price) * l.qty, 0);
  const regular = club * REGULAR_FACTOR;
  const saving = regular - club;
  const goods = summarize(lines);

  const toShop = () => {
    if (!friend || !lines.length) return;
    track(
      "friend_redirect_to_shop",
      { bonus_points: goods.bonus_points },
      { currency: CURRENCY, value: goods.value, items: goods.items },
    );
    window.location.assign(shopBasketUrl(lines, friend));
  };

  return (
    <div className="appShell">
      <main className={styles.page} data-analytics-location="checkout">
        <LandingHeader homeHref={asset("/friend/")} />

        <Container className={styles.checkout}>
          <h1 className={styles.h1}>Оформление заказа</h1>
          <ol className={styles.progress} aria-label="Шаги">
            <li>Корзина</li>
            <li className={styles.progressOn}>Проверка</li>
            <li>Оплата в Coral Club</li>
          </ol>

          {lines.length === 0 ? (
            <section className={styles.card}>
              <p className={styles.muted}>В корзине пока пусто.</p>
              <Link href="/friend/" className={styles.ghostBtn}>
                К наборам
              </Link>
            </section>
          ) : (
            <>
              <section className={styles.card} aria-label="Ваш заказ">
                <h2 className={styles.h3}>Ваш заказ</h2>
                <ul className={styles.rows}>
                  {lines.map((l) => (
                    <li key={l.coralId}>
                      <span className={styles.thumb}>
                        {l.image && (
                          <Image src={l.image} alt="" fill sizes="56px" />
                        )}
                      </span>
                      <span className={styles.rowName}>
                        {l.name}
                        <small>
                          {l.qty} × {l.price}
                        </small>
                      </span>
                      <span className={styles.rowSum}>
                        {formatRub(priceValue(l.price) * l.qty)}
                      </span>
                    </li>
                  ))}
                </ul>
                <dl className={styles.totals}>
                  <div>
                    <dt>Обычная цена</dt>
                    <dd className={styles.was}>{formatRub(regular)}</dd>
                  </div>
                  <div>
                    <dt>Клубная скидка −20%</dt>
                    <dd>−{formatRub(saving)}</dd>
                  </div>
                  <div className={styles.grand}>
                    <dt>Итого по клубной цене</dt>
                    <dd>{formatRub(club)}</dd>
                  </div>
                </dl>
              </section>

              <section
                className={styles.card}
                aria-label="Кому засчитается покупка"
              >
                <h2 className={styles.h3}>Кому засчитается покупка</h2>
                {friend ? (
                  <div className={styles.owner}>
                    {friend.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element -- avatar comes from the shop, any host
                      <img
                        src={friend.avatar}
                        alt=""
                        width={48}
                        height={48}
                        className={styles.avatar}
                      />
                    ) : (
                      <span className={styles.avatar} aria-hidden="true" />
                    )}
                    <p>
                      <strong>{friend.name}</strong>
                      <br />
                      Coral ID {friend.memberId}
                      {source === "demo" && (
                        <>
                          <br />
                          <small>
                            Тест: ссылки нет, взят дистрибьютор по умолчанию.
                          </small>
                        </>
                      )}
                    </p>
                  </div>
                ) : (
                  <p className={styles.muted}>Определяем дистрибьютора…</p>
                )}
              </section>

              <button
                type="button"
                className={styles.primary}
                onClick={toShop}
                disabled={!friend}
                data-analytics-id="checkout_to_shop_btn"
              >
                Оформить без регистрации
              </button>
              <p className={styles.muted}>
                Откроется корзина Coral Club с этими товарами по клубным ценам.
                Нажмите там «Оформить», регистрироваться не нужно.
              </p>

              <FriendRegisterCta where="checkout" />
            </>
          )}
        </Container>
      </main>
    </div>
  );
}
