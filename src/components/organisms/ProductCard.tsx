import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui";
import styles from "./ProductCard.module.css";

export type ProductImage = {
  src: string;
  alt: string;
  /** object-position for framing the packshot. */
  position?: string;
};

export type ProductCardProps = {
  title: ReactNode;
  price: ReactNode;
  /** Product page the whole card links to. */
  href: string;
  image?: ProductImage;
  /** Optional secondary action (e.g. "Shop"). Defaults to linking `href`. */
  cta?: { label: string; href?: string };
  /** Small uppercase tag, e.g. "Bestseller". */
  badge?: string;
};

/**
 * ProductCard — packshot tile, title, price. The whole card is a link to the
 * product page (stretched link on the title); an optional CTA sits above it.
 * Sits on the base corner radius; the tile is concentric inside it.
 */
export function ProductCard({
  title,
  price,
  href,
  image,
  cta,
  badge,
}: ProductCardProps) {
  return (
    <article className={styles.card}>
      {badge && <span className={styles.badge}>{badge}</span>}

      <h3 className={styles.title}>
        <Link href={href} className={styles.titleLink}>
          {title}
        </Link>
      </h3>

      <div className={styles.media}>
        <span className={styles.mediaInner}>
          {image ? (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 767px) 148px, (max-width: 1023px) 220px, 248px"
              style={
                image.position ? { objectPosition: image.position } : undefined
              }
            />
          ) : (
            <span className={styles.mediaEmpty} aria-hidden="true" />
          )}
        </span>
      </div>

      <p className={styles.price}>{price}</p>

      {cta && (
        <Button
          variant="primary"
          block
          href={cta.href ?? href}
          className={styles.cta}
        >
          {cta.label}
        </Button>
      )}
    </article>
  );
}
