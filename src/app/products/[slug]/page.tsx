import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  BodyLong,
  Container,
  Heading,
  Rating,
  Section,
  Stack,
} from "@/components/ui";
import { BuyBox, InfoAccordion, SiteHeader } from "@/components/organisms";
import { PRODUCTS, getProduct } from "@/lib/products";
import { ManufacturingDetails } from "./ManufacturingDetails";
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

  return (
    <main className={styles.page}>
      <SiteHeader />

      <Section tone="surface">
        <Container>
          <div className={styles.layout}>
            <div className={styles.media}>
              <div className={styles.mediaInner}>
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    priority
                    sizes="(max-width: 1023px) 100vw, 560px"
                    style={
                      product.imagePosition
                        ? { objectPosition: product.imagePosition }
                        : undefined
                    }
                  />
                ) : (
                  <span className={styles.mediaEmpty} aria-hidden="true" />
                )}
              </div>
            </div>

            <Stack gap="base">
              <div className={styles.headGroup}>
                <Heading className={styles.name}>{product.name}</Heading>
                <Rating
                  value={product.rating}
                  ratingsCount={product.ratingsCount}
                  reviewsCount={product.reviewsCount}
                />
                <BodyLong>{product.description}</BodyLong>
                <p className={styles.disclaimer}>
                  This statement has not been evaluated by the Food and Drug
                  Administration. This product is not intended to diagnose,
                  treat, cure, or prevent any disease.
                </p>
              </div>

              <BuyBox options={product.prices} />

              <InfoAccordion
                items={[
                  {
                    title: "How to Use",
                    content: <p>Details coming soon.</p>,
                  },
                  {
                    title: "Manufacturing details",
                    content: <ManufacturingDetails />,
                  },
                ]}
              />
            </Stack>
          </div>
        </Container>
      </Section>
    </main>
  );
}
