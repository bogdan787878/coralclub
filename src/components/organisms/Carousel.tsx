"use client";

import {
  Children,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Heading } from "@/components/ui";
import styles from "./Carousel.module.css";

export type CarouselProps = {
  /** Optional heading shown above the scroller. */
  title?: ReactNode;
  /** Slides — each child is wrapped in a snap item. */
  children: ReactNode;
  /**
   * Width of one slide (any CSS length). Omit to use the responsive
   * default (148 → 220 → 248 across breakpoints); set it to opt out.
   */
  itemWidth?: string;
  /** Accessible name for the scroll region. */
  label?: string;
};

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Carousel — horizontal scroll-snap track with a full-bleed viewport.
 * Native touch/trackpad scrolling everywhere; on desktop (>=1024px, see
 * Carousel.module.css) a pair of chevron buttons also page the track by
 * click, since there's no swipe gesture with a mouse.
 */
export function Carousel({
  title,
  children,
  itemWidth,
  label = "Products",
}: CarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, []);

  const page = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <div className={styles.root}>
      {title != null && (
        <div className={styles.head}>
          <Heading as="h2">{title}</Heading>
        </div>
      )}

      <div className={styles.scroller}>
        <ul
          className={styles.viewport}
          ref={trackRef}
          onScroll={updateArrows}
          style={
            itemWidth
              ? ({ ["--carousel-item-width"]: itemWidth } as CSSProperties)
              : undefined
          }
          aria-label={label}
          role="list"
        >
          {Children.map(children, (child, i) => (
            <li className={styles.item} key={i}>
              {child}
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowPrev}`}
          onClick={() => page(-1)}
          aria-label="Scroll left"
          disabled={!canPrev}
          tabIndex={canPrev ? 0 : -1}
        >
          <ChevronIcon direction="left" />
        </button>
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowNext}`}
          onClick={() => page(1)}
          aria-label="Scroll right"
          disabled={!canNext}
          tabIndex={canNext ? 0 : -1}
        >
          <ChevronIcon direction="right" />
        </button>
      </div>
    </div>
  );
}
