import type { Metadata } from "next";
import Image from "next/image";
import { Container, Heading, Section } from "@/components/ui";
import { SiteHeader, TabBar } from "@/components/organisms";
import { LeadModalProvider } from "@/components/landing/LeadModal";
import { LandingCta, PromoCode } from "@/components/landing/LandingCta";
import { LandingCards } from "@/components/landing/LandingCards";
import { ProductSlider, type ProductSlide } from "@/components/landing/ProductSlider";
import { asset } from "@/lib/asset";
import { getProductCards } from "@/lib/products";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Ваша система красоты — Coral Club",
  description:
    "Уникальная философия красоты и здоровья от Coral Club: гармония внутреннего состояния и внешнего ухода.",
  robots: { index: false, follow: false },
};

const PROMO = "LABSPACE15";
const BEAUTY_HREF = "/beauty-system/";

const CARD_SLUGS = [
  "hydramax-plus",
  "promarine-collagen",
  "promarine-collagen-tripeptides-pack",
  "advanced-collagen-biocellulose-facial-mask",
  "hydro-boost-biocellulose-facial-mask",
  "skin-harmony-biocellulose-facial-mask",
];

const img = (name: string) => asset(`/images/landing/${name}?v=1`);
const product = (slug: string) => asset(`/images/products/${slug}.png`);

const MASK_SLIDES: ProductSlide[] = [
  {
    id: "advanced-collagen",
    title: "Advanced Collagen",
    image: { src: product("advanced-collagen-biocellulose-facial-mask"), alt: "Advanced Collagen" },
    lead: "Биоцеллюлозная маска с трипептидами коллагена, морской водой, пептидами HAPA-5 и аргирелином. Направлена на интенсивное питание кожи и борьбу с признаками старения.",
    bullets: [
      "способствует сокращению количества и глубины морщин",
      "улучшает эластичность и упругость кожи",
      "стимулирует синтез собственного коллагена",
    ],
  },
  {
    id: "hydro-boost",
    title: "Hydro Boost",
    image: { src: product("hydro-boost-biocellulose-facial-mask"), alt: "Hydro Boost" },
    lead: "Биоцеллюлозная маска с морской водой, с 3D гиалуроновой кислотой, морскими водорослями и метабиотиком.",
    bullets: [
      "глубоко увлажняет кожу",
      "помогает уменьшить раздражение и шелушение",
      "способствует замедлению фотостарения",
    ],
  },
  {
    id: "skin-harmony",
    title: "Skin Harmony",
    image: { src: product("skin-harmony-biocellulose-facial-mask"), alt: "Skin Harmony" },
    lead: "Биоцеллюлозная маска с морской водой, метабиотиками, церамидами, экстрактами семян моринги и морских водорослей. Бережно восстанавливает «уставшую» кожу, потерявшую тонус.",
    bullets: [
      "оказывает успокаивающий эффект на кожу",
      "способствует улучшению текстуры и выравниванию тона кожи",
      "защищает кожу от стрессовых факторов окружающей среды",
    ],
  },
];

const COLLAGEN_SLIDES: ProductSlide[] = [
  {
    id: "promarine-peptides",
    title: "Промарин Пептиды Коллагена",
    image: { src: product("promarine-collagen"), alt: "Промарин Пептиды Коллагена" },
    lead: "Морской коллаген в пептидной форме для максимального усвоения. Поддержка молодости кожи, здоровья суставов и связок.",
  },
  {
    id: "promarine-tripeptides",
    title: "Промарин Трипептиды Коллагена",
    image: { src: product("promarine-collagen-tripeptides-pack"), alt: "Промарин Трипептиды Коллагена" },
    lead: "Следующий шаг эволюции биодобавок коллагена. Меньше молекула — больше результат. Молекула трипептидов в 600 раз меньше молекулы коллагена и в 4 раза меньше молекулы пептида коллагена. Именно благодаря размеру молекул MAXICOLLAGEN легче усваивается, что позволяет быстрее добиться гладкой, упругой и увлажнённой кожи, а также улучшить качество волос и ногтей.",
  },
];

const HYDRAMAX_SLIDES: ProductSlide[] = [
  {
    id: "hydramax",
    title: "Гидрамакс",
    image: { src: asset("/images/products/hydramax.png"), alt: "Гидрамакс" },
    lead: "Гидрамакс — набор для оптимальной гидратации организма:",
    bullets: [
      "комплекс микро- и макроэлементов улучшает физиологическую полноценность воды и поддерживает баланс минералов, участвующих в работе всех органов и систем;",
      "антиоксиданты защищают клетки от окислительного разрушения и преждевременного старения;",
      "жизненно важные электролиты регулируют водно-солевой баланс, поддерживая нормальный обмен веществ и выносливость организма.",
    ],
  },
  {
    id: "hydramax-plus",
    title: "Гидрамакс Плюс",
    image: { src: product("hydramax-plus"), alt: "Гидрамакс Плюс" },
    lead: "Расширенная версия программы «Гидрамакс» направлена на обеспечение организма необходимыми макро- и микроэлементами, витаминами-антиоксидантами, что играет ключевую роль в поддержании минерального баланса, оптимальной гидратации и общего самочувствия.",
    extra:
      "Дополнительный компонент — Оушенмин, концентрат глубоководных морских минералов во главе с магнием. Богатый природный минеральный состав продукта помогает уменьшить усталость, раздражительность, ускорить восстановление и повысить энергетику, что особенно важно при высоких умственных и физических нагрузках.",
  },
];

