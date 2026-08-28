import type { ReactNode } from "react";
import Image from "next/image";
import { BodyLong, Button, Container, Heading, Stack } from "@/components/ui";
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
};

/**
 * Hero — a panel whose background is the product photo, with white copy and
 * the primary call to action over it. Uses the base corner radius on the
 * bottom edge. Pair it with <SiteHeader /> above.
 */
export function Hero({ title, body, image, cta }: HeroProps) {
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

      <Container className={styles.content}>
        <Stack gap="text" className={styles.copy}>
          <Heading className={styles.title}>{title}</Heading>
          <BodyLong className={styles.body}>{body}</BodyLong>
        </Stack>

        <Button variant="primary" href={cta.href} className={styles.cta}>
          {cta.label}
        </Button>
      </Container>
    </section>
  );
}
