import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BodyLong, Container, Heading, Section, Stack } from "@/components/ui";
import {
  BuyBox,
  ImageSlider,
  DietaryBadges,
  IncludedProducts,
  InfoAccordion,
  PeriodicElements,
  ProductCard,
  SiteHeader,
  TopSellerBadge,
} from "@/components/organisms";
import { CartDrawerHost } from "@/components/cart/CartDrawerHost";
import {
  PRODUCTS,
  getProduct,
  productHref,
  relatedProducts,
  resolveIncludedProducts,
  shortCategory,
} from "@/lib/products";
import { BackButton } from "./BackButton";
import { ShareButton } from "./ShareButton";
import {
  ManufacturingDetails,
  SupplementFacts,
  hasSupplementFacts,
} from "./ManufacturingDetails";
import styles from "./page.module.css";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  return {
    title: `${product.name} — Coral Club`,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const related = relatedProducts(slug);
  const includedProducts = resolveIncludedProducts(product.includedProducts);

  return (
    <main className={styles.page}>
      {/* desktop only (see .desktopHeader) — on mobile/tablet the floating
          back + share controls below do this job instead */}
      <div className={styles.desktopHeader}>
        <SiteHeader />
      </div>

      <div className={styles.imageControls}>
        <BackButton className={styles.circleBtn} />
        <ShareButton className={styles.circleBtn} title={product.name} />
      </div>

      <Section tone="surface">
        <Container>
          <div className={styles.layout}>
            <div className={styles.media}>
              <div className={styles.mediaInner}>
                <ImageSlider
                  images={product.pdpImages.map((src) => ({
                    src,
                    alt: product.name,
                  }))}
                  sizes="(max-width: 1023px) 100vw, 400px"
                  priority
                />
              </div>
              {/* desktop only — replaces the floating .imageControls share
                  button, which is hidden at this breakpoint (no back button
                  here: the header above already gets you home) */}
              <ShareButton
                className={`${styles.circleBtn} ${styles.mediaShare}`}
                title={product.name}
              />
            </div>

            <Stack gap="base" className={styles.infoCol}>
              <div className={styles.headGroup}>
                <span className={styles.category}>
                  {shortCategory(product.category)}
                </span>
                <Heading className={styles.name}>{product.name}</Heading>
                {product.description.split("\n\n").map((paragraph, i) => (
                  <BodyLong key={i}>{paragraph}</BodyLong>
                ))}
                {product.topSeller && <TopSellerBadge />}
                {product.dietaryBadges.length > 0 && (
                  <DietaryBadges items={product.dietaryBadges} />
                )}
                {product.elements.length > 0 && (
                  <PeriodicElements items={product.elements} />
                )}
                <p className={styles.disclaimer}>
                  This statement has not been evaluated by the Food and Drug
                  Administration. This product is not intended to diagnose,
                  treat, cure, or prevent any disease.
                </p>
                <IncludedProducts items={includedProducts} />
              </div>

              <InfoAccordion
                items={[
                  {
                    title: "How to Use",
                    content: (
                      <p style={{ whiteSpace: "pre-line" }}>
                        {product.howToUse || "Details coming soon."}
                      </p>
                    ),
                  },
                  {
                    title: "Manufacturing details",
                    content: (
                      <ManufacturingDetails data={product.manufacturing} />
                    ),
                  },
                  ...(hasSupplementFacts(product.manufacturing.supplementFacts)
                    ? [
                        {
                          title: "Supplement Facts",
                          content: (
                            <SupplementFacts
                              data={product.manufacturing.supplementFacts}
                            />
                          ),
                        },
                      ]
                    : []),
                ]}
              />
            </Stack>

            {/* mobile/tablet: fixed bottom bar (see .bar); desktop: sticky
                3rd column beside the details (see page.module.css) */}
            <BuyBox
              options={product.prices}
              product={{
                coralId: product.coralId,
                slug: product.slug,
                name: product.name,
                image: product.image,
              }}
            />
          </div>
        </Container>
      </Section>

      {related.length > 0 && (
        <Section tone="surface">
          <Container>
            <Heading as="h2" className={styles.moreTitle}>
              More in {shortCategory(product.category)}
            </Heading>
            <div className={styles.moreGrid}>
              {related.map((p) => (
                <ProductCard
                  key={p.slug}
                  fluid
                  title={p.headline}
                  category={shortCategory(p.category)}
                  price={p.prices[0].price}
                  priceWas={p.prices[1].price}
                  href={productHref(p.slug)}
                  cartHref={p.prices[1].cta.href}
                  images={p.carouselImages.map((src) => ({ src, alt: p.name }))}
                />
              ))}
            </div>
          </Container>
        </Section>
      )}

      <CartDrawerHost />
    </main>
  );
}
