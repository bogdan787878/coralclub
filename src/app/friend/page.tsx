import type { Metadata } from "next";
import { Accent, Container, Heading, Section } from "@/components/ui";
import { Hero } from "@/components/organisms";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { FriendBanner } from "@/components/friend/FriendProvider";
import { FriendCards } from "@/components/friend/FriendCards";
import { FriendCartButton } from "@/components/friend/FriendCart";
import { FriendRegisterCta } from "@/components/friend/FriendRegisterCta";
import { HOME_CONTENT } from "@/content/home";
import { asset } from "@/lib/asset";
import { FRIEND_SETS, FRIEND_SINGLES } from "@/lib/friendCatalog";
import styles from "@/components/friend/Friend.module.css";

export const metadata: Metadata = {
  title: "Гидратация по клубной цене — Coral Club",
  robots: { index: false, follow: false },
};

const STEPS = [
  {
    title: "Переходите по ссылке друга",
    text: "Цены на странице клубные: −20% на первую покупку по этой ссылке.",
  },
  {
    title: "Оформляете без регистрации",
    text: "Откроется корзина Coral Club с вашими товарами. Регистрироваться, чтобы купить, не нужно.",
  },
  {
    title: "Регистрируетесь, когда удобно",
    text: "Стать членом клуба можно после покупки — в любой момент и без давления.",
  },
];

export default function FriendHome() {
  const hero = HOME_CONTENT.hydration.hero.image;

  return (
    <div className="appShell">
      <main className={styles.page} data-analytics-location="home">
        <LandingHeader homeHref={asset("/friend/")} />
        <FriendBanner />

        <Hero
          title={
            <>
              Гидратация по клубной цене, <Accent>без регистрации</Accent>
            </>
          }
          body={
            <p>
              Первый шаг системы Coral Club — наборы для гидратации со скидкой
              20% по ссылке вашего друга.
            </p>
          }
          image={hero}
          cta={{ label: "Выбрать набор", href: "#hydration" }}
        />

        <Section
          id="hydration"
          tone="default"
          className={styles.section}
          data-analytics-section="sets"
        >
          <Container>
            <Heading as="h2" className={styles.h2}>
              Первая фаза: <Accent>гидратация</Accent>
            </Heading>
            <p className={styles.lead}>
              Наборы на 30 дней: всё нужное в одной коробке.
            </p>
          </Container>
          <FriendCards
            products={FRIEND_SETS}
            listId="friend_sets"
            listName="Наборы для гидратации"
            label="Наборы для гидратации"
            minCols={2}
          />
        </Section>

        <Section
          tone="surface"
          className={styles.section}
          data-analytics-section="singles"
        >
          <Container>
            <Heading as="h2" className={styles.h2}>
              Или <Accent>по одному</Accent>
            </Heading>
          </Container>
          <FriendCards
            products={FRIEND_SINGLES}
            listId="friend_singles"
            listName="Гидратация по одному"
            label="Продукты для гидратации"
            minCols={4}
          />
        </Section>

        <Section
          tone="default"
          className={styles.section}
          data-analytics-section="how"
        >
          <Container>
            <Heading as="h2" className={styles.h2}>
              Как это <Accent>работает</Accent>
            </Heading>
            <ol className={styles.steps}>
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <span className={styles.stepNum} aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepText}>{s.text}</p>
                </li>
              ))}
            </ol>
          </Container>
        </Section>

        <Section tone="default" className={styles.section}>
          <Container>
            <FriendRegisterCta where="home" />
          </Container>
        </Section>

        <footer className={styles.footer} data-analytics-location="footer">
          <Container>
            <p>
              БАД не является лекарственным средством. Перед применением
              проконсультируйтесь со специалистом.
            </p>
          </Container>
        </footer>
        <FriendCartButton />
      </main>
    </div>
  );
}
