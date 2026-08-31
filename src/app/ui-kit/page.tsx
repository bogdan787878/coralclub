import type { Metadata } from "next";
import {
  Accent,
  Accordion,
  AccordionItem,
  BodyLong,
  Button,
  Container,
  Heading,
  Rating,
  Section,
  Stack,
} from "@/components/ui";
import { Carousel, PriceSelector, ProductCard } from "@/components/organisms";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "UI-KIT — Coral Club",
  description: "Design tokens and base components",
};

const COLORS = [
  { name: "Primary 100", value: "#011130", token: "--color-primary-100" },
  { name: "Primary 30", value: "#C6D6ED", token: "--color-primary-30" },
  { name: "Primary 10", value: "#E3ECFA", token: "--color-primary-10" },
];

const SPACING = [
  { name: "gap-text", px: 16, token: "--gap-text" },
  { name: "gap-base", px: 24, token: "--gap-base" },
  { name: "page-padding-inline", px: 16, token: "--page-padding-inline" },
  { name: "page-padding-block", px: 32, token: "--page-padding-block" },
];

const RADII = [
  { name: "radius-sm", px: 8, token: "--radius-sm" },
  { name: "radius-md", px: 12, token: "--radius-md" },
  { name: "radius-base", px: 32, token: "--radius-base" },
  { name: "radius-pill", px: 999, token: "--radius-pill" },
];

