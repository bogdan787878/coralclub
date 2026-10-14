"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageSlider, type SliderImage } from "@/components/organisms";
import { ShareButton } from "../../app/(shop)/products/[slug]/ShareButton";
// the frame itself is the shop PDP's — same classes, same look
import shop from "../../app/(shop)/products/[slug]/page.module.css";
import styles from "./LandingGallery.module.css";

/**
 * LandingGallery — the PDP image block. Mobile is the shop's own full-bleed
 * swipe slider; on desktop a strip of thumbnails sits to the left of the
 * picture (click one to jump to that image).
 */
export function LandingGallery({
  images,
  title,
  fit = "contain",
}: {
  images: SliderImage[];
  title: string;
  fit?: "contain" | "cover";
}) {
  const [active, setActive] = useState(0);
  const multi = images.length > 1;

  return (
    <div className={styles.gallery}>
      {multi && (
        <ul className={styles.thumbs} aria-label="Фотографии товара">
          {images.map((img, i) => (
            <li key={img.src}>
              <button
                type="button"
                className={`${styles.thumb}${i === active ? ` ${styles.thumbOn}` : ""}`}
                onClick={() => setActive(i)}
                aria-label={`Фото ${i + 1} из ${images.length}`}
                aria-current={i === active}
              >
                <Image
                  src={img.src}
                  alt=""
                  fill
                  sizes="72px"
                  style={{ objectFit: fit }}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={`${shop.media} ${styles.frame}`}>
        <div className={shop.mediaInner}>
          <ImageSlider
            images={images}
            sizes="(max-width: 1023px) 100vw, 400px"
            fit={fit}
            priority
            lightDots
            activeIndex={active}
            onActiveChange={setActive}
          />
        </div>
        {/* desktop only — replaces the floating share button */}
        <ShareButton
          className={`${shop.circleBtn} ${shop.mediaShare}`}
          title={title}
        />
      </div>
    </div>
  );
}
