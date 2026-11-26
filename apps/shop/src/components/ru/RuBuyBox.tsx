"use client";

import { Button } from "@/components/ui";
import { addRu, qtyOf, setRuQty, useRuCart } from "@/lib/ru/cart";
import { RU_BASE, rub, type RuProduct } from "@/lib/ru/shop";
import styles from "./Ru.module.css";

/**
 * Блок покупки страницы товара: цена участника клуба, рядом зачёркнутая обычная и тег скидки — одинаково для
 * гостя и участника. Гость кладёт товар в корзину в браузере; вход или регистрация — при оформлении заказа.
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
  const off = club !== null && retail && retail > club ? Math.round((1 - club / retail) * 100) : 0;

  if (!available || club === null) {
    return <p className={styles.regHint}>Сейчас нет в наличии.</p>;
  }

  return (
    <div className={styles.buy}>
      <p className={styles.pdpPrice}>
        <span className={styles.pdpNow}>{rub(club)}</span>
        {off > 0 && (
          <>
            <s className={styles.pdpWas}>{rub(retail as number)}</s>
            <span className={styles.pdpTag}>−{off}%</span>
          </>
        )}
      </p>

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
        <Button variant="primary" block data-analytics-id="pdp_add_to_cart_btn" onClick={() => addRu(p, member, rub(club), off > 0 ? rub(retail as number) : undefined)}>
          В корзину
        </Button>
      )}
    </div>
  );
}
