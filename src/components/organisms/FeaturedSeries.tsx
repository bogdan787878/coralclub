import Image from "next/image";
import { Accent, Button, Container, Heading, Section } from "@/components/ui";
import styles from "./FeaturedSeries.module.css";

export type SeriesImage = {
  /** Omit to render a placeholder tile until the asset is added. */
  src?: string;
  alt: string;
  position?: string;
};

export type FeaturedSeriesProps = {
  /** sans lead + Newton-italic accent, on separate lines. */
  title: { lead: string; accent: string };
  /** Large image at the top of the panel. */
  feature: SeriesImage;
  /** Supporting thumbnails below the feature. */
  items: SeriesImage[];
  cta: { label: string; href: string };
};

function Tile({
  image,
  className,
  sizes,
  priority,
}: {
  image: SeriesImage;
  className: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <div className={`${styles.tile} ${className}`}>
      {image.src ? (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          style={image.position ? { objectPosition: image.position } : undefined}
        />
      ) : (
        <span className={styles.placeholder} aria-hidden="true" />
      )}
    </div>
  );
}

/**
 * FeaturedSeries — a dark slate panel spotlighting one product series:
 * heading, a feature image, a row of supporting thumbnails and a CTA.
 * Missing images fall back to placeholder tiles.
 */
export function FeaturedSeries({
  title,
  feature,
  items,
  cta,
}: FeaturedSeriesProps) {
  return (
    <Section tone="surface">
      <Container>
        <div className={styles.panel}>
          <Heading as="h2" className={styles.title}>
            {title.lead}
            <br />
            <Accent>{title.accent}</Accent>
          </Heading>

          <Tile
            image={feature}
            className={styles.feature}
            sizes="(max-width: 480px) 100vw, 480px"
          />

          <div className={styles.grid}>
            {items.map((item, i) => (
              <Tile
                key={i}
                image={item}
                className={styles.thumb}
                sizes="(max-width: 480px) 50vw, 240px"
              />
            ))}
          </div>

          <Button
            variant="primary"
            block
            href={cta.href}
            className={styles.cta}
          >
            {cta.label}
          </Button>
        </div>
      </Container>
    </Section>
  );
}
