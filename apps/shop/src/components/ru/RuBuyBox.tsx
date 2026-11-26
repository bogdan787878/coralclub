"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { addRu, qtyOf, setRuQty, useRuCart } from "@/lib/ru/cart";
import { RU_BASE, RU_REGISTRATION_URL, rub, type RuProduct } from "@/lib/ru/shop";
import styles from "./Ru.module.css";

/**
 * Блок покупки страницы товара. Гость видит обе цены — обычную (по ней товар лежит в его корзине) и цену
 * участника с приглашением войти или зарегистрироваться; участник — только свою цену.
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
  const qty = qtyOf(cart, p.code);
  const regular = retail ?? club;
  const off = club !== null && retail && retail > club ? Math.round((1 - club / retail) * 100) : 0;
  const here = `${RU_BASE}/product/${p.slug}/`;

  if (!available || club === null) {
    return <p className={styles.regHint}>Сейчас нет в наличии.</p>;
  }

  return (
    <div className={styles.buy}>
      {member ? (
        <div className={styles.memberPrice}>
          <span className={styles.priceValue}>{rub(club)}</span>
          <span className={styles.memberNote}>Ваша цена участника</span>
        </div>
      ) : (
        <>
          <div className={styles.prices}>
            <div className={styles.priceRow}>
              <span className={styles.priceLabel}>Обычная цена</span>
              <span className={styles.priceValue}>{rub(regular as number)}</span>
            </div>
            <div className={`${styles.priceRow} ${styles.priceRowClub}`}>
              <span className={styles.priceLabel}>
                Цена участника{off ? ` −${off}%` : ""}
                <span className={styles.priceSub}>после бесплатной регистрации</span>
              </span>
              <span className={styles.priceValue}>{rub(club)}</span>
            </div>
          </div>
          <p className={styles.regHint}>
            <Link href={`${RU_BASE}/login/?next=${encodeURIComponent(here)}`}>Войдите</Link> или{" "}
            <a href={RU_REGISTRATION_URL} target="_blank" rel="noopener noreferrer">
              зарегистрируйтесь
            </a>
            , чтобы покупать по цене участника.
          </p>
        </>
      )}

      {qty > 0 ? (
        <>
          <div className={styles.stepper}>
            <button type="button" aria-label="Убрать одну" onClick={() => setRuQty(p.code, qty - 1)}>
              −
            </button>
            <span aria-live="polite">В корзине: {qty}</span>
            <button type="button" aria-label="Добавить ещё" onClick={() => setRuQty(p.code, qty + 1)}>
              +
            </button>
          </div>
          <Button variant="secondary" block href={`${RU_BASE}/cart/`}>
            Перейти в корзину
          </Button>
        </>
      ) : (
        <Button variant="primary" block data-analytics-id="pdp_add_to_cart_btn" onClick={() => addRu(p, member, rub(regular as number))}>
          В корзину
        </Button>
      )}
    </div>
  );
}
