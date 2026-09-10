import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { Accent, Container, Section } from "@/components/ui";
import styles from "./Editorial.module.css";

type Tone = "default" | "surface" | "primary";

export type EditorialImage = {
  src: string;
  alt: string;
  /** object-position for the cover crop. */
  position?: string;
  /** Blob colour behind the image when shape="petal" (any CSS colour). */
  tint?: string;
};

export type EditorialProps = {
  /** sans lead + Newton-italic accent, on separate lines. */
  title: { lead: string; accent: string };
  image: EditorialImage;
  body: ReactNode;
  tone?: Tone;
  /** Optional frosted tag pinned to the image's top-left corner. */
  badge?: ReactNode;
  /** "band" (default full-bleed strip) or "petal" (clover-clipped, in-column). */
  shape?: "band" | "petal";
};

/** 5-petal flower clip path, authored in a 0–100 box, scaled to the element. */
function PetalClip() {
  return (
    <svg className={styles.petalDefs} aria-hidden="true" focusable="false">
      <clipPath id="editorialPetal" clipPathUnits="objectBoundingBox">
        <path
          transform="scale(0.01)"
          d="M94.9,50.0C94.1,52.3 92.8,54.6 91.2,56.5C89.6,58.4 86.1,59.4 85.4,61.5C84.8,63.6 87.0,66.5 87.2,68.9C87.3,71.4 87.0,74.0 86.3,76.4C85.7,78.8 84.5,81.1 83.1,83.1C81.7,85.1 79.9,87.0 77.9,88.4C75.9,89.9 73.6,91.0 71.3,91.7C68.9,92.5 66.3,92.8 63.9,92.7C61.4,92.6 58.8,92.1 56.5,91.2C54.2,90.3 52.2,87.3 50.0,87.3C47.8,87.3 45.8,90.3 43.5,91.2C41.2,92.1 38.6,92.6 36.1,92.7C33.7,92.8 31.1,92.5 28.7,91.7C26.4,91.0 24.1,89.9 22.1,88.4C20.1,87.0 18.3,85.1 16.9,83.1C15.5,81.1 14.3,78.8 13.7,76.4C13.0,74.0 12.7,71.4 12.8,68.9C13.0,66.5 15.2,63.6 14.6,61.5C13.9,59.4 10.4,58.4 8.8,56.5C7.2,54.6 5.9,52.3 5.1,50.0C4.2,47.7 3.8,45.1 3.7,42.7C3.7,40.2 4.1,37.6 4.8,35.3C5.6,33.0 6.8,30.7 8.3,28.7C9.7,26.8 11.6,25.0 13.7,23.6C15.7,22.2 18.1,21.1 20.5,20.5C22.9,19.9 26.3,21.1 28.1,19.9C29.9,18.6 29.7,14.9 31.1,12.8C32.4,10.7 34.2,8.8 36.1,7.3C38.1,5.8 40.4,4.5 42.7,3.7C45.0,2.9 47.6,2.5 50.0,2.5C52.4,2.5 55.0,2.9 57.3,3.7C59.6,4.5 61.9,5.8 63.9,7.3C65.8,8.8 67.6,10.7 68.9,12.8C70.3,14.9 70.1,18.6 71.9,19.9C73.7,21.1 77.1,19.9 79.5,20.5C81.9,21.1 84.3,22.2 86.3,23.6C88.4,25.0 90.3,26.8 91.7,28.7C93.2,30.7 94.4,33.0 95.2,35.3C95.9,37.6 96.3,40.2 96.3,42.7C96.2,45.1 95.8,47.7 94.9,50.0Z"
        />
      </clipPath>
    </svg>
  );
}

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
  const isPetal = shape === "petal" && Boolean(image.src);
  return (
    <Section tone={tone}>
      <Container>
        <div className={styles.inner}>
          {isPetal ? (
            <div
              className={styles.petal}
              style={
                image.tint
                  ? ({ "--petal-tint": image.tint } as CSSProperties)
                  : undefined
              }
            >
              <PetalClip />
              <span className={styles.petalBlob} aria-hidden="true" />
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className={styles.petalImg}
                sizes="(max-width: 512px) calc(100vw - 32px), 448px"
                style={
                  image.position
                    ? { objectPosition: image.position }
                    : undefined
                }
              />
              {badge && <span className={styles.petalBadge}>{badge}</span>}
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
