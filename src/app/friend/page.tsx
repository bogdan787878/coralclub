import type { Metadata } from "next";
import { Accent, Container, Heading, Section } from "@/components/ui";
import { CommunityReels, Editorial, Hero } from "@/components/organisms";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { FriendAdvisors } from "@/components/friend/FriendAdvisors";
import { FriendBanner } from "@/components/friend/FriendProvider";
import { FriendCards } from "@/components/friend/FriendCards";
import { FriendCartButton } from "@/components/friend/FriendCart";
import { FriendRegisterCta } from "@/components/friend/FriendRegisterCta";
import { HOME_CONTENT, type EditorialItem } from "@/content/home";
import { asset } from "@/lib/asset";
import { FRIEND_SETS, FRIEND_SINGLES } from "@/lib/friendCatalog";
import styles from "@/components/friend/Friend.module.css";

export const metadata: Metadata = {
  title: "Hydration at member prices — Coral Club",
  robots: { index: false, follow: false },
};

/**
 * The original (English) hydration home page, minus the phases and the quiz:
 * the same hero, editorial blocks, advisory board and community clips — and
 * only the Hydration products, at member prices.
 */
export default function FriendHome() {
  const hydration = HOME_CONTENT.hydration;
  const [water, minerals] = hydration.sections.filter(
    (x): x is EditorialItem => x.kind === "editorial",
  );
  const { hero, reels } = hydration;

  return (
    <div className="appShell">
      <main className={styles.page} data-analytics-location="home">
        <LandingHeader homeHref={asset("/friend/")} />
        <FriendBanner />

        <Hero
          title={
            <>
              {hero.title.lead}
              <br />
              <Accent>{hero.title.accent}</Accent>
            </>
          }
          body={
            <>
              {hero.body.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </>
          }
          image={hero.image}
          cta={{ label: "Choose my set", href: "#hydration" }}
        />

        <Section
          id="hydration"
          tone="default"
          className={styles.section}
          data-analytics-section="sets"
        >
          <Container>
            <Heading as="h2" className={styles.h2}>
              Water alone doesn’t hydrate. <Accent>Minerals do.</Accent>
            </Heading>
            <p className={styles.lead}>
              Plain water passes through you quickly — minerals and electrolytes
              are what help your body hold on to it.
            </p>
          </Container>
          <FriendCards
            products={FRIEND_SETS}
            listId="friend_sets"
            listName="Hydration sets"
            label="Hydration sets"
            minCols={2}
          />
        </Section>

        <Section
          tone="surface"
          className={styles.section}
          data-analytics-section="singles"
        >
          <Container>
            <Heading as="h2" className={styles.h2}>
              Or <Accent>one at a time</Accent>
            </Heading>
          </Container>
          <FriendCards
            products={FRIEND_SINGLES}
            listId="friend_singles"
            listName="Hydration, one by one"
            label="Hydration products"
            minCols={4}
          />
        </Section>

        {water && (
          <Editorial
            title={water.title}
            image={water.image}
            badge={water.badge?.text}
            body={
              <>
                {water.body.map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </>
            }
          />
        )}

        {minerals && (
          <Editorial
            title={minerals.title}
            image={minerals.image}
            badge={
              <>
                {minerals.badge?.flag && (
                  <span aria-hidden="true">{minerals.badge.flag} </span>
                )}
                {minerals.badge?.text}
              </>
            }
            body={
              <>
                {minerals.body.map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </>
            }
          />
        )}

        <FriendAdvisors />

        <CommunityReels
          title={reels.title}
          body={reels.body}
          reels={reels.reels}
        />

        <Section tone="default" className={styles.section}>
          <Container>
            <FriendRegisterCta where="home" />
          </Container>
        </Section>

        <footer className={styles.footer} data-analytics-location="footer">
          <Container>
            <p>
              These statements have not been evaluated by the Food and Drug
              Administration. These products are not intended to diagnose,
              treat, cure, or prevent any disease.
            </p>
          </Container>
        </footer>
        <FriendCartButton />
      </main>
    </div>
  );
}
