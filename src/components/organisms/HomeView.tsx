"use client";

import { Accent } from "@/components/ui";
import {
  HOME_CONTENT,
  type EditorialItem,
  type ReelsContent,
  type SpotlightItem,
} from "@/content/home";
import { productHref } from "@/lib/catalog";
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
import { ProductCard } from "./ProductCard";
import { QuizPromo } from "./QuizPromo";
import { SeriesFeature } from "./SeriesFeature";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { TabBar } from "./TabBar";
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
  /** Every product slug a "spotlight" section references, pre-resolved on
   *  the server (see SpotlightItem). */
  spotlightBySlug: Record<string, Product | null>;
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
      {b.flag ? <span aria-hidden="true">{b.flag} </span> : null}
      {b.text}
    </>
  ) : undefined;

/** Dumb link-only card for a series' own "what's in it" row — no local
 *  cart wiring, matching how these homepage series blocks always worked. */
function seriesCard(p: Product) {
  return (
    <ProductCard
      key={p.slug}
      fluid
      title={p.headline}
      category={p.category}
      price={p.prices[0].price}
      priceWas={p.prices[1].price}
      href={productHref(p.slug)}
      cartHref={p.prices[1].cta.href}
      images={p.carouselImages.map((src) => ({ src, alt: p.name }))}
    />
  );
}

function SeriesBlock({ series }: { series: SeriesView }) {
  return (
    <SeriesFeature
      seriesName={series.titleLead}
      product={series.product}
      images={series.images.map((src) => ({ src, alt: series.titleLead }))}
      blurbTitle={{ lead: series.titleLead, accent: series.titleAccent }}
      blurbBody={series.blurb}
      carouselItems={series.products.map(seriesCard)}
    />
  );
}

function Reels({ content }: { content: ReelsContent }) {
  return (
    <CommunityReels
      title={content.title}
      body={content.body}
      reels={content.reels}
    />
  );
}

function Spotlight({ item, product }: { item: SpotlightItem; product: Product }) {
  return (
    <SeriesFeature
      seriesName={item.seriesName}
      heading={item.heading}
      product={product}
    />
  );
}

function HomeContent({
  phases,
  domains,
  domainCards,
  featureProduct,
  seriesById,
  spotlightBySlug,
}: HomeViewProps) {
  const { phase, setPhase } = usePhase();
  const c = HOME_CONTENT[phase];
  const phaseIds = phases.map((p) => p.id);

  return (
    <main>
      <SiteHeader />

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
            return series ? <SeriesBlock key={`series-${s.id}`} series={series} /> : null;
          }
          if (s.kind === "spotlight") {
            const product = spotlightBySlug[s.slug];
            return product ? (
              <Spotlight key={`spotlight-${s.slug}`} item={s} product={product} />
            ) : null;
          }
          if (s.kind === "quiz") {
            return <QuizPromo key="quiz" />;
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

      <SiteFooter />

      <TabBar />
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
