import Image from "next/image";
import { Accent, Container, Section } from "@/components/ui";
import { productHref, shortCategory, type SeriesView } from "@/lib/products";
import { Carousel } from "./Carousel";
import { ProductCard } from "./ProductCard";
import styles from "./SeriesShowcase.module.css";

export type SeriesShowcaseProps = {
  series: SeriesView;
};

/**
 * SeriesShowcase — a standalone homepage block for a product series:
 * a large image, a heading (sans lead + Newton-italic accent), a short
 * blurb and a carousel of the series' products. Driven by
 * content/series/*.json (editable in the CMS).
 */
export function SeriesShowcase({ series }: SeriesShowcaseProps) {
  const { titleLead, titleAccent, blurb, image, products } = series;
  if (products.length === 0) return null;

  return (
    <Section tone="primary">
      <div className={styles.inner}>
        <Container>
          <div className={styles.media}>
            {image ? (
              <Image
                src={image}
                alt={titleLead}
                fill
                sizes="(max-width: 480px) 100vw, 480px"
              />
            ) : (
              <span className={styles.placeholder} aria-hidden="true" />
            )}
          </div>

          <h2 className={styles.title}>
            {titleLead}
            <br />
            <Accent>{titleAccent}</Accent>
          </h2>

          {blurb && <p className={styles.blurb}>{blurb}</p>}
        </Container>

        <Carousel label={`${titleAccent} products`}>
          {products.map((p) => (
            <ProductCard
              key={p.slug}
              title={p.headline}
              category={shortCategory(p.category)}
              price={p.prices[0].price}
              priceWas={p.prices[1].price}
              href={productHref(p.slug)}
              cartHref={p.prices[1].cta.href}
              images={p.carouselImages.map((src) => ({ src, alt: p.name }))}
            />
          ))}
        </Carousel>
      </div>
    </Section>
  );
}
