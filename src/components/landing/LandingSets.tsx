"use client";

import Image from "next/image";
import { Carousel } from "@/components/organisms";
import { addItem, openCart, useCart } from "@/lib/cart";
import { asset } from "@/lib/asset";
import {
  LANDING_SETS_RU,
  formatRub,
  setSavingRub,
  setSeparatelyRub,
  type LandingSetRu,
} from "@/lib/landingCatalogRu";
import styles from "./LandingSets.module.css";

function SetCard({ set }: { set: LandingSetRu }) {
  const cart = useCart();
  const inCart = cart.some((l) => l.coralId === set.ruId);
  const saving = setSavingRub(set);
  const separately = setSeparatelyRub(set);
  const price = formatRub(set.priceRub);

  const add = () => {
    if (inCart) {
      openCart();
      return;
    }
    addItem({
      coralId: set.ruId,
      slug: `set-${set.ruId}`,
      name: set.name,
      price,
      image: asset(set.image),
    });
  };

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        <Image
          src={asset(set.image)}
          alt={set.alt}
          fill
          sizes="(max-width: 1023px) 80vw, 400px"
        />
        {saving > 0 && (
          <span className={styles.saving}>Выгода {formatRub(saving)}</span>
        )}
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{set.name}</h3>
        <ul className={styles.parts}>
          {set.parts.map((p) => (
            <li key={p.slug}>{p.label}</li>
          ))}
        </ul>

        <div className={styles.prices}>
          <span className={styles.price}>{price}</span>
          {saving > 0 && (
            <span className={styles.was}>
              по отдельности {formatRub(separately)}
            </span>
          )}
        </div>

        <button
          type="button"
          className={inCart ? styles.btnIn : styles.btn}
          onClick={add}
        >
          {inCart ? "В корзине ✓" : "В корзину"}
        </button>
      </div>
    </article>
  );
}

/** "Выгодные наборы" — bundles with the saving against buying separately. */
export function LandingSets() {
  return (
    <Carousel
      label="Выгодные наборы"
      itemWidth="min(80vw, 320px)"
      maxCols={3}
      minCols={3}
    >
      {LANDING_SETS_RU.map((set) => (
        <SetCard key={set.ruId} set={set} />
      ))}
    </Carousel>
  );
}
