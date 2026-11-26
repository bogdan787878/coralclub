import type { Metadata } from "next";
import { Accent, Container, Heading, Section } from "@/components/ui";
import { Hero } from "@/components/organisms";
import { RuCards } from "@/components/ru/RuCards";
import { RuPromo } from "@/components/ru/RuPromo";
import { RU_SETS, RU_SINGLES } from "@/lib/ru/shop";
import grid from "@/components/friend/FriendGrid.module.css";
import friend from "@/components/friend/Friend.module.css";
import styles from "@/components/ru/Ru.module.css";

export const metadata: Metadata = {
  title: "Система здоровья начинается с воды — Coral Club",
  robots: { index: false, follow: false },
};

const HERO = "/images/hero/ru-water.jpg";

/** Главная магазина России: хиро, минерализация воды (набор и товары по одному), акции сайта. */
export default function RuHome() {
  return (
    <div className={`appShell ${grid.home} ${styles.home}`}>
      <main className={friend.page} data-analytics-location="home">
        <Hero
          title={
            <>
              Система здоровья
              <br />
              <Accent>начинается с воды</Accent>
            </>
          }
          image={{ desktopSrc: HERO, mobileSrc: HERO, alt: "Девушка пьёт воду из стакана" }}
          cta={{ label: "Купить", href: "#minerals" }}
          align="bottom"
        />

        <Section id="minerals" tone="default" className={friend.section} data-analytics-section="minerals">
          <Container>
            <Heading as="h2" className={friend.h2}>
              Обогащение воды
              <br />
              <Accent>минералами</Accent>
            </Heading>
          </Container>
          <RuCards products={RU_SETS} listId="ru_sets" label="Наборы" minCols={1} />
          <div style={{ marginTop: "var(--space-24)" }}>
            <RuCards products={RU_SINGLES} listId="ru_singles" label="Минералы для воды" minCols={4} />
          </div>
        </Section>

        <Section tone="default" className={friend.section} data-analytics-section="promo">
          <Container>
            <Heading as="h2" className={friend.h2}>
              Акции
            </Heading>
          </Container>
          <RuPromo />
        </Section>

        <footer className={styles.footer} data-analytics-location="footer">
          <Container>
            <p>
              Биологически активные добавки не являются лекарственным средством. Не заменяют разнообразное и
              сбалансированное питание и здоровый образ жизни. Перед применением проконсультируйтесь со специалистом.
            </p>
          </Container>
        </footer>
      </main>
    </div>
  );
}
