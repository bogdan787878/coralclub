"use client";

import Link from "next/link";
import { useState } from "react";
import { PriceSelector } from "@/components/organisms";
import { Button, Icon } from "@/components/ui";
import sub from "@/components/friend/PdpSubscribeBox.module.css";
import { addRu, qtyOf, setRuQty, useRuCart } from "@/lib/ru/cart";
import { RU_BASE, RU_REGISTRATION_URL, rub, type RuProduct } from "@/lib/ru/shop";
import styles from "./Ru.module.css";

/** Что даёт участие — только то, что обещает сам магазин (как на странице входа). */
const PERKS = ["Цены участника — до 20% ниже обычных", "Бонусные баллы за каждую покупку"];

/**
 * Блок покупки страницы товара. Гость переключает цену (как на PDP «Друга клуба»): «Цена участника» — блок
 * участия в клубе с кнопкой «Стать участником клуба», «Обычная цена» — покупка по ней (корзина в браузере).
 * Участник видит только свою цену.
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
  const [tier, setTier] = useState<"club" | "regular">("club");
  const joining = !member && tier === "club";

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
        <PriceSelector
          value={tier}
          onChange={(id) => setTier(id as "club" | "regular")}
          options={[
            { id: "club", label: "Цена участника", note: off ? `−${off}%` : undefined, price: rub(club) },
            { id: "regular", label: "Обычная цена", price: rub(regular as number) },
          ]}
        />
      )}

      {joining ? (
        <section className={sub.card} aria-label="Участие в клубе" data-analytics-section="pdp_subscribe">
          <div className={sub.head}>
            <h2 className={sub.title}>Цена участника — после бесплатной регистрации</h2>
            {off > 0 && <span className={sub.tag}>−{off}% на этот товар</span>}
          </div>
          <ul className={sub.perks}>
            {PERKS.map((t) => (
              <li key={t} className={sub.perk}>
                <span className={sub.check}>
                  <Icon name="check" size={16} />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <a className={sub.btn} href={RU_REGISTRATION_URL} target="_blank" rel="noopener noreferrer" data-analytics-id="pdp_subscribe_cta">
            Стать участником клуба
          </a>
          <p className={styles.regHint}>
            Уже участник? <Link href={`${RU_BASE}/login/?next=${encodeURIComponent(here)}`}>Войдите</Link>
          </p>
        </section>
      ) : qty > 0 ? (
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
