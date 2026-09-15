"use client";

import { Fragment } from "react";
import { Accent } from "@/components/ui";
import {
  HOME_CONTENT,
  type EditorialItem,
  type HomeSection,
  type ReelsContent,
  type SeriesItem,
} from "@/content/home";
import { addItem, setQty, useCart } from "@/lib/cart";
import { productHref } from "@/lib/catalog";
import { PhaseProvider, usePhase, type PhaseId } from "@/lib/phase";
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
import { PhaseSwitcherPills } from "./PhaseSwitcherPills";
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
  /** Pack spotlighted under the Personalization carousel (a bare
   *  heading + product card, e.g. content/series/b-luron.json). */
  bLuronPack: SeriesView | null;
  /** Every pack id referenced by any phase, pre-resolved on the server. */
  seriesById: Record<string, SeriesView | null>;
};

const titleNode = (t: { lead: string | string[]; accent: string }) => (
  <>
    {(Array.isArray(t.lead) ? t.lead : [t.lead]).map((line, i) => (
      <Fragment key={i}>
        {line}
        <br />
      </Fragment>
    ))}
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

/** Renders a resolved pack (content/series/<id>.json) — either a full
 *  pack with its own heading/description/carousel (`titleLead` set), or a
 *  bare spotlight with just a plain heading and a product card, nothing
 *  else (`heading` set instead — e.g. B-Luron, Women's Balance). */
function SeriesBlock({ series }: { series: SeriesView }) {
  const cart = useCart();
  const qtyOf = (coralId?: string) =>
    coralId ? (cart.find((l) => l.coralId === coralId)?.qty ?? 0) : 0;

  // The "what's in it" row's own cards — local-cart-wired like every
  // other product card on the site (used to be a dumb link-only card
  // that always sent taps out to coralclub.us, even for a product that
  // has a coralId and could add to our own cart instead).
  const seriesCard = (p: Product) => (
    <ProductCard
      key={p.slug}
      fluid
      title={p.headline}
      category={p.category}
      price={p.prices[0].price}
      priceWas={p.prices[1].price}
      href={productHref(p.slug)}
      cartHref={p.prices[1].cta.href}
      onAddToCart={
        p.coralId
          ? () =>
              addItem({
                coralId: p.coralId as string,
                slug: p.slug,
                name: p.name,
                price: p.prices[0].price,
                image: p.carouselImages[0],
              })
          : undefined
      }
      cartQty={qtyOf(p.coralId)}
      onSetQty={p.coralId ? (n) => setQty(p.coralId as string, n) : undefined}
      images={p.carouselImages.map((src) => ({ src, alt: p.name }))}
    />
  );

  const name = series.titleLead || series.heading || series.id;
  return (
    <SeriesFeature
      seriesName={name}
      heading={series.titleLead ? undefined : series.heading}
      product={series.product}
      images={series.images.map((src) => ({ src, alt: name }))}
      blurbTitle={series.titleLead ? { lead: series.titleLead, accent: series.titleAccent } : undefined}
      blurbBody={series.blurb || undefined}
      carouselItems={series.products.length ? series.products.map(seriesCard) : undefined}
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

/** Packs (SeriesItem sections) shown back-to-back sort among themselves
 *  by `weight` (ascending, no-weight last) — everything else (editorial,
 *  quiz) stays exactly where it is. Keeps display order admin-editable
 *  without touching this array. */
function sortPackRuns(
  sections: HomeSection[],
  seriesById: Record<string, SeriesView | null>,
): HomeSection[] {
  const out = [...sections];
  let i = 0;
  while (i < out.length) {
    if (out[i].kind !== "series") {
      i++;
      continue;
    }
    let j = i + 1;
    while (j < out.length && out[j].kind === "series") j++;
    const run = out.slice(i, j) as SeriesItem[];
    run.sort((a, b) => {
      const wa = seriesById[a.id]?.weight;
      const wb = seriesById[b.id]?.weight;
      if (wa == null && wb == null) return 0;
      if (wa == null) return 1;
      if (wb == null) return -1;
      return wa - wb;
    });
    out.splice(i, j - i, ...run);
    i = j;
  }
  return out;
}

function HomeContent({
  phases,
  domains,
  domainCards,
  bLuronPack,
  seriesById,
}: HomeViewProps) {
  const { phase, setPhase } = usePhase();
  const c = HOME_CONTENT[phase];
  const phaseIds = phases.map((p) => p.id);
  const sections = sortPackRuns(c.sections, seriesById);

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

      {/* A direct child of <main> (not nested inside HeroCarousel) on
          purpose: a `position: sticky` element can't stick past the
          bottom edge of its own containing block, and HeroCarousel's own
          box is exactly hero-height — far too short to keep this pinned
          while the rest of the page scrolls underneath it. <main> is as
          tall as the whole page, so it has all the room this needs. */}
      <div className={styles.phaseSwitcherSticky}>
        <PhaseSwitcherPills
          phases={phases.map((p) => ({ id: p.id, name: p.name }))}
          value={phase}
          onChange={(id) => setPhase(id as PhaseId)}
        />
      </div>

      {/* the switcher lives here — kept outside the swap so it stays mounted */}
      <div id="phases">
        <PhasesSection
          phases={phases}
          domains={domains}
          domainCards={domainCards}
          bLuronPack={bLuronPack}
        />
      </div>

      <div key={`tail-${phase}`} className={styles.swap}>
        {sections.map((s, i) => {
          if (s.kind === "series") {
            const series = seriesById[s.id];
            return series ? <SeriesBlock key={`series-${s.id}`} series={series} /> : null;
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

      <TabBar revealAfterId="phases" />
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
