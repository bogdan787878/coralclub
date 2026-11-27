"use client";

import { Fragment, useEffect, useState } from "react";
import { Accent, Container, Section } from "@/components/ui";
import { HeroCarousel } from "@/components/organisms/HeroCarousel";
import { PhaseSwitcherPills } from "@/components/organisms/PhaseSwitcherPills";
import { SeriesFeature } from "@/components/organisms/SeriesFeature";
import { DomainCarousel } from "@/components/organisms/DomainCarousel";
import home from "@/components/organisms/HomeView.module.css";
import phasesCss from "@/components/organisms/PhasesSection.module.css";
import { addRu, qtyOf, setRuQty, useRuCart } from "@/lib/ru/cart";
import { loadRuHits, useRuMember, useRuPrices } from "@/lib/ru/live";
import { RuPromo } from "./RuPromo";
import { BALANCE_DOMAINS, DETOX_PACKS, HYDRATION_PACK, RU_PHASES, type RuPack, type RuPhaseId } from "@/lib/ru/home";
import { ruHref, ruProductByCode, ruProducts, rub, ruTitle, type RuProduct } from "@/lib/ru/shop";
import { RuCard, RuCards } from "./RuCards";
import styles from "./Ru.module.css";

const SERIES_RU = { add: "В корзину", removeOne: "Убрать одну", addOne: "Добавить ещё", inside: "что входит" };

/** Набор — SeriesFeature основного магазина: крупная карточка с ценой и корзиной России, под ней — состав. */
function Pack({ pack, tightTop }: { pack: RuPack; tightTop?: boolean }) {
  const p = ruProductByCode(pack.code);
  const prices = useRuPrices();
  const cart = useRuCart();
  const member = useRuMember();
  if (!p) return null;
  const live = prices.get(p.code);
  const club = live?.club ?? null;
  const retail = live?.retail ?? null;
  const sold = live ? live.available && club !== null : true;
  const off = club !== null && retail && retail > club ? Math.round((1 - club / retail) * 100) : 0;
  const now = !live ? "…" : !sold ? "Нет в наличии" : rub(club as number);
  const was = live && sold && off > 0 ? rub(retail as number) : undefined;
  const images = (pack.images?.length ? pack.images : p.images.map((i) => i.src)).map((src) => ({ src, alt: p.name }));
  const parts = ruProducts(pack.parts);

  return (
    <SeriesFeature
      seriesName={p.name}
      heading={pack.title ? undefined : p.name}
      blurbTitle={pack.title}
      blurbBody={pack.blurb}
      images={images}
      buy={{
        href: ruHref(p.slug),
        name: ruTitle(p),
        now,
        was,
        note: was ? `Цена участника −${off}%` : undefined,
        qty: qtyOf(cart, p.code),
        onAdd: live && sold ? () => addRu(p, Boolean(member), rub(club as number), was) : undefined,
        onSetQty: (n) => setRuQty(p.code, n),
      }}
      carouselItems={parts.length ? parts.map((x, i) => <RuCard key={x.code} p={x} index={i + 1} />) : undefined}
      carouselTitle={parts.length ? "Что входит в набор" : undefined}
      labels={SERIES_RU}
      tightTop={tightTop}
    />
  );
}

/** Подборка с главной сайта России (API): хиты, акции; пока сайт не ответил — раздела нет. */
function SiteRow({ id, load, lead, accent }: { id: string; load: () => Promise<number[]>; lead: string; accent?: string }) {
  const [codes, setCodes] = useState<number[] | null>(null);
  useEffect(() => {
    let alive = true;
    load().then((c) => alive && setCodes(c));
    return () => {
      alive = false;
    };
  }, [load]);
  // фасовки одного товара (2200 и 2201) — одна карточка
  const products = [...new Map((codes ?? []).map((c) => ruProductByCode(c)).filter((p): p is RuProduct => Boolean(p)).map((p) => [p.code, p])).values()].slice(0, 12);
  if (!products.length) return null;
  return (
    <Section tone="surface" data-analytics-section={id}>
      <RuCards
        products={products}
        listId={id}
        label={accent ? `${lead} ${accent}` : lead}
        availableFirst
        title={
          accent ? (
            <>
              {lead} <Accent>{accent}</Accent>
            </>
          ) : (
            lead
          )
        }
      />
    </Section>
  );
}

