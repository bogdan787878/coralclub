import Image from "next/image";
import { Button } from "@/components/ui";
import styles from "./AltHero.module.css";

export type AltHeroProps = {
  kicker: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  image: { src: string; alt: string };
};

/**
 * AltHero — /alt homepage promo: a full lifestyle photo (not a product
 * packshot) with a dark scrim for legibility, a benefit-led headline, and
 * a primary + optional secondary CTA. Catches up to the market pattern of
 * "lifestyle shot + benefit copy" instead of a product-first hero.
 */
export function AltHero({ kicker, title, body, cta, secondaryCta, image }: AltHeroProps) {
  return (
    <section className={styles.panel}>
      <Image
        className={styles.bg}
        src={image.src}
        alt={image.alt}
        fill
        priority
        sizes="100vw"
      />
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.content}>
        <span className={styles.kicker}>{kicker}</span>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.body}>{body}</p>
        <div className={styles.ctaRow}>
          <Button href={cta.href} className={styles.cta}>
            {cta.label}
          </Button>
          {secondaryCta && (
            <Button href={secondaryCta.href} variant="ghost" className={styles.secondaryCta}>
              {secondaryCta.label}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
