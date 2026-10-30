import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BodyLong, Container, Heading, Section, Stack } from "@/components/ui";
import {
  BuyBox,
  FullDescription,
  InfoAccordion,
  PeriodicElements,
} from "@/components/organisms";
import { LandingGallery } from "@/components/landing/LandingGallery";
import { TrackViewItem } from "@/components/landing/TrackViewItem";
import { FriendCards } from "@/components/friend/FriendCards";
import { FriendMemberBlock } from "@/components/friend/FriendMemberBlock";
import {
  FRIEND_PRODUCTS,
  formatMoney,
  friendPdpHref,
  friendProduct,
} from "@/lib/friendCatalog";
import {
  ManufacturingDetails,
  SupplementFacts,
  hasSupplementFacts,
} from "../../../(shop)/products/[slug]/ManufacturingDetails";
import { BackButton } from "../../../(shop)/products/[slug]/BackButton";
import { ShareButton } from "../../../(shop)/products/[slug]/ShareButton";
// the page chrome is the shop PDP's own, the wide frame is the landing's
import shop from "../../../(shop)/products/[slug]/page.module.css";
import styles from "../../../landing/product/[slug]/page.module.css";
import controls from "./controls.module.css";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return FRIEND_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = friendProduct(slug);
  if (!p) return {};
  return {
    title: `${p.name} — Coral Club`,
    description: p.lead,
    robots: { index: false, follow: false },
  };
}

export default async function FriendProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const p = friendProduct(slug);
  if (!p) notFound();

  const others = FRIEND_PRODUCTS.filter((x) => x.slug !== slug);
  const href = friendPdpHref(slug);
  const facts = p.manufacturing.supplementFacts;
  const hasFacts = hasSupplementFacts(facts);
  const title = p.form ? `${p.name} – ${p.form}` : p.name;

  const buyProps = {
    product: {
      coralId: p.coralId,
      slug,
      name: title,
      image: p.images[0]?.src,
    },
    options: [
      {
        id: "club",
        label: "Member price",
        note: "−20%",
        price: formatMoney(p.club),
        cta: { label: "Add to cart", href },
      },
      {
        id: "regular",
        label: "Regular price",
        price: formatMoney(p.regular),
        cta: { label: "Add to cart", href },
      },
    ],
    labels: {
      add: "Add to cart",
      inCart: "In cart",
      openCart: "Open cart",
    },
  };

  return (
    <div className="appShell">
      <main className={shop.page} data-analytics-location="product_card">
        <TrackViewItem coralId={p.coralId} />

        <div className={`${shop.imageControls} ${controls.controls}`}>
          <BackButton className={shop.circleBtn} fallbackHref="/friend/" />
          <ShareButton className={shop.circleBtn} title={p.name} />
        </div>

        <Section tone="surface">
          <div className={styles.wide}>
            <div className={`${shop.layout} ${styles.layout}`}>
              <LandingGallery images={p.images} title={p.name} fit="contain" />

              <Stack gap="base" className={shop.infoCol}>
                <div className={shop.headGroup}>
                  <Heading className={`${shop.name} ${styles.pdpTitle}`}>
                    {title}
                  </Heading>

                  <div id="pdp-buy">
                    <BuyBox pinned {...buyProps} />
                  </div>

                  <BodyLong>{p.lead}</BodyLong>

                  {p.elements.length > 0 && (
                    <PeriodicElements items={p.elements} />
                  )}
                </div>

                <InfoAccordion
                  items={[
                    {
                      title: "How to Use",
                      content: (
                        <p style={{ whiteSpace: "pre-line" }}>
                          {p.howToUse || "Details coming soon."}
                        </p>
                      ),
                    },
                    {
                      title: "Manufacturing details",
                      content: <ManufacturingDetails data={p.manufacturing} />,
                    },
                    ...(hasFacts
                      ? [
                          {
                            title: "Supplement Facts",
                            content: <SupplementFacts data={facts} />,
                          },
                        ]
                      : []),
                  ]}
                />

                {p.fullDescription && (
                  <FullDescription text={p.fullDescription} />
                )}

                <p className={shop.disclaimer}>
                  Food supplements are not a substitute for a varied and
                  balanced diet and a healthy lifestyle. Do not exceed the
                  recommended daily intake. Keep out of the reach of young
                  children.
                </p>
              </Stack>
            </div>
          </div>
        </Section>

        <Section tone="default" className={styles.more}>
          <Container>
            <Heading as="h2" className={shop.moreTitle}>
              More from Hydration
            </Heading>
          </Container>
          <FriendCards
            products={others}
            listId="pdp_similar"
            listName="More from Hydration"
            label="More from Hydration"
          />
        </Section>

        <Section tone="default">
          <Container>
            <FriendMemberBlock />
          </Container>
        </Section>
      </main>
    </div>
  );
}
