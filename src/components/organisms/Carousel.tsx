import { Children, type CSSProperties, type ReactNode } from "react";
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

/**
 * Carousel — horizontal scroll-snap track with a full-bleed viewport.
 * Layout only: no arrows/dots yet, native touch + trackpad scrolling.
 */
export function Carousel({
  title,
  children,
  itemWidth,
  label = "Products",
}: CarouselProps) {
  return (
    <div className={styles.root}>
      {title != null && (
        <div className={styles.head}>
          <Heading as="h2">{title}</Heading>
        </div>
      )}
      <ul
        className={styles.viewport}
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
    </div>
  );
}
