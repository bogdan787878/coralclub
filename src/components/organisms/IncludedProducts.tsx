import Image from "next/image";
import Link from "next/link";
import { productHref } from "@/lib/catalog";
import type { IncludedProductCard } from "@/lib/products";
import styles from "./IncludedProducts.module.css";

export type IncludedProductsProps = {
  items: IncludedProductCard[];
  /** Small heading above the strip. */
  heading?: string;
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
}: IncludedProductsProps) {
  if (!items.length) return null;

  return (
    <section className={styles.wrap}>
      <h3 className={styles.heading}>{heading}</h3>
      <div className={styles.track}>
        {items.map((item) => (
          <Link key={item.slug} href={productHref(item.slug)} className={styles.card}>
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
          </Link>
        ))}
      </div>
    </section>
  );
}
