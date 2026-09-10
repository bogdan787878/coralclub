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

/** Scalloped-circle clip path, authored in a 0–100 box, scaled to the element. */
function PetalClip() {
  return (
    <svg className={styles.petalDefs} aria-hidden="true" focusable="false">
      <clipPath id="editorialPetal" clipPathUnits="objectBoundingBox">
        <path
          transform="scale(0.01)"
          d="M99.0,50.0C99.0,51.3 95.8,52.9 93.3,53.9C90.8,54.9 85.6,55.3 84.0,56.2C82.3,57.0 82.2,57.7 83.3,59.2C84.4,60.7 88.9,63.3 90.7,65.3C92.5,67.3 94.7,70.1 94.1,71.3C93.6,72.4 90.0,72.5 87.3,72.3C84.6,72.1 79.8,70.2 77.9,70.3C76.0,70.4 75.7,70.9 76.0,72.7C76.4,74.6 79.3,78.8 80.0,81.4C80.8,84.0 81.6,87.5 80.6,88.3C79.5,89.1 76.3,87.6 73.9,86.3C71.6,85.0 68.1,81.2 66.4,80.4C64.6,79.6 64.1,79.9 63.6,81.7C63.1,83.6 63.9,88.7 63.4,91.3C63.0,94.0 62.2,97.5 60.9,97.8C59.6,98.1 57.4,95.3 55.8,93.1C54.3,90.9 52.8,85.9 51.5,84.5C50.3,83.1 49.7,83.1 48.5,84.5C47.2,85.9 45.7,90.9 44.2,93.1C42.6,95.3 40.4,98.1 39.1,97.8C37.8,97.5 37.0,94.0 36.6,91.3C36.1,88.7 36.9,83.6 36.4,81.7C35.9,79.9 35.4,79.6 33.6,80.4C31.9,81.2 28.4,85.0 26.1,86.3C23.7,87.6 20.5,89.1 19.4,88.3C18.4,87.5 19.2,84.0 20.0,81.4C20.7,78.8 23.6,74.6 24.0,72.7C24.3,70.9 24.0,70.4 22.1,70.3C20.2,70.2 15.4,72.1 12.7,72.3C10.0,72.5 6.4,72.4 5.9,71.3C5.3,70.1 7.5,67.3 9.3,65.3C11.1,63.3 15.6,60.7 16.7,59.2C17.8,57.7 17.7,57.0 16.0,56.2C14.4,55.3 9.2,54.9 6.7,53.9C4.2,52.9 1.0,51.3 1.0,50.0C1.0,48.7 4.2,47.1 6.7,46.1C9.2,45.1 14.4,44.7 16.0,43.8C17.7,43.0 17.8,42.3 16.7,40.8C15.6,39.3 11.1,36.7 9.3,34.7C7.5,32.7 5.3,29.9 5.9,28.7C6.4,27.6 10.0,27.5 12.7,27.7C15.4,27.9 20.2,29.8 22.1,29.7C24.0,29.6 24.3,29.1 24.0,27.3C23.6,25.4 20.7,21.2 20.0,18.6C19.2,16.0 18.4,12.5 19.4,11.7C20.5,10.9 23.7,12.4 26.1,13.7C28.4,15.0 31.9,18.8 33.6,19.6C35.4,20.4 35.9,20.1 36.4,18.3C36.9,16.4 36.1,11.3 36.6,8.7C37.0,6.0 37.8,2.5 39.1,2.2C40.4,1.9 42.6,4.7 44.2,6.9C45.7,9.1 47.2,14.1 48.5,15.5C49.7,16.9 50.3,16.9 51.5,15.5C52.8,14.1 54.3,9.1 55.8,6.9C57.4,4.7 59.6,1.9 60.9,2.2C62.2,2.5 63.0,6.0 63.4,8.7C63.9,11.3 63.1,16.4 63.6,18.3C64.1,20.1 64.6,20.4 66.4,19.6C68.1,18.8 71.6,15.0 73.9,13.7C76.3,12.4 79.5,10.9 80.6,11.7C81.6,12.5 80.8,16.0 80.0,18.6C79.3,21.2 76.4,25.4 76.0,27.3C75.7,29.1 76.0,29.6 77.9,29.7C79.8,29.8 84.6,27.9 87.3,27.7C90.0,27.5 93.6,27.6 94.1,28.7C94.7,29.9 92.5,32.7 90.7,34.7C88.9,36.7 84.4,39.3 83.3,40.8C82.2,42.3 82.3,43.0 84.0,43.8C85.6,44.7 90.8,45.1 93.3,46.1C95.8,47.1 99.0,48.7 99.0,50.0Z"
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
        <div className={`${styles.inner}${isPetal ? ` ${styles.petalInner}` : ""}`}>
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
            {isPetal ? (
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
