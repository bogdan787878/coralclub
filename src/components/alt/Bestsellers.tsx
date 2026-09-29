"use client";

import Image from "next/image";
import { Button, Container, Section } from "@/components/ui";
import { addItem, setQty, useCart } from "@/lib/cart";
import { productHref } from "@/lib/catalog";
import type { PhaseProductCard } from "@/lib/products";
import { ProductCard } from "@/components/organisms";
import styles from "./Bestsellers.module.css";

export type BestsellersSpotlight = {
  kicker: string;
  title: string;
  blurb: string;
  image: { src: string; alt: string };
  cta: { label: string; href: string };
};

export type BestsellersProps = {
  title: string;
  viewAllHref: string;
  products: PhaseProductCard[];
  spotlight: BestsellersSpotlight;
};

/**
 * Bestsellers — the homepage's proof-of-demand block: a grid of top sellers
 * (with review counts, matching the market pattern of a bestseller row) plus
 * one key pack spotlighted beside it, the way most benchmarked brands lead
 * with "what we're known for" right after the trust statement.
 */
export function Bestsellers({ title, viewAllHref, products, spotlight }: BestsellersProps) {
  const cart = useCart();
  const qtyOf = (coralId?: string) =>
    coralId ? (cart.find((l) => l.coralId === coralId)?.qty ?? 0) : 0;

  return (
    <Section tone="surface">
      <Container>
        <div className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          <a className={styles.viewAll} href={viewAllHref}>
            View all
          </a>
        </div>

        <div className={styles.layout}>
          <div className={styles.grid}>
            {products.map((p) => (
              <ProductCard
                key={p.slug}
                fluid
                title={p.headline}
                category={p.category}
                price={p.price}
                priceWas={p.priceWas}
                href={productHref(p.slug)}
                cartHref={p.cartHref}
                onAddToCart={
                  p.coralId
                    ? () =>
                        addItem({
                          coralId: p.coralId as string,
                          slug: p.slug,
                          name: p.name,
                          price: p.price,
                          image: p.images[0]?.src,
                        })
                    : undefined
                }
                cartQty={qtyOf(p.coralId)}
                onSetQty={p.coralId ? (n) => setQty(p.coralId as string, n) : undefined}
                images={p.images}
              />
            ))}
          </div>

          <div className={styles.spotlight}>
            <div className={styles.spotlightMedia}>
              <Image src={spotlight.image.src} alt={spotlight.image.alt} fill sizes="320px" />
            </div>
            <div className={styles.spotlightBody}>
              <span className={styles.spotlightKicker}>{spotlight.kicker}</span>
              <h3 className={styles.spotlightTitle}>{spotlight.title}</h3>
              <p className={styles.spotlightBlurb}>{spotlight.blurb}</p>
              <Button
                href={spotlight.cta.href}
                variant="secondary"
                className={styles.spotlightCta}
              >
                {spotlight.cta.label}
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
