"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./ProductCard.module.css";

export type ProductImage = {
  src: string;
  alt: string;
  /** object-position for framing the packshot. */
  position?: string;
};

export type ProductCardProps = {
  /** Two-line product name. */
  title: ReactNode;
  /** Tan category pill above the name. */
  category?: string;
  /** Current / sale price. */
  price: ReactNode;
  /** Struck-through "was" price shown next to it. */
  priceWas?: ReactNode;
  /** Product page the name links to. */
  href: string;
  /** Packshots — one per slide of the card's own nested carousel. */
  images?: ProductImage[];
  /** Where the cart button links (add-to-bag redirect). */
  cartHref?: string;
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
 * ProductCard — a packshot tile (the only filled surface; the section
 * behind is the "card") with its own nested image carousel + dots and a
 * floating cart button; below it, on no background, the category pill, the
 * name and the sale price. The text block links to the product page.
 */
export function ProductCard({
  title,
  category,
  price,
  priceWas,
  href,
  images = [],
  cartHref = "#add-to-bag",
}: ProductCardProps) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  const multi = images.length > 1;

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        <div className={styles.track} ref={trackRef} onScroll={multi ? onScroll : undefined}>
          {images.length ? (
            images.map((img, i) => (
              <span className={styles.slide} key={i}>
                <span className={styles.frame}>
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="150px"
                    style={img.position ? { objectPosition: img.position } : undefined}
                  />
                </span>
              </span>
            ))
          ) : (
            <span className={`${styles.slide} ${styles.slideEmpty}`} aria-hidden="true" />
          )}
        </div>

        {multi && (
          <span className={styles.dots} aria-hidden="true">
            {images.map((_, i) => (
              <span key={i} className={`${styles.dot} ${i === active ? styles.dotOn : ""}`} />
            ))}
          </span>
        )}

        {!multi && (
          <Link href={href} className={styles.mediaLink} aria-hidden="true" tabIndex={-1} />
        )}

        {/^https?:/.test(cartHref) ? (
          <a
            href={cartHref}
            className={styles.cart}
            aria-label="Add to bag"
            target="_blank"
            rel="noopener noreferrer"
          >
            <CartIcon />
          </a>
        ) : (
          <Link href={cartHref} className={styles.cart} aria-label="Add to bag">
            <CartIcon />
          </Link>
        )}
      </div>

      <div className={styles.info}>
        {category && <span className={styles.category}>{category}</span>}

        <h3 className={styles.title}>
          <Link href={href} className={styles.titleLink}>
            {title}
          </Link>
        </h3>

        <p className={styles.price}>
          <span className={styles.priceNow}>{price}</span>
          {priceWas && <span className={styles.priceWas}>{priceWas}</span>}
        </p>
      </div>
    </article>
  );
}
