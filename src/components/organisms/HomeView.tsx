"use client";

import { Accent } from "@/components/ui";
import { CartBar } from "@/components/cart/CartBar";
import { HOME_CONTENT, type EditorialItem, type ReelsContent } from "@/content/home";
import { PhaseProvider, usePhase } from "@/lib/phase";
import type {
  DomainContent,
  PhaseProductCard,
  PhaseView,
  Product,
  SeriesView,
} from "@/lib/products";
import { CommunityReels } from "./CommunityReels";
import { Editorial } from "./Editorial";
import { HeroCarousel } from "./HeroCarousel";
import { PhasesSection } from "./PhasesSection";
import { SeriesShowcase } from "./SeriesShowcase";
import { SiteHeader } from "./SiteHeader";
import styles from "./HomeView.module.css";

export type HomeViewProps = {
  phases: PhaseView[];
  domains: DomainContent[];
  /** Resolved product cards per personalization domain. */
  domainCards: Record<string, PhaseProductCard[]>;
  /** Product spotlighted under the Personalization carousel. */
  featureProduct: Product | null;
  /** Every series id referenced by any phase, pre-resolved on the server. */
  seriesById: Record<string, SeriesView | null>;
};

const titleNode = (t: { lead: string; accent: string }) => (
  <>
    {t.lead}
    <br />
    <Accent>{t.accent}</Accent>
  </>
);

const paras = (body: string[]) => (
  <>
    {body.map((p, i) => (
      <p key={i}>{p}</p>
    ))}
  </>
);

const badgeNode = (b: EditorialItem["badge"]) =>
  b ? (
    <>
      <span aria-hidden="true">{b.flag}</span> {b.text}
    </>
  ) : undefined;

function Reels({ content }: { content: ReelsContent }) {
  return (
    <CommunityReels
      title={content.title}
      body={content.body}
      reels={content.reels}
    />
  );
}

function HomeContent({
  phases,
  domains,
  domainCards,
  featureProduct,
  seriesById,
}: HomeViewProps) {
  const { phase, setPhase } = usePhase();
  const c = HOME_CONTENT[phase];
  const phaseIds = phases.map((p) => p.id);

  return (
    <main>
      <SiteHeader cart={false} />

      <HeroCarousel
        activeIndex={phaseIds.indexOf(phase)}
        onSelect={(i) => {
          const id = phaseIds[i];
          if (id) setPhase(id);
        }}
        slides={phaseIds.map((id) => {
          const hero = HOME_CONTENT[id].hero;
          return {
            title: titleNode(hero.title),
            body: paras(hero.body),
            image: hero.image,
            cta: hero.cta,
          };
        })}
      />

      {/* the switcher lives here — kept outside the swap so it stays mounted */}
      <div id="phases">
        <PhasesSection
          phases={phases}
          domains={domains}
          domainCards={domainCards}
          featureProduct={featureProduct}
        />
      </div>

      <div key={`tail-${phase}`} className={styles.swap}>
        {c.sections.map((s, i) => {
          if (s.kind === "series") {
            const series = seriesById[s.id];
            return series ? (
              <SeriesShowcase key={`series-${s.id}`} series={series} />
            ) : null;
          }
          return (
            <Editorial
              key={`editorial-${i}`}
              title={s.title}
              image={s.image}
              badge={badgeNode(s.badge)}
              body={paras(s.body)}
            />
          );
        })}

        <Reels content={c.reels} />
      </div>

      <CartBar />
    </main>
  );
}

/**
 * HomeView — the whole homepage, driven by the active phase. Switching a
 * phase in <PhasesSection> re-themes the hero and every section below it
 * from HOME_CONTENT[phase]. Phase state is in-memory (see PhaseProvider).
 */
export function HomeView(props: HomeViewProps) {
  return (
    <PhaseProvider>
      <HomeContent {...props} />
    </PhaseProvider>
  );
}
