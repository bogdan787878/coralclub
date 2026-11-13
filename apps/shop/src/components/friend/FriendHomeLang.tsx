"use client";

import type { ReactNode } from "react";
import { Accent, Container, Heading, Section } from "@/components/ui";
import { CommunityReels, Editorial, Hero } from "@/components/organisms";
import { LK_HOME, LK_REELS, lkHeroImage } from "@/content/homeLk";
import { FRIEND_SETS, FRIEND_SINGLES } from "@/lib/friendCatalog";
import { useFriendLang } from "@/lib/friendLang";
import grid from "./FriendGrid.module.css";
import styles from "./Friend.module.css";
import { FriendAdvisors } from "./FriendAdvisors";
import { FriendCards } from "./FriendCards";
import { FriendRegisterCta } from "./FriendRegisterCta";

const lines = (v: string | string[]) => (Array.isArray(v) ? v : [v]);

/** Главная «Друга клуба» по-русски (витрина России): тексты гидратации главной участника, те же блоки и фото. */
function FriendHomeRu() {
  const c = LK_HOME.hydration;
  const [water, minerals] = c.editorials;
  const editorial = (e: (typeof c.editorials)[number]) => (
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
  );

  return (
    <div className={`appShell ${grid.home}`}>
      <main className={styles.page} data-analytics-location="home">
        <Hero
          title={
            <>
              {lines(c.hero.title.lead).map((l) => (
                <span key={l}>
                  {l}
                  <br />
                </span>
              ))}
              <Accent>{c.hero.title.accent}</Accent>
            </>
          }
          body={
            <>
              {c.hero.body.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </>
          }
          image={lkHeroImage("hydration")}
          cta={{ label: c.hero.cta.label, href: "#hydration" }}
        />

        <Section id="hydration" tone="default" className={styles.section} data-analytics-section="sets">
          <Container>
            <Heading as="h2" className={styles.h2}>
              {c.headline.lead} <Accent>{c.headline.accent}</Accent>
            </Heading>
            <p className={styles.lead}>
              Обычная вода быстро уходит из организма — удержать её помогают минералы и электролиты.
            </p>
          </Container>
          <FriendCards products={FRIEND_SETS} listId="friend_sets" listName="Hydration sets" label="Наборы для гидратации" minCols={2} />
        </Section>

        <Section tone="surface" className={styles.section} data-analytics-section="singles">
          <Container>
            <Heading as="h2" className={styles.h2}>
              Или <Accent>по одному</Accent>
            </Heading>
          </Container>
          <FriendCards products={FRIEND_SINGLES} listId="friend_singles" listName="Hydration, one by one" label="Товары для гидратации" minCols={4} />
        </Section>

        {water && editorial(water)}

        <FriendAdvisors lang="ru" />

        {minerals && editorial(minerals)}

        <CommunityReels
          title={c.reels.title}
          body={c.reels.body}
          reels={LK_REELS}
        />

        <Section tone="default" className={styles.section}>
          <Container>
            <FriendRegisterCta where="home" />
          </Container>
        </Section>

        <footer className={styles.footer} data-analytics-location="footer">
          <Container>
            <p>
              Биологически активные добавки не заменяют разнообразное и сбалансированное питание и здоровый образ
              жизни. Не превышайте рекомендуемую суточную дозу. Хранить в недоступном для детей месте.
            </p>
          </Container>
        </footer>
      </main>
    </div>
  );
}

/** Главная на языке страны: английская (статичная) — `children`, для России — русская. */
export function FriendHomeLang({ children }: { children: ReactNode }) {
  return useFriendLang() === "ru" ? <FriendHomeRu /> : <>{children}</>;
}
