import type { Metadata } from "next";
import { Accent, Container, Heading, Section } from "@/components/ui";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { Ingredients } from "@/components/landing/Ingredients";
import { LandingHero } from "@/components/landing/LandingHero";
import { LeadModalProvider } from "@/components/landing/LeadModal";
import { Reviews } from "@/components/landing/Reviews";
import {
  ALL_REVIEWS_URL,
  LANDING_FEATURED_IDS,
  LANDING_REVIEWS_RU,
  overallSummary,
} from "@/lib/landingReviewsRu";
import { LandingCta, PromoCode } from "@/components/landing/LandingCta";
import { LandingCards } from "@/components/landing/LandingCards";
import { LandingCartButton } from "@/components/landing/LandingCartButton";
import { asset } from "@/lib/asset";
import { BEAUTY_SLUGS, MAIN_SITE_URL, PROMO_CODE } from "@/lib/beautySystem";
import {
  LANDING_PRODUCTS_RU,
  formatRub,
  type BeautySlug,
} from "@/lib/landingCatalogRu";
import { landingGallery } from "@/lib/landingGallery";
import { getProductCards } from "@/lib/products";
import heroImages from "../../../content/hero-images.json";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Ваша система красоты — Coral Club",
  description:
    "Уникальная философия красоты и здоровья от Coral Club: гармония внутреннего состояния и внешнего ухода.",
  robots: { index: false, follow: false },
};

const img = (name: string) => asset(`/images/landing/${name}?v=1`);

/** A hero photo from content/hero-images.json (CMS-managed), same prefixing
 *  and cache-busting as the shop home. */
function heroPhoto(id: string, alt: string) {
  const entry = heroImages.items.find((i) => i.id === id);
  const desktop = entry?.desktop ?? "";
  const mobile = entry?.mobile || desktop;
  return {
    desktopSrc: desktop ? `${asset(desktop)}?v=3` : "",
    mobileSrc: mobile ? `${asset(mobile)}?v=3` : "",
    alt,
  };
}

/** Slides of the landing hero. The first keeps the landing's own photo; the
 *  other two borrow the shop's phase heroes until the landing gets its own. */
const heroSlides = [
  {
    id: "masks",
    name: "Маски",
    image: {
      desktopSrc: img("hero-masks-desktop.webp"),
      mobileSrc: img("hero-masks-mobile.webp"),
      alt: "Три биоцеллюлозные маски Coral Club — упаковки и саше на столе в солнечном свете",
    },
  },
  {
    id: "collagen",
    name: "Коллаген",
    image: heroPhoto("restart", "Продукты Coral Club на студийных подиумах"),
  },
  {
    id: "hydration",
    name: "Гидратация",
    image: heroPhoto("hydration", "Набор для гидратации Coral Club"),
  },
];

const MASK_SLUGS = [
  "advanced-collagen-biocellulose-facial-mask",
  "hydro-boost-biocellulose-facial-mask",
  "skin-harmony-biocellulose-facial-mask",
] as const;
const COLLAGEN_SLUGS = [
  "promarine-collagen",
  "promarine-collagen-tripeptides-pack",
] as const;
const HYDRAMAX_SLUGS = ["hydramax", "hydramax-plus"] as const;

const NAV = [
  ["#why", "Почему система работает"],
  ["#products", "Продукты"],
  ["#masks", "Маски"],
  ["#collagen", "Коллаген"],
  ["#hydramax", "Гидрамакс"],
  ["#reviews", "Отзывы"],
  ["#consultation", "Консультация"],
] as const;

