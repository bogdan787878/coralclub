"use client";

import { Icon } from "@/components/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./PhotoViewer.module.css";

/**
 * PhotoViewer — a full-screen photo player for a review's pictures: prev /
 * next arrows, a counter, a thumbnail strip, keyboard (← → Esc) and swipe.
 */
export function PhotoViewer({
  photos,
  start = 0,
  onClose,
}: {
  photos: string[];
  start?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(start);
  const touchX = useRef<number | null>(null);
  const count = photos.length;

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + count) % count),
    [count],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [go, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Фото из отзыва"
    >
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Закрыть"
        onClick={onClose}
      />

      <div className={styles.top}>
        <span className={styles.counter}>
          {index + 1} / {count}
        </span>
        <button
          type="button"
          className={styles.close}
          aria-label="Закрыть"
          onClick={onClose}
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      <div
        className={styles.stage}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photos[index]}
          className={styles.image}
          src={photos[index]}
          alt=""
        />
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            className={`${styles.arrow} ${styles.prev}`}
            aria-label="Предыдущее фото"
            onClick={() => go(-1)}
          >
            <Icon name="back" size={22} />
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.next}`}
            aria-label="Следующее фото"
            onClick={() => go(1)}
          >
            <Icon name="next" size={22} />
          </button>

          <ul className={styles.strip}>
            {photos.map((src, i) => (
              <li key={src}>
                <button
                  type="button"
                  className={`${styles.thumb}${i === index ? ` ${styles.thumbOn}` : ""}`}
                  aria-label={`Фото ${i + 1}`}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>,
    document.body,
  );
}