const NAV = [
  ["#why", "Почему система работает"],
  ["#products", "Продукты"],
  ["#masks", "Маски"],
  ["#collagen", "Коллаген"],
  ["#hydramax", "Гидрамакс"],
  ["#consultation", "Консультация"],
] as const;

export default function LandingPage() {
  const cards = getProductCards(CARD_SLUGS);

  return (
    <div className="appShell">
      <LeadModalProvider>
        <main className={styles.page}>
          <SiteHeader />

          <Section tone="surface" className={styles.hero}>
            <Container>
              <div className={styles.heroInner}>
                <Heading className={styles.heroTitle}>Ваша система красоты</Heading>
                <p className={styles.heroBody}>
                  Откройте для себя уникальную философию красоты и здоровья от Coral Club. Гармония внутреннего
                  состояния и внешнего ухода — ваш путь к естественному сиянию и долголетию.
                </p>
                <LandingCta source="hero" className={styles.cta}>
                  Записаться на бесплатную консультацию нутрициолога
                </LandingCta>
                <div className={styles.heroMedia}>
                  <Image
                    src={img("hero-beauty-system.jpg")}
                    alt="Маски, коллаген и Гидрамакс Coral Club"
                    fill
                    priority
                    sizes="(max-width: 1023px) 100vw, 520px"
                  />
                </div>
              </div>
            </Container>
          </Section>

          <Section tone="default" id="why" className={styles.section}>
            <Container>
              <Heading as="h2" className={styles.h2}>
                Почему наша система работает
              </Heading>
              <p className={styles.lead}>
                Мы создаём продукты, которые работают изнутри и снаружи, обеспечивая вам комплексный подход к
                красоте и здоровью.
              </p>
            </Container>
          </Section>

          <Section tone="default" className={styles.promoSection}>
            <Container>
              <div className={styles.promo}>
                <p className={styles.promoText}>
                  Получите специальную скидку по промокоду <PromoCode code={PROMO} className={styles.promoCode} /> на
                  продукты Системы Красоты
                </p>
              </div>
            </Container>
          </Section>

          <Section tone="default" id="products" className={styles.section}>
            <Container>
              <LandingCards cards={cards} hrefBase={BEAUTY_HREF} />
            </Container>
          </Section>

          <Section tone="surface" id="masks" className={styles.section}>
            <Container>
              <div className={styles.block}>
                <div className={styles.blockMedia}>
                  <Image src={img("masks.jpg")} alt="Три вида масок Coral Club" fill sizes="(max-width: 1023px) 100vw, 480px" />
                </div>
                <div className={styles.blockBody}>
                  <Heading as="h2" className={styles.h2}>
                    Сияние и восстановление кожи
                  </Heading>
                  <ProductSlider slides={MASK_SLIDES} />
                </div>
              </div>
            </Container>
          </Section>

          <Section tone="default" id="collagen" className={styles.section}>
            <Container>
              <div className={styles.block}>
                <div className={styles.blockMedia}>
                  <Image src={img("collagen.jpg")} alt="Пептидный и трипептидный коллаген" fill sizes="(max-width: 1023px) 100vw, 480px" />
                </div>
                <div className={styles.blockBody}>
                  <Heading as="h2" className={styles.h2}>
                    Коллаген — это белок молодости.
                  </Heading>
                  <ProductSlider slides={COLLAGEN_SLIDES} />
                </div>
              </div>
            </Container>
          </Section>

          <Section tone="surface" id="hydramax" className={styles.section}>
            <Container>
              <div className={styles.block}>
                <div className={styles.blockMedia}>
                  <Image src={img("hydramax.jpg")} alt="Гидрамакс и Гидрамакс Плюс" fill sizes="(max-width: 1023px) 100vw, 480px" />
                </div>
                <div className={styles.blockBody}>
                  <Heading as="h2" className={styles.h2}>
                    Глубокая гидратация на клеточном уровне
                  </Heading>
                  <ProductSlider slides={HYDRAMAX_SLIDES} />
                </div>
              </div>
            </Container>
          </Section>

          <Section tone="default" id="consultation" className={styles.section}>
            <Container>
              <div className={styles.consult}>
                <h2 className={styles.consultTitle}>Не знаете, с чего начать? Запишитесь на бесплатную консультацию нутрициолога</h2>
                <p className={styles.consultText}>
                  Оставьте заявку для подбора персонального консультанта прямо сейчас и откройте мир красоты и
                  здоровья Coral Club!
                </p>
                <LandingCta source="consultation" className={styles.consultCta}>
                  Оставить заявку на бесплатную консультацию
                </LandingCta>
              </div>
            </Container>
          </Section>

          <footer className={styles.footer}>
            <Container>
              <div className={styles.footerBrand}>coralclub</div>
              <nav className={styles.footerNav} aria-label="Навигация по странице">
                {NAV.map(([href, label]) => (
                  <a key={href} href={href}>
                    {label}
                  </a>
                ))}
              </nav>
              <p className={styles.footerNote}>
                БАД. Не является лекарственным средством. Перед применением проконсультируйтесь со специалистом.
              </p>
            </Container>
          </footer>

          <TabBar />
        </main>
      </LeadModalProvider>
    </div>
  );
}