/** Акции (баннеры сайта, по нажатию — каталог с акционными товарами) и хиты — под каждой фазой. */
function Tail() {
  return (
    <>
      <Section tone="surface" data-analytics-section="promo">
        <RuPromo title="Акции" />
      </Section>
      <SiteRow id="hits" load={loadRuHits} lead="Хиты" accent="продаж" />
    </>
  );
}

function Balance() {
  const [id, setId] = useState(BALANCE_DOMAINS[0]?.id ?? "");
  const domain = BALANCE_DOMAINS.find((d) => d.id === id) ?? BALANCE_DOMAINS[0];
  if (!domain) return null;
  return (
    <>
      <DomainCarousel domains={BALANCE_DOMAINS} value={domain.id} onChange={setId} label="Домены здоровья" />
      <Fragment key={domain.id}>
        {domain.products.length > 0 && (
          <RuCards
            products={domain.products}
            listId={`balance_${domain.id}`}
            label={domain.label}
            availableFirst
            title={
              <>
                Ваш маршрут: <Accent>{domain.label.toLowerCase()}</Accent>
              </>
            }
          />
        )}
        {domain.packs.map((p) => (
          <Pack key={p.code} pack={{ code: p.code, parts: p.parts }} />
        ))}
      </Fragment>
    </>
  );
}

/**
 * Главная магазина России — разметка и компоненты главной основного магазина (HomeView): хиро-карусель фаз с
 * теми же картинками, липкий переключатель фаз, блок фазы (PhasesSection), затем акции и хиты.
 *   Гидратация — Гидрамакс Плюс и что в него входит.
 *   Детокс — Корал Детокс, Парашилд, Коло-Вада Плюс, у каждого состав.
 *   Баланс — домены здоровья (DomainCarousel) и их продукты и наборы.
 */
export function RuHome() {
  const [phase, setPhase] = useState<RuPhaseId>("hydration");
  const ids = RU_PHASES.map((p) => p.id);
  const index = ids.indexOf(phase);
  // в какую сторону въезжает новая фаза — как у HomeView
  const [prev, setPrev] = useState(phase);
  const [dir, setDir] = useState(1);
  if (phase !== prev) {
    setDir(ids.indexOf(phase) - ids.indexOf(prev) >= 0 ? 1 : -1);
    setPrev(phase);
  }
  const toPhase = () => document.getElementById("phases")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main data-analytics-location="home">
      <HeroCarousel
        activeIndex={index}
        onSelect={(i) => setPhase(ids[i] ?? "hydration")}
        labels={{ dots: "Фазы", dot: (n) => `Фаза ${n}` }}
        slides={RU_PHASES.map((p) => ({
          title: (
            <>
              {p.hero.title.lead.map((l) => (
                <Fragment key={l}>
                  {l}
                  <br />
                </Fragment>
              ))}
              <Accent>{p.hero.title.accent}</Accent>
            </>
          ),
          image: p.hero.image,
          cta: { label: p.hero.cta, onClick: toPhase },
        }))}
      />

      <div className={home.phaseSwitcherSticky}>
        <PhaseSwitcherPills
          phases={RU_PHASES.map((p) => ({ id: p.id, name: p.name }))}
          value={phase}
          onChange={(id) => setPhase(id as RuPhaseId)}
          label="Выберите фазу"
          short={{}}
        />
      </div>

      <div id="phases" className={styles.phase}>
        <Section tone="surface" className={phasesCss.section}>
          <div key={phase} className={`${phasesCss.inner} ${phasesCss.phaseSlide}`} style={{ ["--slide-dir" as string]: dir }}>
            {phase === "hydration" && <Pack pack={HYDRATION_PACK} tightTop />}
            {phase === "detox" && DETOX_PACKS.map((pack, i) => <Pack key={pack.code} pack={pack} tightTop={i === 0} />)}
            {phase === "balance" && <Balance />}
          </div>
        </Section>
      </div>

      <div key={`tail-${phase}`} className={home.swap} style={{ ["--slide-dir" as string]: dir }}>
        <Tail />
      </div>

      <footer className={styles.footer} data-analytics-location="footer">
        <Container>
          <p>
            Биологически активные добавки не являются лекарственным средством. Не заменяют разнообразное и
            сбалансированное питание и здоровый образ жизни. Перед применением проконсультируйтесь со специалистом.
          </p>
        </Container>
      </footer>
    </main>
  );
}
