import type { ReactNode } from "react";
import Image from "next/image";
import { Accent, Container, Section } from "@/components/ui";
import styles from "./Editorial.module.css";

type Tone = "default" | "surface" | "primary";

export type EditorialImage = {
  src: string;
  alt: string;
  /** object-position for the cover crop. */
  position?: string;
};

export type EditorialProps = {
  /** sans lead + Newton-italic accent, on separate lines. */
  title: { lead: string; accent: string };
  image: EditorialImage;
  body: ReactNode;
  tone?: Tone;
  /** Optional frosted tag pinned to the image's top-left corner. */
  badge?: ReactNode;
};

/**
 * Editorial — a statement block: heading (sans + Newton-italic accent),
 * a framed image and supporting body copy.
 */
export function Editorial({
  title,
  image,
  body,
  tone = "surface",
  badge,
}: EditorialProps) {
  return (
    <Section tone={tone}>
      <Container>
        <div className={styles.inner}>
          <div className={styles.media}>
            {badge && <span className={styles.badge}>{badge}</span>}
            {image.src ? (
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 480px) 100vw, 480px"
                style={
                  image.position
                    ? { objectPosition: image.position }
                    : undefined
                }
              />
            ) : (
              <span className={styles.placeholder} aria-hidden="true" />
            )}
          </div>

          <h2 className={styles.title}>
            {title.lead}
            <br />
            <Accent>{title.accent}</Accent>
          </h2>

          <div className={styles.body}>{body}</div>
        </div>
      </Container>
    </Section>
  );
}
