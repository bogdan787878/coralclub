"use client";

import { useState } from "react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import styles from "./Reviews.module.css";

/**
 * ReviewPhotos — the photos attached to a review, big tiles in a row. When a
 * review has more than `visible`, the last visible tile shows "+N" and opens
 * the rest in place. Each photo opens in full size in a new tab.
 */
export function ReviewPhotos({
  photos,
  visible = 3,
}: {
  photos: string[];
  visible?: number;
}) {
  const [all, setAll] = useState(false);
  const hidden = Math.max(0, photos.length - visible);
  const shown = all || hidden === 0 ? photos : photos.slice(0, visible);

  return (
    <ul className={styles.bigPhotos}>
      {shown.map((src, i) => {
        const isMore = !all && hidden > 0 && i === visible - 1;
        return (
          <li key={src} className={styles.bigPhotoItem}>
            {isMore ? (
              <button
                type="button"
                className={styles.bigPhoto}
                onClick={() => setAll(true)}
                aria-label={`Показать ещё ${hidden} фото`}
              >
                <Image
                  src={asset(src)}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 33vw, 280px"
                  style={{ objectFit: "cover" }}
                />
                <span className={styles.bigPhotoMore}>+{hidden}</span>
              </button>
            ) : (
              <a
                href={asset(src)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.bigPhoto}
                aria-label={`Фото ${i + 1} из отзыва`}
              >
                <Image
                  src={asset(src)}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 33vw, 280px"
                  style={{ objectFit: "cover" }}
                />
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