export default function UiKitPage() {
  return (
    <main className={styles.page}>
      {/* Header */}
      <Section tone="primary">
        <Container>
          <Stack gap="text">
            <p className={styles.kicker}>Coral Club · Design System</p>
            <Heading style={{ color: "var(--color-text-on-primary)" }}>
              UI-KIT
            </Heading>
            <BodyLong style={{ color: "var(--color-text-on-primary)" }}>
              Mobile-first foundation. Typography set in{" "}
              <Accent>Suisse Intl</Accent> with <Accent>Newton Italic</Accent> for
              editorial accents.
            </BodyLong>
          </Stack>
        </Container>
      </Section>

      {/* Colors */}
      <Section>
        <Container>
          <Stack gap="base">
            <Stack gap="text">
              <p className={styles.kicker}>01 — Color</p>
              <Heading as="h2">Palette</Heading>
            </Stack>
            <div className={styles.swatchGrid}>
              {COLORS.map((c) => (
                <div key={c.token} className={styles.swatch}>
                  <span
                    className={styles.swatchChip}
                    style={{ background: c.value }}
                  />
                  <span className={styles.swatchMeta}>
                    <span className={styles.swatchName}>{c.name}</span>
                    <span className={styles.mono}>{c.value}</span>
                    <span className={styles.mono}>var({c.token})</span>
                  </span>
                </div>
              ))}
            </div>
          </Stack>
        </Container>
      </Section>

      {/* Typography */}
      <Section tone="surface">
        <Container>
          <Stack gap="base">
            <Stack gap="text">
              <p className={styles.kicker}>02 — Typography</p>
              <Heading as="h2">Type scale</Heading>
            </Stack>

            <div className={styles.specimen}>
              <span className={styles.mono}>H1 · 40 / 44 · -2% · Suisse Intl</span>
              <Heading as="p">Живи в ритме своего тела</Heading>
            </div>

            <div className={styles.specimen}>
              <span className={styles.mono}>H2 · 28 / 32 · -2% · Suisse Intl</span>
              <Heading as="h2">Живи в ритме своего тела</Heading>
            </div>

            <div className={styles.specimen}>
              <span className={styles.mono}>Body long · 14 / 20 · Suisse Intl</span>
              <BodyLong>
                Программы для гидратации, детокса и ежедневного питания. Подберите
                набор под свою цель и получайте результат без лишних решений —
                система подскажет следующий шаг.
              </BodyLong>
            </div>

            <div className={styles.specimen}>
              <span className={styles.mono}>Accent · Newton · italic</span>
              <BodyLong>
                <Accent style={{ fontSize: "1.25rem" }}>
                  «Здоровье — это не цель, а способ жить»
                </Accent>
              </BodyLong>
            </div>

            <div className={styles.specimen}>
              <span className={styles.mono}>Button · 16 / 24 · Suisse Intl</span>
              <span style={{ font: "var(--text-button-weight) var(--text-button-size)/var(--text-button-line) var(--font-sans)" }}>
                Добавить в корзину
              </span>
            </div>
          </Stack>
        </Container>
      </Section>

      {/* Spacing */}
      <Section>
        <Container>
          <Stack gap="base">
            <Stack gap="text">
              <p className={styles.kicker}>03 — Spacing</p>
              <Heading as="h2">Scale</Heading>
            </Stack>
            <Stack gap="text">
              {SPACING.map((s) => (
                <div key={s.token} className={styles.spaceRow}>
                  <span
                    className={styles.spaceBar}
                    style={{ width: `${s.px}px` }}
                  />
                  <span className={styles.mono}>
                    {s.name} · {s.px}px · var({s.token})
                  </span>
                </div>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Section>

      {/* Radius */}
      <Section>
        <Container>
          <Stack gap="base">
            <Stack gap="text">
              <p className={styles.kicker}>04 — Radius</p>
              <Heading as="h2">Corner radius</Heading>
              <BodyLong muted>
                <code className={styles.mono}>--radius-base</code> = 32 — the
                default for cards, media and the hero panel.
              </BodyLong>
            </Stack>
            <div className={styles.radiusGrid}>
              {RADII.map((r) => (
                <div key={r.token} className={styles.radiusItem}>
                  <span
                    className={styles.radiusChip}
                    style={{ borderRadius: `var(${r.token})` }}
                  />
                  <span className={styles.mono}>
                    {r.name} · {r.px === 999 ? "999 (pill)" : `${r.px}px`}
                  </span>
                </div>
              ))}
            </div>
          </Stack>
        </Container>
      </Section>

      {/* Buttons */}
      <Section tone="surface">
        <Container>
          <Stack gap="base">
            <Stack gap="text">
              <p className={styles.kicker}>05 — Components</p>
              <Heading as="h2">Button</Heading>
              <BodyLong muted>
                Renders as <code className={styles.mono}>&lt;a&gt;</code> when{" "}
                <code className={styles.mono}>href</code> is set — for the auth and
                add-to-cart redirects to the external store.
              </BodyLong>
            </Stack>
            <div className={styles.buttonRow}>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>
            <Button variant="primary" block href="#redirect">
              В корзину →
            </Button>
          </Stack>
        </Container>
      </Section>

      {/* Organisms */}
      <Section>
        <Container>
          <Stack gap="text">
            <p className={styles.kicker}>06 — Organisms</p>
            <Heading as="h2">Product card</Heading>
            <BodyLong muted>
              The whole card links to the product page; the CTA is independent.
            </BodyLong>
          </Stack>
        </Container>
        <Container style={{ paddingBlock: "var(--gap-base)" }}>
          <ProductCard
            title="Minerals in every glass"
            price="$475.99"
            href="/products/coral-mine-silver"
            cta={{ label: "Shop" }}
          />
        </Container>
        <Carousel label="Hydration Series sample">
          {[
            { t: "Minerals in every glass", s: "coral-mine-silver" },
            { t: "Deep-sea magnesium", s: "oceanmin" },
            { t: "Daily antioxidant boost", s: "h-500" },
          ].map(({ t, s }) => (
            <ProductCard
              key={s}
              title={t}
              price="$475.99"
              href={`/products/${s}`}
              cta={{ label: "Shop" }}
            />
          ))}
        </Carousel>
      </Section>

      {/* Rating + Price selector */}
      <Section tone="surface">
        <Container>
          <Stack gap="base">
            <Stack gap="text">
              <p className={styles.kicker}>07 — Rating &amp; price</p>
              <Heading as="h2">Rating &amp; PriceSelector</Heading>
            </Stack>
            <Rating value={3.4} ratingsCount={25} reviewsCount={12} />
            <PriceSelector
              options={[
                { id: "club", label: "Club Price", note: "25% Savings", price: "$475.99" },
                { id: "regular", label: "Regular Price", price: "$875" },
              ]}
            />
          </Stack>
        </Container>
      </Section>

      {/* Accordion */}
      <Section>
        <Container>
          <Stack gap="base">
            <Stack gap="text">
              <p className={styles.kicker}>08 — Accordion</p>
              <Heading as="h2">Accordion</Heading>
            </Stack>
            <Accordion>
              <AccordionItem title="How to Use" defaultOpen>
                <p>
                  Add one sachet to 1.5 L of water and let it dissolve. Drink
                  through the day.
                </p>
              </AccordionItem>
              <AccordionItem title="Manufacturing details">
                <p>Made in Japan. GMP · HACCP · ISO certified.</p>
              </AccordionItem>
              <AccordionItem title="Shipping &amp; returns">
                <p>Delivery in 24–48h from a local warehouse. 30-day guarantee.</p>
              </AccordionItem>
            </Accordion>
          </Stack>
        </Container>
      </Section>
    </main>
  );
}
