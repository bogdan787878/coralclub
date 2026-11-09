"use client";

import { Fragment, useEffect, useState } from "react";
import { catalogSection, type Product } from "@coral/api";
import { Accent, Container } from "@/components/ui";
import { AdvisoryBoard, Carousel, CommunityReels, Editorial, HeroCarousel, PhaseSwitcherPills } from "@/components/organisms";
import { DomainCarousel } from "@/components/organisms/DomainCarousel";
import { ShopSkeleton } from "@/components/lk/LkShop";
import { LK_ADVISORS, LK_HOME, LK_REELS, lkHeroImage } from "@/content/homeLk";
import { LK_DOMAINS, LK_PHASE_SECTIONS } from "@/lib/lk/domains";
import { PhaseProvider, usePhase, type PhaseId } from "@/lib/phase";
import home from "@/components/organisms/HomeView.module.css";
import phases from "@/components/organisms/PhasesSection.module.css";
import { MemberCard } from "./MemberCard";

const PHASES: PhaseId[] = ["hydration", "restart", "personalization"];

/** Товары нескольких разделов API: в порядке разделов, каждый товар один раз; кэш на время страницы. */
const cache = new Map<string, Promise<Product[]>>();
function sectionsProducts(codes: readonly string[]): Promise<Product[]> {
  const key = codes.join(",");
  if (!cache.has(key)) {
    cache.set(
      key,
      Promise.all(codes.map(catalogSection)).then((got) => {
        const seen = new Set<number>();
        return got.flatMap((g) => g?.products ?? []).filter((p) => p.available && !seen.has(p.code) && !!seen.add(p.code));
      }),
    );
  }
  return cache.get(key)!;
}
function useSections(codes: readonly string[]) {
  const key = codes.join(",");
  const [got, setGot] = useState<{ key: string; list: Product[] } | null>(null);
  useEffect(() => {
    let alive = true;
    sectionsProducts(key.split(",")).then((list) => alive && setGot({ key, list }));
    return () => {
      alive = false;
    };
  }, [key]);
  return got?.key === key ? got.list : null; // другой набор разделов — пока грузится, шимер
}

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

function Products({ codes, label, title }: { codes: readonly string[]; label: string; title: React.ReactNode }) {
  const list = useSections(codes);
  if (!list) return <Container><ShopSkeleton n={2} /></Container>;
  if (!list.length) return null;
  return (
    <Carousel label={label} title={title}>
      {list.map((p) => (
        <MemberCard key={p.code} p={p} />
      ))}
    </Carousel>
  );
}

/** Блок фаз: гидратация и перезагрузка — свои разделы API; персонализация — выбор домена и его товары. */
function LkPhases({ slideDir }: { slideDir: number }) {
  const { phase } = usePhase();
  const [domainId, setDomainId] = useState(LK_DOMAINS[0].id);
  const c = LK_HOME[phase];
  const domain = LK_DOMAINS.find((d) => d.id === domainId) ?? LK_DOMAINS[0];
  return (
    <section className={phases.section}>
      <div key={phase} className={`${phases.inner} ${phases.phaseSlide}`} style={{ ["--slide-dir" as string]: slideDir }}>
        {phase === "personalization" ? (
          <>
            <DomainCarousel domains={LK_DOMAINS.map((d) => ({ id: d.id, label: d.label, goal: "energy", products: [] }))} value={domain.id} onChange={setDomainId} />
            <Products
              key={domain.id}
              codes={domain.sections}
              label={`Персонализация — ${domain.label}`}
              title={
                <>
                  Ваш маршрут: <Accent>{domain.label.toLowerCase()}</Accent>
                </>
              }
            />
          </>
        ) : (
          <Products codes={LK_PHASE_SECTIONS[phase]} label={c.name} title={<>{c.headline.lead} <Accent>{c.headline.accent}</Accent></>} />
        )}
      </div>
    </section>
  );
}

function LkHomeContent() {
  const { phase, setPhase } = usePhase();
  const [prev, setPrev] = useState(phase);
  const [slideDir, setSlideDir] = useState(1);
  if (phase !== prev) {
    setSlideDir(PHASES.indexOf(phase) - PHASES.indexOf(prev) >= 0 ? 1 : -1);
    setPrev(phase);
  }
  const c = LK_HOME[phase];
  return (
    <main>
      <HeroCarousel
        activeIndex={PHASES.indexOf(phase)}
        onSelect={(i) => PHASES[i] && setPhase(PHASES[i])}
        labels={{ dots: "Фазы", dot: (n) => `Фаза ${n}` }}
        slides={PHASES.map((id) => ({
          title: titleNode(LK_HOME[id].hero.title),
          body: (
            <>
              {LK_HOME[id].hero.body.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </>
          ),
          image: lkHeroImage(id),
          cta: LK_HOME[id].hero.cta,
        }))}
      />

      <div className={home.phaseSwitcherSticky}>
        <PhaseSwitcherPills phases={PHASES.map((id) => ({ id, name: LK_HOME[id].name }))} value={phase} onChange={(id) => setPhase(id as PhaseId)} label="Фазы программы" short={{ personalization: "Личное" }} />
      </div>

      <div id="phases">
        <LkPhases slideDir={slideDir} />
      </div>

      <div key={`tail-${phase}`} className={home.swap} style={{ ["--slide-dir" as string]: slideDir }}>
        {c.editorials.map((e, i) =>
          e.image ? (
            <Fragment key={i}>
              <Editorial
                title={e.title}
                image={e.image}
                badge={e.badge}
                body={
                  <>
                    {e.body.map((t) => (
                      <p key={t}>{t}</p>
                    ))}
                  </>
                }
              />
              {/* научный совет — после первой статьи, как на витрине */}
              {i === 0 && c.advisory && LK_ADVISORS.length > 0 && <AdvisoryBoard title={{ lead: "За продуктами —", accent: "научный совет" }} members={LK_ADVISORS} />}
            </Fragment>
          ) : null,
        )}
        <CommunityReels title={c.reels.title} body={c.reels.body} reels={LK_REELS} />
      </div>
    </main>
  );
}

/**
 * Главная кабинета — как главная витрины (/): герой-карусель фаз (гидратация, перезагрузка, персонализация),
 * закреплённый переключатель фаз, блок фаз с товарами, статьи, научный совет, ролики. Тексты — русские
 * (content/homeLk.ts), товары и цены — разделы каталога API по витрине сессии.
 */
export function LkHomeView() {
  return (
    <PhaseProvider>
      <LkHomeContent />
    </PhaseProvider>
  );
}
