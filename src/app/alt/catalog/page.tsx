import type { Metadata } from "next";
import { Container, Heading, Section } from "@/components/ui";
import { SiteFooter, SiteHeader, TabBar } from "@/components/organisms";
import { GoalNav } from "@/components/alt/GoalNav";
import { AltCatalogGrid } from "@/components/alt/AltCatalogGrid";
import { getDomainCards, getDomains } from "@/lib/products";

export const metadata: Metadata = {
  title: "Catalog — Coral Club (alt)",
  description: "Browse by goal — an alternative catalog layout.",
};

/**
 * /alt/catalog — the market's "navigate by goal" pattern: a sticky pill row
 * instead of an icon bento grid, and the quiz surfaced as a 2×2 tile inside
 * the first goal's product grid instead of a separate promo block.
 */
export default function AltCatalogPage() {
  const domains = getDomains();
  const domainCards = getDomainCards();
  const withCards = domains.filter((d) => (domainCards[d.id] ?? []).length > 0);
  const firstWithCards = withCards[0]?.id;

  return (
    <main>
      <SiteHeader />

      <Section tone="surface">
        <Container>
          <Heading>Shop by goal</Heading>
        </Container>
      </Section>

      <GoalNav domains={withCards} />

      {withCards.map((d, i) => {
        const cards = domainCards[d.id] ?? [];
        return (
          <Section
            key={d.id}
            id={d.id}
            tone={i % 2 === 0 ? "surface" : "default"}
            style={{ scrollMarginTop: 112 }}
          >
            <Container>
              <Heading as="h2">{d.label}</Heading>
              <div style={{ marginTop: 16 }}>
                <AltCatalogGrid cards={cards} withQuiz={d.id === firstWithCards} />
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
