import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BodyLong, Container, Heading, Section, Stack } from "@/components/ui";
import {
  DietaryBadges,
  FullDescription,
  InfoAccordion,
  PeriodicElements,
} from "@/components/organisms";
import { LandingGallery } from "@/components/landing/LandingGallery";
import { TrackViewItem } from "@/components/landing/TrackViewItem";
import { FriendCards } from "@/components/friend/FriendCards";
import { FriendMemberBlock } from "@/components/friend/FriendMemberBlock";
import { PdpDelivery } from "@/components/friend/PdpDelivery";
import { PdpFacts, hasPdpFacts } from "@/components/friend/PdpFacts";
import { PdpTabs, type PdpTab } from "@/components/friend/PdpTabs";
import {
  FRIEND_PRODUCTS,
  friendPdpHref,
  friendProduct,
} from "@/lib/friendCatalog";
import { ManufacturingDetails } from "../../../(shop)/products/[slug]/ManufacturingDetails";
import { BackButton } from "../../../(shop)/products/[slug]/BackButton";
import { ShareButton } from "../../../(shop)/products/[slug]/ShareButton";
// the page chrome is the shop PDP's own, the wide frame is the landing's
import shop from "../../../(shop)/products/[slug]/page.module.css";
import styles from "../../../landing/product/[slug]/page.module.css";
import { FriendBuyBox } from "@/components/friend/FriendBuyBox";
import controls from "./controls.module.css";
import grid from "./grid.module.css";
import tabsCss from "./tabs.module.css";

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
  const title = p.form ? `${p.name} – ${p.form}` : p.name;

  const howToUse = {
    title: "How to Use",
    content: (
      <p style={{ whiteSpace: "pre-line" }}>
        {p.howToUse || "Details coming soon."}
      </p>
    ),
  };
  const manufacturing = {
    title: "Manufacturing details",
    content: <ManufacturingDetails data={p.manufacturing} />,
  };
  // on the web the details are tabs under the picture
  const tabs: PdpTab[] = [
    ...(p.elements.length > 0
      ? [
          {
            id: "elements",
            label: "Key Elements",
            content: <PeriodicElements items={p.elements} heading="" />,
          },
        ]
      : []),
    ...(p.fullDescription
      ? [
          {
            id: "description",
            label: "Full Description",
            content: <FullDescription text={p.fullDescription} title="" />,
          },
        ]
      : []),
    {
      id: "usage",
      label: "How to Use",
      content: <p>{p.howToUse || "Details coming soon."}</p>,
    },
    ...(hasPdpFacts(slug)
      ? [
          {
            id: "facts",
            label: "Supplement Facts",
            content: <PdpFacts slug={slug} bare />,
          },
        ]
      : []),
  ];

  return (
    <div className={`appShell ${grid.column}`}>
      <main className={shop.page} data-analytics-location="product_card">
        <TrackViewItem coralId={p.coralId} />

        <div className={`${shop.imageControls} ${controls.controls}`}>
          <BackButton className={shop.circleBtn} fallbackHref="/friend/" />
          <ShareButton className={shop.circleBtn} title={p.name} />
        </div>

        <Section tone="surface">
          <div className={`${styles.wide} ${grid.wide}`}>
            <div className={`${shop.layout} ${styles.layout}`}>
              <div className={tabsCss.mediaCol}>
                <LandingGallery
                  images={p.images}
                  title={p.name}
                  fit="contain"
                />

                {tabs.length > 0 && (
                  <div className={tabsCss.webOnly}>
                    <PdpTabs tabs={tabs} />
                  </div>
                )}
              </div>

              <Stack gap="base" className={shop.infoCol}>
                <div className={shop.headGroup}>
                  <Heading className={`${shop.name} ${styles.pdpTitle}`}>
                    {title}
                  </Heading>

                  <BodyLong>{p.lead}</BodyLong>

                  {/* in a div of its own: the shop's «badge row sits further from the
                      text» rule (24px) is for a bare list, here title · text · tags
                      · price keep the same 16px */}
                  {p.dietaryBadges.length > 0 && (
                    <div>
                      <DietaryBadges items={p.dietaryBadges} />
                    </div>
                  )}

                  <div id="pdp-buy">
                    <FriendBuyBox
                      href={href}
                      product={{
                        coralId: p.coralId,
                        slug,
                        name: title,
                        image: p.images[0]?.src,
                      }}
                    />
                  </div>

                  {/* a phone keeps the key elements here; on the web they are a tab */}
                  {p.elements.length > 0 && (
                    <div className={`${tabsCss.mobileOnly} ${tabsCss.keyEls}`}>
                      <PeriodicElements items={p.elements} />
                    </div>
                  )}
                </div>

                <PdpDelivery />

                <div className={tabsCss.mobileOnly}>
                  <InfoAccordion items={[howToUse, manufacturing]} />
                </div>
                <div className={tabsCss.webOnly}>
                  <InfoAccordion items={[manufacturing]} />
                </div>

                <div className={tabsCss.mobileOnly}>
                  <PdpFacts slug={slug} />
                </div>

                {p.fullDescription && (
                  <div className={tabsCss.mobileOnly}>
                    <FullDescription text={p.fullDescription} />
                  </div>
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
