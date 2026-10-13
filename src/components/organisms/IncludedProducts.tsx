import Image from "next/image";
import Link from "next/link";
import { productHref } from "@/lib/catalog";
import type { IncludedProductCard } from "@/lib/products";
import styles from "./IncludedProducts.module.css";

export type IncludedProductsProps = {
  items: IncludedProductCard[];
  /** Small heading above the strip. */
  heading?: string;
  /** Render the tiles as plain (non-link) cards — for products that have no
   *  page of their own on this storefront. Default true. */
  linked?: boolean;
  /** Make each tile a button that reports its slug (e.g. to open a details
   *  sheet) instead of a link. Takes precedence over `linked`. */
  onSelect?: (slug: string) => void;
};

/**
 * IncludedProducts — for a set/bundle, a plain horizontal strip of the
 * individual products it's made of: packshot + name, no price, no cart,
 * no dots. Each card links to that product's own PDP. Sits on the PDP
 * right after Key Elements. Renders nothing when the product isn't a set.
 */
export function IncludedProducts({
  items,
  heading = "Included Products",
  linked = true,
  onSelect,
}: IncludedProductsProps) {
  if (!items.length) return null;

  return (
    <section className={styles.wrap}>
      <h3 className={styles.heading}>{heading}</h3>
      <div className={styles.track}>
        {items.map((item) => {
          const body = (
            <>
              <span className={styles.media}>
                {item.image && (
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    fill
                    sizes="120px"
                    style={{ objectFit: "contain" }}
                  />
                )}
              </span>
              <span className={styles.name}>{item.name}</span>
            </>
          );
          if (onSelect) {
            return (
              <button
                key={item.slug}
                type="button"
                className={`${styles.card} ${styles.button}`}
                onClick={() => onSelect(item.slug)}
              >
                {body}
              </button>
            );
          }
          return linked ? (
            <Link
              key={item.slug}
              href={productHref(item.slug)}
              className={styles.card}
            >
              {body}
            </Link>
          ) : (
            <div key={item.slug} className={styles.card}>
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}
