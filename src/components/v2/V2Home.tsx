"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Accent,
  Accordion,
  AccordionItem,
  Button,
  Container,
  Heading,
  Section,
} from "@/components/ui";
import {
  AdvisoryBoard,
  Hero,
  SiteFooter,
  SiteHeader,
  TabBar,
} from "@/components/organisms";
import type { AdvisoryBoardProps, HeroImage } from "@/components/organisms";
import { addItem, setQty, useCart } from "@/lib/cart";
import type { V2Pack, V2Sku } from "@/lib/v2Hydration";
import styles from "./V2Home.module.css";

export type V2HomeProps = {
  hero: HeroImage;
  pack: V2Pack;
  skus: V2Sku[];
  advisory: AdvisoryBoardProps;
};

const QUIZ_HREF = "/quiz";
const FDA =
  "These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.";

function useQty() {
  const cart = useCart();
  return (coralId?: string) =>
    coralId ? (cart.find((l) => l.coralId === coralId)?.qty ?? 0) : 0;
}

/** Add button that turns into a − / + stepper once the line is in the cart. */
function AddControl({
  coralId,
  slug,
  name,
  price,
  image,
  qty,
  label = "Add to cart",
  block = false,
}: {
  coralId?: string;
  slug: string;
  name: string;
  price: string;
  image: string;
  qty: number;
  label?: string;
  block?: boolean;
}) {
  if (!coralId) return null;
  if (qty > 0) {
    return (
      <div
        className={`${styles.stepper}${block ? ` ${styles.stepperBlock}` : ""}`}
        role="group"
        aria-label={`${name} quantity`}
      >
        <button
          type="button"
          className={styles.stepBtn}
          aria-label={`Remove one ${name}`}
          onClick={() => setQty(coralId, qty - 1)}
        >
          −
        </button>
        <span className={styles.stepQty} aria-live="polite">
          {qty} in cart
        </span>
        <button
          type="button"
          className={styles.stepBtn}
          aria-label={`Add one more ${name}`}
          onClick={() => setQty(coralId, qty + 1)}
        >
          +
        </button>
      </div>
    );
  }
  return (
    <Button
      variant="primary"
      block={block}
      className={styles.addBtn}
      onClick={() => addItem({ coralId, slug, name, price, image })}
    >
      {label}
    </Button>
  );
}

