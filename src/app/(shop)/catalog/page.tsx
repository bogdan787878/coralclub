import type { Metadata } from "next";
import { Chip, Chips, Container, Heading, Section } from "@/components/ui";
import { DomainProductGrid, SiteFooter, SiteHeader, TabBar } from "@/components/organisms";
import { DOMAIN_ICONS } from "@/components/organisms/domainIcons";
import { getDomainCards, getDomains } from "@/lib/products";
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
            {domains.map((d) => {
              const Icon = DOMAIN_ICONS[d.id];
              return (
                <a key={d.id} href={`#${d.id}`} className={styles.tile}>
                  <span className={styles.tileIcon}>
                    {Icon ? <Icon className={styles.icon} /> : null}
                  </span>
                  <span className={styles.tileLabel}>{d.label}</span>
                </a>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Sticky category nav — the bento grid above scrolls out of view
          quickly, so once it does this compact chip row takes over as the
          way back to any category, staying pinned just under the header
          (top matches SiteHeader's own 56px rendered height) for the rest
          of the page. */}
      <div className={styles.stickyNav}>
        <Chips className={styles.stickyNavRow} aria-label="Jump to category">
          {domains.map((d) => (
            <Chip key={d.id} href={`#${d.id}`}>
              {d.label}
            </Chip>
          ))}
        </Chips>
      </div>

      {domains.map((d, i) => {
        const cards = domainCards[d.id] ?? [];
        if (cards.length === 0) return null;
        return (
          <Section
            key={d.id}
            id={d.id}
            tone={i % 2 === 0 ? "surface" : "default"}
            // clears both sticky bars above (header 56px + chip nav
            // 63px) plus a little breathing room, so a chip jump doesn't
            // land the heading right under them
            style={{ scrollMarginTop: 135 }}
          >
            <Container>
              <Heading as="h2" className={styles.sectionTitle}>
                {d.label}
              </Heading>
              <DomainProductGrid cards={cards} />
            </Container>
          </Section>
        );
      })}

      <SiteFooter />

      <TabBar />
    </main>
  );
}
