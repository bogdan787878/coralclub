"use client";

import { useEffect, useState } from "react";
import { Carousel } from "@/components/organisms/Carousel";
import { loadRuBanners, type RuBanner } from "@/lib/ru/live";
import styles from "./Ru.module.css";

/**
 * «Акции» главной: баннеры сайта России (тот же список, что в слайдере coralclub.ru, из API 2.0 /home),
 * вертикальными карточками в карусели. Пока список не пришёл — серые заглушки; пустой — блока нет.
 */
export function RuPromo() {
  const [banners, setBanners] = useState<RuBanner[] | null>(null);
  useEffect(() => {
    let alive = true;
    loadRuBanners().then((b) => alive && setBanners(b));
    return () => {
      alive = false;
    };
  }, []);
  if (banners && !banners.length) return null;

  return (
    <Carousel label="Акции" itemWidth="var(--ru-promo-w)" maxCols={4} minCols={3}>
      {(banners ?? [null, null]).map((b, i) =>
        b ? (
          <a key={b.href + i} className={styles.promo} href={b.href} target="_blank" rel="noopener noreferrer" data-analytics-id="promo_banner">
            <span className={styles.promoMedia}>
              {/* eslint-disable-next-line @next/next/no-img-element -- баннер с сайта магазина, внешний адрес */}
              <img src={b.image} alt="" loading={i > 1 ? "lazy" : undefined} />
              {b.logo && (
                // eslint-disable-next-line @next/next/no-img-element -- логотип акции с сайта магазина
                <img className={styles.promoLogo} src={b.logo} alt="" />
              )}
            </span>
            <span className={styles.promoTitle}>{b.title}</span>
            <span className={styles.promoCta}>{b.button} →</span>
          </a>
        ) : (
          <span key={i} className={styles.promo} aria-hidden="true">
            <span className={`${styles.promoMedia} ${styles.promoSkeleton}`} />
          </span>
        ),
      )}
    </Carousel>
  );
}
