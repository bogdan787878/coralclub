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
  /** Optional tag over the image. */
  badge?: ReactNode;
  /**
   * "band" (default full-bleed strip) or "cutout" (transparent image sized to
   * the column, no background — the image supplies its own shape — with a
   * solid navy tag bottom-left and a single-line heading).
   */
  shape?: "band" | "cutout";
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
  shape = "band",
}: EditorialProps) {
  const isCutout = shape === "cutout" && Boolean(image.src);
  return (
    <Section tone={tone}>
      <Container>
        <div
          className={`${styles.inner}${isCutout ? ` ${styles.cutoutInner}` : ""}`}
        >
          {isCutout ? (
            <div className={styles.cutout}>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className={styles.cutoutImg}
                sizes="(max-width: 512px) calc(100vw - 32px), 448px"
                style={
                  image.position
                    ? { objectPosition: image.position }
                    : undefined
                }
              />
              {badge && <span className={styles.cutoutBadge}>{badge}</span>}
            </div>
          ) : (
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
          )}

          <h2 className={styles.title}>
            {isCutout ? (
              `${title.lead} ${title.accent}`
            ) : (
              <>
                {title.lead}
                <br />
                <Accent>{title.accent}</Accent>
              </>
            )}
          </h2>

          <div className={styles.body}>{body}</div>
        </div>
      </Container>
    </Section>
  );
}
