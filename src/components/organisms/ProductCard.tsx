import type { ReactNode } from "react";
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
  /** Big two-line title. */
  title: ReactNode;
  /** Tan category pill above the title. */
  category?: string;
  /** Current / sale price. */
  price: ReactNode;
  /** Struck-through "was" price shown next to it. */
  priceWas?: ReactNode;
  /** Product page the whole card links to. */
  href: string;
  image?: ProductImage;
  /** Where the cart button links (add-to-bag redirect). */
  cartHref?: string;
  /** Decorative image-pager dots. Default 4; 0 hides them. */
  dots?: number;
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
 * ProductCard — packshot tile on a soft-blue card, a floating cart button,
 * image-pager dots, a category pill, a two-line title and a sale price.
 * The whole card links to the product page (stretched link on the title);
 * the cart button is an independent add-to-bag link.
 */
export function ProductCard({
  title,
  category,
  price,
  priceWas,
  href,
  image,
  cartHref = "#add-to-bag",
  dots = 4,
}: ProductCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.media}>
        <span className={styles.mediaInner}>
          {image ? (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 767px) 220px, (max-width: 1023px) 260px, 340px"
              style={image.position ? { objectPosition: image.position } : undefined}
            />
          ) : (
            <span className={styles.mediaEmpty} aria-hidden="true" />
          )}
        </span>

        <Link href={cartHref} className={styles.cart} aria-label="Add to bag">
          <CartIcon />
        </Link>
      </div>

      {dots > 0 && (
        <span className={styles.dots} aria-hidden="true">
          {Array.from({ length: dots }).map((_, i) => (
            <span key={i} className={`${styles.dot} ${i === 0 ? styles.dotOn : ""}`} />
          ))}
        </span>
      )}

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
    </article>
  );
}