export default function LandingPage() {
  const cards = getProductCards([...BEAUTY_SLUGS]).map((c) => {
    const ru = LANDING_PRODUCTS_RU[c.slug as BeautySlug];
    return {
      ...c,
      images: landingGallery(c.slug),
      name: ru.name,
      headline: ru.headline,
      category: ru.category,
      price: formatRub(ru.priceRub.club),
      priceWas: formatRub(ru.priceRub.regular),
    };
  });
  // the three product blocks use the same small card carousel as the
  // "why" block, filtered to their own products
  const cardsFor = (slugs: readonly string[]) =>
    cards.filter((c) => slugs.includes(c.slug));

  const featuredReviews = LANDING_FEATURED_IDS.flatMap((id) =>
    LANDING_REVIEWS_RU.filter((r) => r.id === id),
  );
  const reviewProductNames = Object.fromEntries(
    BEAUTY_SLUGS.map((slug) => [slug, LANDING_PRODUCTS_RU[slug].name]),
  );

  return (
    <div className="appShell">
      <LeadModalProvider>
        <main className={styles.page}>
          <LandingHeader homeHref={MAIN_SITE_URL} />

          <LandingHero slides={heroSlides} />

          <section id="why" className={styles.why}>
            <Container>
              <div className={styles.whyInner}>
                <div className={styles.whyCopy}>
                  <Heading as="h2" className={styles.h2}>
                    Почему наша <Accent>система работает</Accent>
                  </Heading>
                  <p className={styles.lead}>
                    Добавки работают изнутри, маски — снаружи. Вместе это
                    комплексный подход к красоте и здоровью.
                  </p>
                  <div className={styles.promo}>
                    <p className={styles.promoText}>
                      Получите специальную скидку по промокоду{" "}
                      <PromoCode
                        code={PROMO_CODE}
                        className={styles.promoCode}
                      />{" "}
                      на продукты Системы Красоты
                    </p>
                  </div>
                </div>
              </div>
            </Container>
            <div id="products" className={styles.cards}>
              <LandingCards cards={cards} />
            </div>
          </section>

          <Ingredients />

          <Section tone="surface" id="masks" className={styles.section}>
            <Container>
              <div className={styles.block}>
                <div className={styles.blockPlaceholder} aria-hidden="true" />
                <div className={styles.blockBody}>
                  <div className={styles.blockHead}>
                    <Heading as="h2" className={styles.h2}>
                      Сияние и восстановление кожи
                    </Heading>
                    <p className={styles.blockText}>
                      Три биоцеллюлозные маски для лица с разным назначением:
                      Advanced Collagen поддерживает эластичность и упругость
                      кожи, Hydro Boost глубоко увлажняет, Skin Harmony
                      успокаивает и выравнивает тон.
                    </p>
                    <p className={styles.blockText}>
                      Биоцеллюлозная основа плотно прилегает к лицу и удерживает
                      до 3 раз больше сыворотки, чем другие основы. В упаковке 5
                      масок по 25 мл — используйте 2–3 раза в неделю.
                    </p>
                  </div>
                  <LandingCards
                    cards={cardsFor(MASK_SLUGS)}
                    label="Маски"
                    minCols={4}
                  />
                </div>
              </div>
            </Container>
          </Section>

          <Section tone="default" id="collagen" className={styles.section}>
            <Container>
              <div className={styles.block}>
                <div className={styles.blockPlaceholder} aria-hidden="true" />
                <div className={styles.blockBody}>
                  <div className={styles.blockHead}>
                    <Heading as="h2" className={styles.h2}>
                      Коллаген — это белок молодости.
                    </Heading>
                    <p className={styles.blockText}>
                      Коллаген — главный структурный белок соединительных
                      тканей: кожи, сухожилий, связок и суставов. С возрастом
                      организм вырабатывает его всё меньше.
                    </p>
                    <p className={styles.blockText}>
                      Промарин — морской коллаген в жидкой форме, готовый к
                      приёму: во флаконе 50 мл. Выбирайте пептиды или трипептиды
                      — более мелкую молекулу, которая легче усваивается.
                    </p>
                  </div>
                  <LandingCards
                    cards={cardsFor(COLLAGEN_SLUGS)}
                    label="Коллаген"
                    minCols={4}
                  />
                </div>
              </div>
            </Container>
          </Section>

          <Section tone="surface" id="hydramax" className={styles.section}>
            <Container>
              <div className={styles.block}>
                <div className={styles.blockPlaceholder} aria-hidden="true" />
                <div className={styles.blockBody}>
                  <div className={styles.blockHead}>
                    <Heading as="h2" className={styles.h2}>
                      Глубокая гидратация на клеточном уровне
                    </Heading>
                    <p className={styles.blockText}>
                      Гидрамакс — набор на 30 дней, который делает воду
                      физиологически полноценной: микро- и макроэлементы,
                      электролиты и антиоксиданты поддерживают водно-солевой
                      баланс и защищают клетки от окислительного стресса.
                    </p>
                    <p className={styles.blockText}>
                      Гидрамакс Плюс дополнен Оушенмином — концентратом
                      глубоководных минералов, прежде всего магния.
                    </p>
                  </div>
                  <LandingCards
                    cards={cardsFor(HYDRAMAX_SLUGS)}
                    label="Гидратация"
                    minCols={4}
                  />
                </div>
              </div>
            </Container>
          </Section>

          <Section tone="surface" id="reviews" className={styles.section}>
            <Container>
              <Reviews
                title="Что говорят покупатели"
                items={featuredReviews}
                summary={{
                  ...overallSummary(),
                  caption: "по отзывам о продуктах системы красоты на Отзовике",
                }}
                productNames={reviewProductNames}
                moreHref={ALL_REVIEWS_URL}
              />
            </Container>
          </Section>

          <Section tone="default" id="consultation" className={styles.section}>
            <Container>
              <div className={styles.consult}>
                <h2 className={styles.consultTitle}>
                  Не знаете, с чего начать? Бесплатная консультация нутрициолога
                </h2>
                <p className={styles.consultText}>
                  Оставьте заявку — подберём вам персонального консультанта.
                </p>
                <LandingCta source="consultation" className={styles.consultCta}>
                  Оставить заявку
                </LandingCta>
              </div>
            </Container>
          </Section>

          <footer className={styles.footer}>
            <Container>
              <div className={styles.footerBrand}>coralclub</div>
              <nav
                className={styles.footerNav}
                aria-label="Навигация по странице"
              >
                {NAV.map(([href, label]) => (
                  <a key={href} href={href}>
                    {label}
                  </a>
                ))}
              </nav>
              <p className={styles.footerNote}>
                БАД не является лекарственным средством. Перед применением
                проконсультируйтесь со специалистом.
              </p>
            </Container>
          </footer>
        </main>
        <LandingCartButton />
      </LeadModalProvider>
    </div>
  );
}
