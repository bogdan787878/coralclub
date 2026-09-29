"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { SupplementFacts } from "@/lib/products";
import styles from "./AltGallery.module.css";

export type GallerySlide =
  | { kind: "image"; src: string; alt: string }
  | { kind: "info"; kicker: string; title: string; body: string }
  | { kind: "composition"; title: string; facts: SupplementFacts };

export type AltGalleryProps = {
  images: { src: string; alt: string }[];
  /** Extra body copy pulled from the product (e.g. fullDescription) — shown
   *  as its own designed slide instead of scrolled text below the fold. */
  infoBlocks: { kicker: string; title: string; body: string }[];
  /** Rendered as a dedicated "composition" slide when present. */
  supplementFacts?: SupplementFacts;
  sizes?: string;
};

/**
 * AltGallery — ImageSlider's /alt counterpart: the product photos plus the
 * body-copy info blocks and the ingredient list, all as swipeable gallery
 * slides instead of separate accordions below the fold — the market
 * pattern of putting everything worth knowing inside the gallery itself.
 */
export function AltGallery({ images, infoBlocks, supplementFacts, sizes = "100vw" }: AltGalleryProps) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const slides: GallerySlide[] = [
    ...images.map((img) => ({ kind: "image" as const, src: img.src, alt: img.alt })),
    ...infoBlocks.map((b) => ({ kind: "info" as const, ...b })),
    ...(supplementFacts?.rows.length
      ? [{ kind: "composition" as const, title: "What's inside", facts: supplementFacts }]
      : []),
  ];

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (!slides.length) return <span aria-hidden="true" />;

  return (
    <div className={styles.root}>
      <div className={styles.track} ref={trackRef} onScroll={onScroll}>
        {slides.map((slide, i) => {
          if (slide.kind === "image") {
            return (
              <div className={styles.slide} key={i}>
                <div className={styles.imageSlide}>
                  <Image src={slide.src} alt={slide.alt} fill sizes={sizes} priority={i === 0} loading={i === 0 ? undefined : "lazy"} />
                </div>
              </div>
            );
          }
          if (slide.kind === "info") {
            return (
              <div className={styles.slide} key={i}>
                <div className={styles.card}>
                  <span className={styles.cardKicker}>{slide.kicker}</span>
                  <h3 className={styles.cardTitle}>{slide.title}</h3>
                  <p className={styles.cardBody}>{slide.body}</p>
                </div>
              </div>
            );
          }
          return (
            <div className={styles.slide} key={i}>
              <div className={styles.card}>
                <span className={styles.cardKicker}>Composition</span>
                <h3 className={styles.cardTitle}>{slide.title}</h3>
                <ul className={styles.factList}>
                  {slide.facts.rows.slice(0, 6).map((r) => (
                    <li className={styles.factRow} key={r.name}>
                      <span className={styles.factName}>{r.name}</span>
                      <span className={styles.factAmount}>{r.amount}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {slides.length > 1 && (
        <span className={styles.dots} aria-hidden="true">
          {slides.map((_, i) => (
            <span key={i} className={`${styles.dot} ${i === active ? styles.dotOn : ""}`} />
          ))}
        </span>
      )}
    </div>
  );
}
