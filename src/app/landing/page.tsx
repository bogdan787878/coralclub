import type { Metadata } from "next";
import Image from "next/image";
import { Accent, Container, Heading, Section } from "@/components/ui";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LeadModalProvider } from "@/components/landing/LeadModal";
import { LandingCta } from "@/components/landing/LandingCta";
import { LandingCards } from "@/components/landing/LandingCards";
import { LandingCartButton } from "@/components/landing/LandingCartButton";
import {
  ProductSlider,
  type ProductSlide,
} from "@/components/landing/ProductSlider";
import { asset } from "@/lib/asset";
import { BEAUTY_SLUGS, MAIN_SITE_URL } from "@/lib/beautySystem";
import {
  LANDING_PRODUCTS_RU,
  discountTag,
  formatRub,
  landingPdpHref,
  type BeautySlug,
} from "@/lib/landingCatalogRu";
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
const heroEntry = heroImages.items.find((i) => i.id === "personalization");
const HERO_SRC = heroEntry
  ? `${asset(heroEntry.mobile || heroEntry.desktop)}?v=3`
  : "";
const product = (slug: string) => asset(`/images/products/${slug}.png`);

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

/** Packshot override for the slider where the shared photo needs framing. */
const SLIDE_IMAGE: Partial<
  Record<BeautySlug, { src: string; fit?: "cover"; position?: string }>
> = {
  // no Hydramax packshot yet — the lifestyle photo is cropped to the box
  hydramax: {
    src: asset("/images/products/hydramax.png"),
    fit: "cover",
    position: "42% 50%",
  },
};

const NAV = [
  ["#why", "Почему система работает"],
  ["#products", "Продукты"],
  ["#masks", "Маски"],
  ["#collagen", "Коллаген"],
  ["#hydramax", "Гидрамакс"],
  ["#consultation", "Консультация"],
] as const;

export default function LandingPage() {
  const cards = getProductCards([...BEAUTY_SLUGS]).map((c) => {
    const ru = LANDING_PRODUCTS_RU[c.slug as BeautySlug];
    return {
      ...c,
      name: ru.name,
      headline: ru.headline,
      category: ru.category,
      price: formatRub(ru.priceRub.club),
      priceWas: formatRub(ru.priceRub.regular),
    };
  });
  const bySlug = Object.fromEntries(cards.map((c) => [c.slug, c]));
  const slidesFor = (slugs: readonly BeautySlug[]): ProductSlide[] =>
    slugs.map((slug) => {
      const ru = LANDING_PRODUCTS_RU[slug];
      const card = bySlug[slug];
      const override = SLIDE_IMAGE[slug];
      return {
        id: slug,
        title: ru.name,
        image: {
          src: override?.src ?? product(slug),
          alt: ru.name,
          fit: override?.fit,
          position: override?.position,
        },
        lead: ru.lead,
        bullets: ru.bullets,
        extra: ru.extra,
        badge: ru.pack,
        meta: card
          ? {
              category: ru.category,
              price: card.price,
              priceWas: card.priceWas,
              discount: discountTag(slug),
              href: landingPdpHref(slug),
            }
          : undefined,
      };
    });
  const maskSlides = slidesFor(MASK_SLUGS);
  const collagenSlides = slidesFor(COLLAGEN_SLUGS);
  const hydramaxSlides = slidesFor(HYDRAMAX_SLUGS);

  return (
    <div className="appShell">
      <LeadModalProvider>
        <main className={styles.page}>
          <LandingHeader homeHref={MAIN_SITE_URL} />

          <section className={styles.hero}>
            <div className={styles.heroMedia}>
              {HERO_SRC && (
                <Image
                  src={HERO_SRC}
                  alt="Promarine Collagen Tripeptides и маска Hydro Boost на столе"
                  fill
                  priority
                  sizes="(max-width: 1023px) 100vw, 560px"
                />
              )}
            </div>
            <Container className={styles.heroCol}>
              <div className={styles.heroBody}>
                <Heading className={styles.heroTitle}>
                  Ваша <Accent>система красоты</Accent>
                </Heading>
                <p className={styles.heroText}>
                  Уход изнутри и снаружи в одной системе от Coral Club:
                  коллаген, гидратация и маски для естественного сияния кожи.
                </p>
                <LandingCta source="hero" className={styles.cta}>
                  Записаться на консультацию
                </LandingCta>
              </div>
            </Container>
          </section>

          <section id="why" className={styles.why}>
            <Container>
              <Heading as="h2" className={styles.h2}>
                Почему наша <Accent>система работает</Accent>
              </Heading>
              <p className={styles.lead}>
                Добавки работают изнутри, маски — снаружи. Вместе это
                комплексный подход к красоте и здоровью.
              </p>
            </Container>
            <div id="products" className={styles.cards}>
              <LandingCards cards={cards} />
            </div>
          </section>

          <Section tone="surface" id="masks" className={styles.section}>
            <Container>
              <div className={styles.block}>
                <div className={styles.blockMedia}>
                  <Image
                    src={img("masks.jpg")}
                    alt="Три вида масок Coral Club"
                    fill
                    sizes="(max-width: 1023px) 100vw, 480px"
                  />
                </div>
                <div className={styles.blockBody}>
                  <Heading as="h2" className={styles.h2}>
                    Сияние и восстановление кожи
                  </Heading>
                  <ProductSlider slides={maskSlides} />
                </div>
              </div>
            </Container>
          </Section>

          <Section tone="default" id="collagen" className={styles.section}>
            <Container>
              <div className={styles.block}>
                <div className={styles.blockMedia}>
                  <Image
                    src={img("collagen.jpg")}
                    alt="Пептидный и трипептидный коллаген"
                    fill
                    sizes="(max-width: 1023px) 100vw, 480px"
                  />
                </div>
                <div className={styles.blockBody}>
                  <Heading as="h2" className={styles.h2}>
                    Коллаген — это белок молодости.
                  </Heading>
                  <ProductSlider slides={collagenSlides} />
                </div>
              </div>
            </Container>
          </Section>

          <Section tone="surface" id="hydramax" className={styles.section}>
            <Container>
              <div className={styles.block}>
                <div className={styles.blockMedia}>
                  <Image
                    src={img("hydramax.jpg")}
                    alt="Гидрамакс и Гидрамакс Плюс"
                    fill
                    sizes="(max-width: 1023px) 100vw, 480px"
                  />
                </div>
                <div className={styles.blockBody}>
                  <Heading as="h2" className={styles.h2}>
                    Глубокая гидратация на клеточном уровне
                  </Heading>
                  <ProductSlider slides={hydramaxSlides} />
                </div>
              </div>
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
