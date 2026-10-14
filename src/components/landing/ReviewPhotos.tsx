"use client";

import { useState } from "react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import { PhotoViewer } from "./PhotoViewer";
import styles from "./Reviews.module.css";

/**
 * ReviewPhotos — the photos attached to a review. `tiles` (PDP) shows big
 * square tiles in a row, the last visible one carrying "+N" when there are
 * more; `thumbs` (landing cards) shows small previews. Any photo opens the
 * full-screen player on that picture.
 */
export function ReviewPhotos({
  photos,
  variant = "tiles",
  visible = 3,
}: {
  photos: string[];
  variant?: "tiles" | "thumbs";
  visible?: number;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const urls = photos.map((p) => asset(p));

  const isTiles = variant === "tiles";
  const hidden = isTiles ? Math.max(0, photos.length - visible) : 0;
  const shown = isTiles && hidden > 0 ? photos.slice(0, visible) : photos;

  return (
    <>
      <ul className={isTiles ? styles.bigPhotos : styles.photos}>
        {shown.map((src, i) => {
          const isMore = hidden > 0 && i === visible - 1;
          return (
            <li key={src} className={isTiles ? styles.bigPhotoItem : undefined}>
              <button
                type="button"
                className={isTiles ? styles.bigPhoto : styles.photo}
                onClick={() => setOpen(i)}
                aria-label={
                  isMore
                    ? `Открыть фото, ещё ${hidden}`
                    : `Открыть фото ${i + 1} из ${photos.length}`
                }
              >
                <Image
                  src={asset(src)}
                  alt=""
                  fill
                  sizes={isTiles ? "(max-width: 767px) 33vw, 280px" : "96px"}
                  style={{ objectFit: "cover" }}
                />
                {isMore && (
                  <span className={styles.bigPhotoMore}>+{hidden}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {open !== null && (
        <PhotoViewer photos={urls} start={open} onClose={() => setOpen(null)} />
      )}
    </>
  );
}
