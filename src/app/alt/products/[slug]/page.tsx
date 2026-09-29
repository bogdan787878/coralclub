import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BodyLong, Container, Heading, Section, Stack } from "@/components/ui";
import {
  FullDescription,
  IncludedProducts,
  InfoAccordion,
  ProductCard,
  SiteHeader,
  TabBar,
  TopSellerBadge,
} from "@/components/organisms";
import { AltGallery } from "@/components/alt/AltGallery";
import { SubscribeBuyBox } from "@/components/alt/SubscribeBuyBox";
import { KeyElementsVisual } from "@/components/alt/KeyElementsVisual";
import { LargeDietaryBadges } from "@/components/alt/LargeDietaryBadges";
import { ReviewsOrStories } from "@/components/alt/ReviewsOrStories";
import {
  PRODUCTS,
  getProduct,
  productHref,
  relatedProducts,
  resolveIncludedProducts,
  shortCategory,
} from "@/lib/products";
import { allOrigins } from "@/lib/countryFlags";
import { asset } from "@/lib/asset";
import { BackButton } from "@/app/(shop)/products/[slug]/BackButton";
import { ShareButton } from "@/app/(shop)/products/[slug]/ShareButton";
import { ManufacturingDetails } from "@/app/(shop)/products/[slug]/ManufacturingDetails";
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
    title: `${product.name} — Coral Club (alt)`,
    description: product.description,
  };
}

const STORIES = [1, 2, 3, 4].map((n) => ({
  src: asset(`/reels/reel${n}.mp4`),
  alt: "Coral Club member sharing their experience",
}));

/**
 * /alt/products/[slug] — the "catch up with the market" PDP: gallery
 * absorbs the body-copy info blocks and a composition slide, subscription
 * is the default buy path with its benefits spelled out, Key Elements gets
 * picture-like tiles, dietary labels are large pills, and reviews fall
 * back to community stories while there are none yet.
 */
export default async function AltProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const related = relatedProducts(slug);
  const moreLabel = related?.label;
  const moreProducts = related?.products ?? [];
  const includedProducts = resolveIncludedProducts(product.includedProducts);
  const origins = allOrigins(product.manufacturing.countryOfOrigin);

  const infoBlocks = (product.fullDescription ?? "")
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((body, i) => ({
      kicker: i === 0 ? "About this product" : "Good to know",
      title: i === 0 ? product.name : shortCategory(product.category),
      body,
    }));

  return (
    <main className={styles.page}>
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
                <AltGallery
                  images={product.pdpImages.map((src) => ({ src, alt: product.name }))}
                  infoBlocks={infoBlocks}
                  supplementFacts={product.manufacturing.supplementFacts}
                  sizes="(max-width: 1023px) 100vw, 400px"
                />
              </div>
              <ShareButton
                className={`${styles.circleBtn} ${styles.mediaShare}`}
                title={product.name}
              />
            </div>

            <Stack gap="base" className={styles.infoCol}>
              <div className={styles.headGroup}>
                <span className={styles.category}>{shortCategory(product.category)}</span>
                <Heading className={styles.name}>{product.name}</Heading>
                {product.description.split("\n\n").map((paragraph, i) => (
                  <BodyLong key={i}>{paragraph}</BodyLong>
                ))}
                {origins.length > 0 && (
                  <div className={styles.originTags}>
                    {origins.map((o) => (
                      <span className={styles.originTag} key={o.label}>
                        {o.flag && <span aria-hidden="true">{o.flag} </span>}
                        {o.label}
                      </span>
                    ))}
                  </div>
                )}
                {product.topSeller && <TopSellerBadge />}
                {product.dietaryBadges.length > 0 && (
                  <LargeDietaryBadges items={product.dietaryBadges} />
                )}
                {product.elements.length > 0 && <KeyElementsVisual items={product.elements} />}
                <ReviewsOrStories
                  rating={product.rating}
                  reviewsCount={product.reviewsCount}
                  stories={STORIES}
                />
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
                    content: <ManufacturingDetails data={product.manufacturing} />,
                  },
                ]}
              />

              {product.fullDescription && <FullDescription text={product.fullDescription} />}
            </Stack>

            <SubscribeBuyBox
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

      {moreProducts.length > 0 && (
        <Section tone="surface">
          <Container>
            <Heading as="h2" className={styles.moreTitle}>
              More in {moreLabel}
            </Heading>
            <div className={styles.moreGrid}>
              {moreProducts.map((p) => (
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

      <TabBar />
    </main>
  );
}
