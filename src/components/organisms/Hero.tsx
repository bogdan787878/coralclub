import type { ReactNode } from "react";
import Image from "next/image";
import { BodyLong, Button, Container, Heading } from "@/components/ui";
import styles from "./Hero.module.css";

export type HeroImage = {
  src: string;
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
        <Image
          className={styles.bg}
          src={image.src}
          alt={image.alt}
          fill
          priority={priority}
          loading={priority ? undefined : "lazy"}
          sizes="100vw"
        />
      )}

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
            variant="primary"
            block
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
