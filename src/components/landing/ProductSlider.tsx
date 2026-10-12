"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import styles from "./ProductSlider.module.css";

export type ProductSlide = {
  id: string;
  title: string;
  image: { src: string; alt: string };
  lead: string;
  bullets?: string[];
  extra?: string;
};

/**
 * ProductSlider — one product per slide (image + name + description),
 * scroll-snap with dots. Used for the masks / collagen / Hydramax blocks,
 * where the ТЗ asks for a separate slide per product.
 */
export function ProductSlider({ slides }: { slides: ProductSlide[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  const go = (i: number) => {
    const el = trackRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className={styles.root}>
      <ul className={styles.track} ref={trackRef} onScroll={onScroll}>
        {slides.map((s) => (
          <li className={styles.slide} key={s.id}>
            <div className={styles.media}>
              <Image src={s.image.src} alt={s.image.alt} fill sizes="(max-width: 768px) 100vw, 420px" />
            </div>
            <h3 className={styles.name}>{s.title}</h3>
            <p className={styles.lead}>{s.lead}</p>
            {s.bullets && (
              <ul className={styles.bullets}>
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
            {s.extra && <p className={styles.lead}>{s.extra}</p>}
          </li>
        ))}
      </ul>

      {slides.length > 1 && (
        <div className={styles.dots} role="tablist" aria-label="Слайды">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={s.title}
              className={`${styles.dot}${i === active ? ` ${styles.dotOn}` : ""}`}
              onClick={() => go(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
