import type { ReactNode } from "react";
import Image from "next/image";
import { BodyLong, Button, Container, Heading } from "@/components/ui";
import styles from "./Hero.module.css";

export type HeroImage = {
  /** Shown at >=768px (matches Hero.module.css's breakpoint). */
  desktopSrc: string;
  /** Shown below 768px — pass the same value as desktopSrc when there's
   *  no dedicated mobile crop. */
  mobileSrc: string;
  alt: string;
};

export type HeroProps = {
  title: ReactNode;
  body: ReactNode;
  /** Fills the panel as its background. */
  image: HeroImage;
  cta: { label: string; href: string };
  /** Preload the background image. Off for off-screen carousel slides. */
  priority?: boolean;
  /** Skip mounting the <Image> entirely (off-screen carousel slide, no
   *  interaction yet) — the navy panel + copy still render. */
  renderImage?: boolean;
};

/**
 * Hero — a panel whose background is the product photo, with white copy and
 * the primary call to action over it. Pair it with <SiteHeader /> above.
 * Presentational; <HeroCarousel> stacks these into a swipeable slider.
 */
export function Hero({
  title,
  body,
  image,
  cta,
  priority = true,
  renderImage = true,
}: HeroProps) {
  return (
    <section className={styles.panel}>
      {renderImage && (
        <>
          <Image
            className={`${styles.bg} ${styles.bgMobile}`}
            src={image.mobileSrc}
            alt={image.alt}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes="100vw"
          />
          <Image
            className={`${styles.bg} ${styles.bgDesktop}`}
            src={image.desktopSrc}
            alt={image.alt}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes="100vw"
          />
        </>
      )}

      {/* Progressive blur, top 200px, mobile only (Hero.module.css hides it
          >=768px) — a single backdrop-filter can't vary its own blur radius
          across space, so this stacks a few bands, each blurred a different
          amount and faded in/out at a different depth, to approximate a
          smooth 20px -> 0px falloff. blur is set inline (not in the CSS
          module) because the build's autoprefixer rewrites the standalone
          `backdrop-filter` declaration down to just `-webkit-` and drops
          the unprefixed one, which some browsers need instead. */}
      <div className={styles.topBlur} aria-hidden="true">
        {[20, 14, 8, 3].map((blur, i) => (
          <span
            key={i}
            className={styles.topBlurLayer}
            style={{ backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)` }}
          />
        ))}
      </div>

      <div className={styles.content}>
        <div className={styles.copy}>
          <Container>
            <Heading className={styles.title}>{title}</Heading>
          </Container>
          {/* full width of the panel, 16px side gutters */}
          <BodyLong className={styles.body}>{body}</BodyLong>
        </div>

        <Container>
          <Button
            variant="secondary"
            href={cta.href}
            className={styles.cta}
          >
            {cta.label}
          </Button>
        </Container>
      </div>
    </section>
  );
}
