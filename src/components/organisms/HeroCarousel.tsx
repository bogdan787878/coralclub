"use client";

import { useEffect, useRef, type UIEvent } from "react";
import { Hero, type HeroProps } from "./Hero";
import styles from "./HeroCarousel.module.css";

export type HeroCarouselProps = {
  /** One hero per phase, in order. */
  slides: Omit<HeroProps, "priority">[];
  /** Index of the phase currently shown. */
  activeIndex: number;
  /** Called when the user swipes / taps to a different phase. */
  onSelect: (index: number) => void;
};

/**
 * HeroCarousel — the per-phase heroes in one native scroll-snap track. Swipe
 * to flip between phases (browser momentum + snap); tapping a dot scrolls
 * there smoothly. Mirrors the ImageSlider pattern used elsewhere.
 */
export function HeroCarousel({ slides, activeIndex, onSelect }: HeroCarouselProps) {
  const track = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

  // keep the track aligned to the active phase (dot tap, phase tab, resize)
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const align = (behavior: ScrollBehavior) => {
      const w = el.clientWidth;
      if (w === 0) return;
      const target = activeIndex * w;
      if (Math.abs(el.scrollLeft - target) < 2) return;
      // mandatory snap can fight a programmatic multi-slide jump — pause it
      el.style.scrollSnapType = "none";
      el.scrollTo({ left: target, behavior });
      window.setTimeout(
        () => {
          el.style.scrollSnapType = "";
        },
        behavior === "smooth" ? 420 : 0,
      );
    };
    align("smooth");
    const onResize = () => align("auto");
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeIndex]);

  useEffect(
    () => () => {
      if (settle.current) clearTimeout(settle.current);
    },
    [],
  );

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.clientWidth === 0) return;
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const i = Math.round(el.scrollLeft / el.clientWidth);
      if (i !== activeIndex && i >= 0 && i < slides.length) onSelect(i);
    }, 90);
  };

  return (
    <div className={styles.viewport}>
      <div
        className={styles.track}
        ref={track}
        onScroll={slides.length > 1 ? onScroll : undefined}
      >
        {slides.map((s, i) => (
          <div className={styles.slide} key={i} aria-hidden={i !== activeIndex}>
            <Hero {...s} priority={i === activeIndex} />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className={styles.dots} role="tablist" aria-label="Phase">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`Phase ${i + 1}`}
              className={`${styles.dot} ${i === activeIndex ? styles.dotOn : ""}`}
              onClick={() => onSelect(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
