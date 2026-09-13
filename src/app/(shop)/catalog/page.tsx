import type { Metadata } from "next";
import Image from "next/image";
import { Container, Heading, Section } from "@/components/ui";
import { ProductCard, SiteFooter, SiteHeader, TabBar } from "@/components/organisms";
import { asset } from "@/lib/asset";
import { getDomainCards, getDomains, productHref } from "@/lib/products";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Catalog — Coral Club",
  description: "Browse the full Coral Club catalogue by health concern.",
};

/**
 * Catalog — a bento grid of the same 12 health-concern domains used by the
 * homepage's Personalization phase (same icons, same content/domains.json),
 * each tile jumping to that domain's own product section below.
 */
export default function CatalogPage() {
  const domains = getDomains();
  const domainCards = getDomainCards();

  return (
    <main className={styles.page}>
      <SiteHeader />

      <Section tone="surface">
        <Container>
          <div className={styles.grid}>
            {domains.map((d) => (
              <a key={d.id} href={`#${d.id}`} className={styles.tile}>
                <span className={styles.tileIcon}>
                  <Image
                    src={`${asset(`/images/domains/${d.id}.png`)}?v=3`}
                    alt=""
                    width={88}
                    height={88}
                  />
                </span>
                <span className={styles.tileLabel}>{d.label}</span>
              </a>
            ))}
          </div>
        </Container>
      </Section>

      {domains.map((d, i) => {
        const cards = domainCards[d.id] ?? [];
        if (cards.length === 0) return null;
        return (
          <Section
            key={d.id}
            id={d.id}
            tone={i % 2 === 0 ? "surface" : "default"}
            style={{ scrollMarginTop: 88 }}
          >
            <Container>
              <Heading as="h2" className={styles.sectionTitle}>
                {d.label}
              </Heading>
              <div className={styles.productGrid}>
                {cards.map((p) => (
                  <ProductCard
                    key={p.slug}
                    fluid
                    title={p.headline}
                    category={p.category}
                    price={p.price}
                    priceWas={p.priceWas}
                    href={productHref(p.slug)}
                    cartHref={p.cartHref}
                    images={p.images}
                  />
                ))}
              </div>
            </Container>
          </Section>
        );
      })}

      <SiteFooter />

      <TabBar />
    </main>
  );
}
