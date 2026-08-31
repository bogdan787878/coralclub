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
};

/**
 * Editorial — a statement block: heading (sans + Newton-italic accent),
 * a framed image and supporting body copy.
 */
export function Editorial({ title, image, body, tone = "surface" }: EditorialProps) {
  return (
    <Section tone={tone}>
      <Container>
        <div className={styles.inner}>
          <h2 className={styles.title}>
            {title.lead}
            <br />
            <Accent>{title.accent}</Accent>
          </h2>

          <div className={styles.media}>
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 480px) 100vw, 480px"
              style={
                image.position ? { objectPosition: image.position } : undefined
              }
            />
          </div>

          <div className={styles.body}>{body}</div>
        </div>
      </Container>
    </Section>
  );
}
