"use client";

import { useRef, type ReactNode, type TouchEvent } from "react";
import Image from "next/image";
import { BodyLong, Button, Container, Heading } from "@/components/ui";
import styles from "./Hero.module.css";

export type HeroImage = {
  src: string;
  alt: string;
};

export type HeroNav = {
  /** Total number of phases. */
  count: number;
  /** Index of the phase currently shown. */
  activeIndex: number;
  /** Jump to a phase by index. */
  onSelect: (index: number) => void;
};

export type HeroProps = {
  title: ReactNode;
  body: ReactNode;
  /** Fills the panel as its background. */
  image: HeroImage;
  cta: { label: string; href: string };
  /**
   * When set, a horizontal swipe on the panel moves between phases and dot
   * indicators appear under the CTA.
   */
  nav?: HeroNav;
};

const SWIPE_MIN = 44;

/**
 * Hero — a panel whose background is the product photo, with white copy and
 * the primary call to action over it. Pair it with <SiteHeader /> above.
 * With `nav`, swipe left/right (or tap a dot) to change phase.
 */
export function Hero({ title, body, image, cta, nav }: HeroProps) {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (!nav || !start.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.current.x;
    const dy = t.clientY - start.current.y;
    start.current = null;
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    const next = nav.activeIndex + (dx < 0 ? 1 : -1);
    if (next >= 0 && next < nav.count) nav.onSelect(next);
  };

  return (
    <section
      className={styles.panel}
      onTouchStart={nav ? onTouchStart : undefined}
      onTouchEnd={nav ? onTouchEnd : undefined}
    >
      <Image
        className={styles.bg}
        src={image.src}
        alt={image.alt}
        fill
        priority
        sizes="100vw"
      />

      <div className={styles.content}>
        <div className={styles.copy}>
          <Container>
            <Heading className={styles.title}>{title}</Heading>
          </Container>
          {/* full width of the panel, 16px side gutters */}
          <BodyLong className={styles.body}>{body}</BodyLong>
        </div>

        <Container>
          <Button
            variant="primary"
            block
            href={cta.href}
            className={styles.cta}
          >
            {cta.label}
          </Button>

          {nav && nav.count > 1 && (
            <div className={styles.dots} role="tablist" aria-label="Phase">
              {Array.from({ length: nav.count }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === nav.activeIndex}
                  aria-label={`Phase ${i + 1}`}
                  className={`${styles.dot} ${
                    i === nav.activeIndex ? styles.dotOn : ""
                  }`}
                  onClick={() => nav.onSelect(i)}
                />
              ))}
            </div>
          )}
        </Container>
      </div>
    </section>
  );
}