function PackBlock({ pack }: { pack: V2Pack }) {
  const qtyOf = useQty();
  return (
    <Section id="hydration" tone="default" className={styles.section}>
      <Container>
        <p className={styles.eyebrow}>Start here</p>
        <Heading as="h2" className={styles.h2}>
          Not sure where to start? <Accent>Take the 30-day set.</Accent>
        </Heading>
        <p className={styles.lead}>
          Your first month of hydration in one box — four products, quantities
          listed, nothing to compare.
        </p>

        <div className={styles.pack}>
          <Link
            href={pack.href}
            className={styles.packMedia}
            aria-label={pack.name}
          >
            {pack.image && (
              <Image
                src={pack.image}
                alt={`${pack.name} — the 30-day hydration set`}
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                className={styles.packImg}
              />
            )}
          </Link>

          <div className={styles.packBody}>
            <h3 className={styles.h3}>{pack.name}</h3>

            <ul className={styles.parts} aria-label="What's in the set">
              {pack.parts.map((p) => (
                <li key={p.slug}>
                  <span className={styles.partQty}>×{p.qty}</span>
                  <span>
                    <strong>{p.name}</strong>
                    <span className={styles.partLine}> — {p.line}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className={styles.priceBlock}>
              <div className={styles.priceRow}>
                <span className={styles.price}>{pack.club}</span>
                <span className={styles.was}>{pack.regular}</span>
              </div>
              <p className={styles.perDay}>
                {pack.perDay} a day for {pack.days} days
              </p>
              <p className={styles.save}>
                {pack.saving} less than buying the four separately (
                {pack.separateTotal} at member prices).
              </p>
            </div>

            <div className={styles.packActions}>
              <AddControl
                coralId={pack.coralId}
                slug={pack.slug}
                name={pack.name}
                price={pack.club}
                image={pack.cartImage}
                qty={qtyOf(pack.coralId)}
                label={`Add the 30-day set · ${pack.club}`}
                block
              />
              <Link href={pack.href} className={styles.textLink}>
                See what&rsquo;s inside
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function SkuCard({ sku }: { sku: V2Sku }) {
  const qtyOf = useQty();
  return (
    <li className={styles.sku}>
      <Link href={sku.href} className={styles.skuMedia} aria-label={sku.name}>
        {sku.image && (
          <Image
            src={sku.image}
            alt={sku.name}
            fill
            sizes="(min-width: 1024px) 22vw, 120px"
            className={styles.skuImg}
          />
        )}
        {sku.topSeller && <span className={styles.badge}>Best seller</span>}
      </Link>

      <div className={styles.skuBody}>
        <p className={styles.role}>{sku.role}</p>
        <h3 className={styles.skuName}>
          <Link href={sku.href}>{sku.name}</Link>
        </h3>
        <p className={styles.skuLine}>{sku.line}</p>
        <p className={styles.facts}>{sku.facts}</p>
        <p className={styles.origin}>Made in {sku.origin}</p>

        <div className={styles.skuBuy}>
          <div className={styles.priceRow}>
            <span className={styles.priceSm}>{sku.club}</span>
            <span className={styles.was}>{sku.regular}</span>
          </div>
          <AddControl
            coralId={sku.coralId}
            slug={sku.slug}
            name={sku.name}
            price={sku.club}
            image={sku.image}
            qty={qtyOf(sku.coralId)}
            label="Add"
          />
        </div>
      </div>
    </li>
  );
}

const STEPS = [
  {
    n: "1",
    title: "Tear a sachet into 1.5 L of water",
    text: "Tap or bottled — a jug on the counter is enough.",
  },
  {
    n: "2",
    title: "Wait five minutes",
    text: "That is the whole preparation.",
  },
  {
    n: "3",
    title: "Sip through the day",
    text: "Nothing else to track, no schedule to keep.",
  },
];

const COMPARE = [
  {
    row: "Steps each day",
    shelf: "Several products at several moments",
    glass: "One sachet in your water, then the day goes on",
  },
  {
    row: "Deciding what to buy",
    shelf: "Dozens of options and no shared plan",
    glass: "One set with four named parts and quantities listed",
  },
  {
    row: "Knowing the cost",
    shelf: "Add it up bottle by bottle",
    glass: "One price, and what it comes to per day",
  },
  {
    row: "Where it leads",
    shelf: "Each product stands alone",
    glass: "Step one of a three-phase routine",
  },
];

export function V2Home({ hero, pack, skus, advisory }: V2HomeProps) {
  return (
    <main className={styles.page}>
      <SiteHeader />

      {/* 1 · one-liner: what it is + the job + the value in criteria */}
      <Hero
        title={
          <>
            Your daily water, <Accent>mineral-rich</Accent> in five minutes
          </>
        }
        body={
          <p>
            One sachet turns 1.5 L of drinking water into mineral water. It is
            the first step of the Coral Club routine.
          </p>
        }
        image={hero}
        cta={{ label: "Shop hydration", href: "#hydration" }}
      />

      {/* 4 · value in concrete criteria, not adjectives */}
      <Section tone="default" className={styles.strip}>
        <Container>
          <ul className={styles.stripGrid}>
            <li>
              <p className={styles.stripBig}>5 minutes</p>
              <p className={styles.stripText}>
                One sachet in 1.5 L of water, then wait. That is the whole
                routine.
              </p>
            </li>
            <li>
              <p className={styles.stripBig}>Calcium, magnesium, vitamin C</p>
              <p className={styles.stripText}>
                Per sachet: 356 mg calcium, 15 mg magnesium, 5 mg vitamin C — it
                is all on the label.
              </p>
            </li>
            <li>
              <p className={styles.stripBig}>Made in Japan</p>
              <p className={styles.stripText}>
                Minerals from coral formations in the Sea of Japan near Okinawa
                and Tokunoshima.
              </p>
            </li>
          </ul>
        </Container>
      </Section>

      {/* 9 · named product + first step (the pack), then the parts */}
      <PackBlock pack={pack} />

      <Section tone="default" className={`${styles.section} ${styles.alt}`}>
        <Container>
          <Heading as="h2" className={styles.h2}>
            Or one at a time
          </Heading>
          <p className={styles.lead}>
            Coral-Mine is the foundation. The other three are separate layers
            you can add when you want them.
          </p>
          <ul className={styles.skuGrid}>
            {skus.map((s) => (
              <SkuCard key={s.slug} sku={s} />
            ))}
          </ul>
          <p className={styles.quizRow}>
            Not sure which?{" "}
            <Link href={QUIZ_HREF} className={styles.textLink}>
              Take the 60-second quiz
            </Link>
          </p>
        </Container>
      </Section>

      {/* 5 · how the job is performed */}
      <Section tone="default" className={styles.section}>
        <Container>
          <Heading as="h2" className={styles.h2}>
            Your morning, <Accent>in three steps</Accent>
          </Heading>
          <ol className={styles.steps}>
            {STEPS.map((s) => (
              <li key={s.n}>
                <span className={styles.stepNum} aria-hidden="true">
                  {s.n}
                </span>
                <div>
                  <p className={styles.stepTitle}>{s.title}</p>
                  <p className={styles.stepText}>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className={styles.note}>
            Electrolytes such as potassium, magnesium, sodium and calcium are
            part of how the body keeps its fluid balance.*
          </p>
        </Container>
      </Section>

      {/* 6 · the current solution, fired by the same criteria */}
      <Section tone="default" className={`${styles.section} ${styles.alt}`}>
        <Container>
          <Heading as="h2" className={styles.h2}>
            A shelf of supplements, <Accent>or one glass</Accent>
          </Heading>
          <div className={styles.compare} role="table" aria-label="Comparison">
            <div className={`${styles.cRow} ${styles.cHead}`} role="row">
              <span role="columnheader" />
              <span role="columnheader">A shelf of separate products</span>
              <span role="columnheader">One glass of mineral water</span>
            </div>
            {COMPARE.map((c) => (
              <div key={c.row} className={styles.cRow} role="row">
                <span className={styles.cLabel} role="rowheader">
                  {c.row}
                </span>
                <span role="cell" data-col="A shelf">
                  {c.shelf}
                </span>
                <span role="cell" data-col="One glass" className={styles.cWin}>
                  {c.glass}
                </span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* trust: who stands behind it */}
      <AdvisoryBoard {...advisory} />

      {/* 8 · where it leads — one step of three, nothing to decide today */}
      <Section tone="default" className={styles.section}>
        <Container>
          <p className={styles.eyebrow}>Step 1 of 3</p>
          <Heading as="h2" className={styles.h2}>
            Hydration comes first.{" "}
            <Accent>Nothing else to decide today.</Accent>
          </Heading>
          <ul className={styles.phases} aria-label="The three phases">
            <li className={styles.phaseOn}>Hydration · now</li>
            <li>Restart · later</li>
            <li>Personalization · later</li>
          </ul>
          <Link href="/" className={styles.textLink}>
            See the whole routine
          </Link>
        </Container>
      </Section>

      {/* 7 · specific fears, answered with facts only */}
      <Section tone="default" className={`${styles.section} ${styles.alt}`}>
        <Container>
          <Heading as="h2" className={styles.h2}>
            Good questions
          </Heading>
          <Accordion>
            <AccordionItem title="How do I take Coral-Mine?" name="faq">
              Put one sachet into 1.5 L (1.58 qt) of drinking water, then wait
              five minutes before drinking. Store the remaining sachets in a dry
              place.
            </AccordionItem>
            <AccordionItem title="Do I need all four products?" name="faq">
              No. Coral-Mine is the foundation; PentoKan, Oceanmin and H-500 are
              separate layers. The 30-day set bundles all four with quantities
              listed, and each one can also be bought alone.
            </AccordionItem>
            <AccordionItem title="Where is it made?" name="faq">
              Coral-Mine in Japan, Oceanmin in Taiwan, PentoKan in Germany and
              H-500 in the USA. The full ingredient list and supplement facts
              are on every product page.
            </AccordionItem>
            <AccordionItem title="What is the member price?" name="faq">
              Coral Club members pay the lower price shown. The struck-through
              number is the regular price.
            </AccordionItem>
            <AccordionItem
              title="Who should check with a doctor first?"
              name="faq"
            >
              If you are pregnant or nursing, or you take medication, consult
              your healthcare practitioner before using any supplement.
            </AccordionItem>
          </Accordion>
          <p className={styles.fda}>* {FDA}</p>
        </Container>
      </Section>

      {/* 9 · closing call to action */}
      <Section tone="primary" className={styles.final}>
        <Container className={styles.finalInner}>
          <Heading as="h2" className={styles.finalTitle}>
            Start with <Accent>a glass of water</Accent>
          </Heading>
          <div className={styles.finalActions}>
            <Button variant="secondary" href="#hydration">
              Start with the 30-day set
            </Button>
            <Link href={QUIZ_HREF} className={styles.finalLink}>
              or take the 60-second quiz
            </Link>
          </div>
        </Container>
      </Section>

      <SiteFooter />
      <TabBar revealAfterId="hydration" />
    </main>
  );
}
