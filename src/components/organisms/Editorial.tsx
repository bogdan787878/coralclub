import type { ReactNode } from "react";
import Image from "next/image";
import { Accent, Container, Section } from "@/components/ui";
import styles from "./Editorial.module.css";

type Tone = "default" | "surface" | "primary";

export type EditorialImage = {
  src: string;
  alt: string;
  /** Intrinsic pixel size — the block shows the whole image at this ratio. */
  width: number;
  height: number;
};

export type EditorialProps = {
  /** sans lead + Newton-italic accent, on separate lines. */
  title: { lead: string; accent: string };
  image: EditorialImage;
  body: ReactNode;
  tone?: Tone;
  /** Optional tag over the image (solid navy pill, bottom-left, slight tilt). */
  badge?: ReactNode;
};

/**
 * Editorial — a statement block: heading (sans + Newton-italic accent),
 * a full-width image (shown whole, its own aspect) and supporting body copy.
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
            {image.src ? (
              <Image
                className={styles.mediaImg}
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                sizes="(max-width: 480px) calc(100vw - 32px), 448px"
              />
            ) : (
              <span className={styles.placeholder} aria-hidden="true" />
            )}
            {badge && <span className={styles.badge}>{badge}</span>}
          </div>

          {/* on mobile just two more flow children (display:contents below
              1024px); on desktop this becomes the text column beside .media */}
          <div className={styles.copy}>
            <h2 className={styles.title}>
              {title.lead}
              <br />
              <Accent>{title.accent}</Accent>
            </h2>

            <div className={styles.body}>{body}</div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
