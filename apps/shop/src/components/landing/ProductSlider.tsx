"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageSlider } from "@/components/organisms";
import styles from "./ProductSlider.module.css";

export type ProductSlide = {
  id: string;
  title: string;
  /** Rich title for the name link ("Название – форма"); falls back to `title`. */
  titleNode?: ReactNode;
  image: { src: string; alt: string; position?: string; fit?: "cover" };
  /** All photos of the product — shown as a swipeable gallery in a card. */
  images?: { src: string; alt: string }[];
  lead: string;
  bullets?: string[];
  extra?: string;
  /** Round "sticker" over the photo's corner — units per pack. */
  badge?: { count: string; unit: string };
  /** When set, the slide shows the product row (category, name, price and
   *  a cart button) under the image, like a product card. */
  meta?: {
    price: string;
    priceWas?: string;
    /** Discount size pill, e.g. "−20%". */
    discount?: string;
    href: string;
  };
};

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5h2.2l1.9 9.6a2 2 0 0 0 2 1.6h7a2 2 0 0 0 2-1.6L21 8.5H6.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20" r="1.4" fill="currentColor" />
      <circle cx="17" cy="20" r="1.4" fill="currentColor" />
    </svg>
  );
}

/**
 * ProductSlider — one product per slide (image + name + description),
 * scroll-snap with dots. Used for the masks / collagen / Hydramax blocks,
 * where the ТЗ asks for a separate slide per product.
 */
export function ProductSlider({ slides }: { slides: ProductSlide[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  const go = (i: number) => {
    const el = trackRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  const peek = Boolean(slides[0]?.meta);

  return (
    <div className={`${styles.root}${peek ? ` ${styles.peek}` : ""}`}>
      <ul className={styles.track} ref={trackRef} onScroll={onScroll}>
        {slides.map((s) => (
          <li className={styles.slide} key={s.id}>
            <div
              className={`${styles.media}${s.meta ? ` ${styles.mediaCover}` : ""}`}
            >
              {s.meta ? (
                <ImageSlider
                  images={s.images?.length ? s.images : [s.image]}
                  sizes="(max-width: 1023px) 71vw, 380px"
                  href={s.meta.href}
                />
              ) : (
                <Image
                  src={s.image.src}
                  alt={s.image.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 420px"
                  style={
                    s.image.position || s.image.fit
                      ? {
                          objectPosition: s.image.position,
                          objectFit: s.image.fit,
                        }
                      : undefined
                  }
                />
              )}
              {s.meta && (
                <Link
                  href={s.meta.href}
                  className={styles.cartBtn}
                  aria-label={`${s.title} — подробнее`}
                >
                  <CartIcon />
                </Link>
              )}
              {s.badge && (
                <span className={styles.sticker}>
                  <span className={styles.stickerCount}>{s.badge.count}</span>
                  <span className={styles.stickerUnit}>{s.badge.unit}</span>
                </span>
              )}
            </div>
            <div className={styles.slideBody}>
              {s.meta ? (
                <div className={styles.metaRow}>
                  <div className={styles.metaText}>
                    <Link href={s.meta.href} className={styles.productName}>
                      {s.title}
                    </Link>
                    <span className={styles.priceRow}>
                      <span className={styles.price}>{s.meta.price}</span>
                      {s.meta.priceWas && (
                        <span className={styles.priceWas}>
                          {s.meta.priceWas}
                        </span>
                      )}
                      {s.meta.discount && (
                        <span className={styles.discount}>
                          {s.meta.discount}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <h3 className={styles.name}>{s.title}</h3>
              )}
              <p className={styles.lead}>{s.lead}</p>
              {s.bullets && (
                <ul className={styles.bullets}>
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
              {s.extra && <p className={styles.lead}>{s.extra}</p>}
            </div>
          </li>
        ))}
      </ul>

      {slides.length > 1 && !peek && (
        <div className={styles.dots} role="tablist" aria-label="Слайды">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={s.title}
              className={`${styles.dot}${i === active ? ` ${styles.dotOn}` : ""}`}
              onClick={() => go(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
