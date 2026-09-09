"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import styles from "./ImageSlider.module.css";

export type SliderImage = {
  src: string;
  alt: string;
  /** object-position for framing. */
  position?: string;
};

export type ImageSliderProps = {
  images: SliderImage[];
  /** next/image `sizes`. */
  sizes?: string;
  /** object-fit for the packshots. Default "contain". */
  fit?: "contain" | "cover";
  /** Preload the first frame (only when the slider is above the fold). */
  priority?: boolean;
};

/**
 * ImageSlider — a swipe-only image pager. No arrows: you swipe the track and
 * the dots show position. Fills its (positioned) parent.
 */
export function ImageSlider({
  images,
  sizes = "100vw",
  fit = "contain",
  priority = false,
}: ImageSliderProps) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const multi = images.length > 1;

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (!images.length) {
    return <span className={styles.empty} aria-hidden="true" />;
  }

  return (
    <div className={styles.root}>
      <div
        className={styles.track}
        ref={trackRef}
        onScroll={multi ? onScroll : undefined}
      >
        {images.map((img, i) => (
          <div className={styles.slide} key={i}>
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes={sizes}
              priority={priority && i === 0}
              loading={priority && i === 0 ? undefined : "lazy"}
              style={{
                objectFit: fit,
                ...(img.position ? { objectPosition: img.position } : {}),
              }}
            />
          </div>
        ))}
      </div>

      {multi && (
        <span className={styles.dots} aria-hidden="true">
          {images.map((_, i) => (
            <span
              key={i}
              className={`${styles.dot} ${i === active ? styles.dotOn : ""}`}
            />
          ))}
        </span>
      )}
    </div>
  );
}
