import { Fragment } from "react";
import Image from "next/image";
import { Accent, Container, Section } from "@/components/ui";
import { productHref, shortCategory, type SeriesView } from "@/lib/products";
import { Carousel } from "./Carousel";
import { ProductCard } from "./ProductCard";
import styles from "./SeriesShowcase.module.css";

export type SeriesShowcaseProps = {
  series: SeriesView;
  /** Background tone. Defaults to "surface" to match the rest of the page. */
  tone?: "default" | "surface";
};

/**
 * SeriesShowcase — a standalone homepage block for a product series:
 * a large image, a heading (sans lead + Newton-italic accent), a short
 * blurb and a carousel of the series' products. Driven by
 * content/series/*.json (editable in the CMS).
 */
export function SeriesShowcase({ series, tone = "surface" }: SeriesShowcaseProps) {
  const { titleLead, titleAccent, blurb, features, image, products } = series;
  if (products.length === 0) return null;

  return (
    <Section tone={tone}>
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

            {features.length > 0 && (
              <ul className={styles.features}>
                {features.map((f, i) => {
                  const [first, ...rest] = f.text.split(" ");
                  return (
                    <Fragment key={i}>
                      {i > 0 && (
                        <li className={styles.divider} aria-hidden="true" />
                      )}
                      <li className={styles.feature}>
                        {f.icon && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            className={styles.featureIcon}
                            src={`${f.icon}?v=3`}
                            alt=""
                            width={24}
                          />
                        )}
                        <span className={styles.featureText}>
                          {first}
                          {rest.length > 0 && (
                            <>
                              <br />
                              {rest.join(" ")}
                            </>
                          )}
                        </span>
                      </li>
                    </Fragment>
                  );
                })}
              </ul>
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
