import type { Metadata } from "next";
import { Accent, Container, Heading, Section } from "@/components/ui";
import {
  AdvisoryBoard,
  CommunityReels,
  Editorial,
  Hero,
} from "@/components/organisms";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { FriendBanner } from "@/components/friend/FriendProvider";
import { FriendCards } from "@/components/friend/FriendCards";
import { FriendCartButton } from "@/components/friend/FriendCart";
import { FriendRegisterCta } from "@/components/friend/FriendRegisterCta";
import { HOME_CONTENT, type EditorialItem } from "@/content/home";
import { asset } from "@/lib/asset";
import { FRIEND_SETS, FRIEND_SINGLES } from "@/lib/friendCatalog";
import styles from "@/components/friend/Friend.module.css";

export const metadata: Metadata = {
  title: "Гидратация по клубной цене — Coral Club",
  robots: { index: false, follow: false },
};

/** Community clips of the original home page (same files, Russian captions). */
const REELS = [
  {
    src: asset("/reels/reel1.mp4"),
    alt: "Участница рассказывает о своей утренней рутине гидратации",
  },
  {
    src: asset("/reels/reel2.mp4"),
    alt: "Участница о том, как ей далась программа",
  },
  {
    src: asset("/reels/reel3.mp4"),
    alt: "История участницы клуба с большим стажем",
  },
  {
    src: asset("/reels/reel4.mp4"),
    alt: "Участница показывает продукты, которые держит на столе",
  },
  {
    src: asset("/reels/reel5.mp4"),
    alt: "Амбассадор объясняет, почему рекомендует Coral Club",
  },
];

export default function FriendHome() {
  const hydration = HOME_CONTENT.hydration;
  // the original home's own blocks: the two editorial images and the board
  const [water, minerals] = hydration.sections.filter(
    (x): x is EditorialItem => x.kind === "editorial",
  );
  const board = hydration.sections.find((x) => x.kind === "advisory-board");

  return (
    <div className="appShell">
      <main className={styles.page} data-analytics-location="home">
        <LandingHeader homeHref={asset("/friend/")} />
        <FriendBanner />

        <Hero
          title={
            <>
              Ваше утро начинается
              <br />
              <Accent>с воды</Accent>
            </>
          }
          body={
            <p>
              Гидратация — основа вашей рутины Coral Club, на которой строится
              всё остальное.
            </p>
          }
          image={hydration.hero.image}
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
              Одна вода не увлажняет. <Accent>Минералы — да.</Accent>
            </Heading>
            <p className={styles.lead}>
              Обычная вода проходит сквозь вас быстро — задерживают её минералы
              и электролиты.
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

        {water && (
          <Editorial
            title={{
              lead: "Вы на 90% состоите из воды.",
              accent: "От неё зависит всё остальное.",
            }}
            image={{ ...water.image, alt: "Девушка пьёт стакан воды" }}
            badge="90% воды"
            body={
              <>
                <p>
                  Большинство добавок пропускают первый шаг вашей рутины: воду,
                  которую вы пьёте каждый день.
                </p>
                <p>
                  Можно принимать лучшие добавки, но если организму не хватает
                  воды, он их по-настоящему не использует. Поэтому Coral Club
                  начинает с главного — с воды, которую вы пьёте ежедневно. Всё
                  остальное строится на этом.
                </p>
              </>
            }
          />
        )}

        {minerals && (
          <Editorial
            title={{
              lead: "Минералы с японских островов,",
              accent: "где люди живут до 100 лет",
            }}
            image={{
              ...minerals.image,
              alt: "Ископаемый коралл Санго у берегов Окинавы",
            }}
            badge={
              <>
                <span aria-hidden="true">🇯🇵 </span>Окинава, Япония
              </>
            }
            body={
              <p>
                У берегов Окинавы, одной из пяти «голубых зон» планеты, лежит
                ископаемый коралл Санго, природно богатый кальцием, магнием
                и более чем 70 микроэлементами.
              </p>
            }
          />
        )}

        {board?.kind === "advisory-board" && (
          <AdvisoryBoard
            title={{
              lead: "Нас поддерживает",
              accent: "Научный консультативный совет",
            }}
            members={board.members}
          />
        )}

        <CommunityReels
          title={{
            lead: "Доказательство не на этикетке.",
            accent: "Оно в сообществе.",
          }}
          body="Реальные участники, реальные рутины. Большинство людей приходят в Coral Club потому, что кому-то, кому они доверяют, это уже подошло."
          reels={REELS}
        />

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
