"use client";

import { useEffect, useState } from "react";
import { Accent, Chip, Chips, Container, Heading, Section } from "@/components/ui";
import { HeroCarousel } from "@/components/organisms/HeroCarousel";
import { PhaseSwitcherPills } from "@/components/organisms/PhaseSwitcherPills";
import home from "@/components/organisms/HomeView.module.css";
import friend from "@/components/friend/Friend.module.css";
import { loadRuHits } from "@/lib/ru/live";
import {
  BALANCE_DOMAINS,
  BEAUTY_CARE,
  BEAUTY_IN,
  BEAUTY_PACK,
  HYDRATION_PACK,
  RESET_PACKS,
  RU_PHASES,
  type RuPack,
  type RuPhaseId,
} from "@/lib/ru/home";
import { ruProductByCode, ruProducts, type RuProduct } from "@/lib/ru/shop";
import { RuCards } from "./RuCards";
import { RuPromo } from "./RuPromo";
import styles from "./Ru.module.css";

/** Заголовок раздела: строка и курсивный акцент (как на главной магазина). */
function Title({ lead, accent, as = "h2" }: { lead: string; accent?: string; as?: "h2" | "h3" }) {
  return (
    <Container>
      <Heading as={as} className={as === "h2" ? friend.h2 : styles.packTitle}>
        {lead}
        {accent && (
          <>
            <br />
            <Accent>{accent}</Accent>
          </>
        )}
      </Heading>
    </Container>
  );
}

/** Набор: одна крупная карточка, под ней — что в него входит. Без заголовка — карточка сама называет набор. */
function Pack({ code, parts: partCodes, title, id, heading = "h2" }: { code: number; parts: number[]; title?: RuPack["title"]; id: string; heading?: "h2" | "h3" }) {
  const p = ruProductByCode(code);
  if (!p) return null;
  const parts = ruProducts(partCodes);
  return (
    <div className={styles.pack}>
      {title && <Title lead={title.lead} accent={title.accent} as={heading} />}
      <RuCards products={[p]} listId={`${id}_pack`} label={p.name} minCols={1} />
      {parts.length > 0 && (
        <div className={styles.packParts}>
          <Container>
            <p className={styles.packLabel}>Что входит в набор</p>
          </Container>
          <RuCards products={parts} listId={`${id}_parts`} label={`Что входит: ${p.name}`} minCols={4} />
        </div>
      )}
    </div>
  );
}

function Row({ id, lead, accent, products }: { id: string; lead: string; accent?: string; products: RuProduct[] }) {
  if (!products.length) return null;
  return (
    <Section tone="default" className={friend.section} data-analytics-section={id}>
      <Title lead={lead} accent={accent} />
      <RuCards products={products} listId={id} label={lead} minCols={4} availableFirst />
    </Section>
  );
}

/** Акции сайта (баннеры) — во всех фазах. */
function Promo() {
  return (
    <Section tone="default" className={friend.section} data-analytics-section="promo">
      <Title lead="Акции" />
      <RuPromo />
    </Section>
  );
}

/** Хиты продаж сайта России — во всех фазах; пока сайт не ответил, раздела нет. */
function Hits() {
  const [codes, setCodes] = useState<number[] | null>(null);
  useEffect(() => {
    let alive = true;
    loadRuHits().then((c) => alive && setCodes(c));
    return () => {
      alive = false;
    };
  }, []);
  // фасовки одного товара (2200 и 2201) — одна карточка
  const products = [...new Map((codes ?? []).map((c) => ruProductByCode(c)).filter((p): p is RuProduct => Boolean(p)).map((p) => [p.code, p])).values()].slice(0, 12);
  return <Row id="hits" lead="Хиты" accent="продаж" products={products} />;
}

function Hydration() {
  return (
    <>
      <Section tone="default" className={friend.section} data-analytics-section="hydration">
        <Pack {...HYDRATION_PACK} id="hydration" />
      </Section>
      <Promo />
      <Hits />
      <Section tone="default" className={friend.section} data-analytics-section="reset">
        <Title lead="Перезагрузка" accent="очищение по шагам" />
        <div className={styles.packs}>
          {RESET_PACKS.map((pack) => (
            <Pack key={pack.code} {...pack} id={`reset_${pack.code}`} heading="h3" />
          ))}
        </div>
      </Section>
    </>
  );
}

function Beauty() {
  return (
    <>
      <Row id="beauty_in" lead="Красота" accent="изнутри" products={BEAUTY_IN} />
      <Row id="beauty_care" lead="Маски" accent="и уход" products={BEAUTY_CARE} />
      <Section tone="default" className={friend.section} data-analytics-section="beauty_liumi">
        <Pack {...BEAUTY_PACK} id="beauty" />
      </Section>
      <Promo />
      <Hits />
    </>
  );
}

function Balance() {
  const [id, setId] = useState(BALANCE_DOMAINS[0]?.id ?? "");
  const domain = BALANCE_DOMAINS.find((d) => d.id === id) ?? BALANCE_DOMAINS[0];
  return (
    <>
      <Section tone="default" className={friend.section} data-analytics-section="balance">
        <Title lead="Что важно" accent="сейчас?" />
        <Container>
          <Chips className={styles.domains} aria-label="Домены здоровья">
            {BALANCE_DOMAINS.map((d) => (
              <Chip key={d.id} active={d.id === domain?.id} aria-pressed={d.id === domain?.id} onClick={() => setId(d.id)}>
                {d.label}
              </Chip>
            ))}
          </Chips>
        </Container>
        {domain && (
          <div key={domain.id} className={styles.packs}>
            {domain.packs.map((p) => (
              <Pack key={p.code} code={p.code} parts={p.parts} id={`balance_${p.code}`} />
            ))}
            {domain.products.length > 0 && (
              <div>
                {domain.packs.length > 0 && <Title lead={`Ещё: ${domain.label.toLowerCase()}`} as="h3" />}
                <RuCards products={domain.products} listId={`balance_${domain.id}`} label={domain.label} minCols={4} availableFirst />
              </div>
            )}
          </div>
        )}
      </Section>
      <Promo />
      <Hits />
    </>
  );
}

/**
 * Главная магазина России: хиро из трёх фаз (Гидратация, Красота, Баланс) с переключателем, под ним — разделы
 * выбранной фазы. Гидратация: набор и минералы, акции, хиты, «Перезагрузка» (три набора очищения). Красота:
 * LIŪMI, красота изнутри, маски и уход. Баланс: домены здоровья — наборы и продукты домена.
 */
export function RuHome() {
  const [phase, setPhase] = useState<RuPhaseId>("hydration");
  const index = RU_PHASES.findIndex((p) => p.id === phase);
  const toContent = () => document.getElementById("phase")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main className={friend.page} data-analytics-location="home">
      <HeroCarousel
        activeIndex={index}
        onSelect={(i) => setPhase(RU_PHASES[i]?.id ?? "hydration")}
        labels={{ dots: "Фазы", dot: (n) => `Фаза ${n}` }}
        slides={RU_PHASES.map((p) => ({
          title: (
            <>
              {p.hero.title.lead}
              <br />
              <Accent>{p.hero.title.accent}</Accent>
            </>
          ),
          body: <p>{p.hero.body}</p>,
          image: p.hero.image,
          cta: { label: "Выбрать", onClick: toContent },
          align: "bottom" as const,
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

      <div id="phase" key={phase} className={`${home.swap} ${styles.phase}`}>
        {phase === "hydration" && <Hydration />}
        {phase === "beauty" && <Beauty />}
        {phase === "balance" && <Balance />}
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
