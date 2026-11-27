"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Carousel } from "@/components/organisms/Carousel";
import { RU_BASE } from "@/lib/ru/shop";
import { loadRuBanners, type RuBanner } from "@/lib/ru/live";
import styles from "./Ru.module.css";

/**
 * «Акции» главной: по нажатию — каталог с акционными товарами (/catalog/?sale=1). Баннеры сайта России (тот же список, что в слайдере coralclub.ru, из API 2.0 /home),
 * вертикальными карточками в карусели; одна акция — карточка на всю ширину. Пока список не пришёл — серые
 * заглушки; пустой — блока нет.
 */
export function RuPromo({ title }: { title?: ReactNode } = {}) {
  const [banners, setBanners] = useState<RuBanner[] | null>(null);
  useEffect(() => {
    let alive = true;
    loadRuBanners().then((b) => alive && setBanners(b));
    return () => {
      alive = false;
    };
  }, []);
  if (banners && !banners.length) return null;
  // одна акция — карточка на всю ширину, баннер сайта целиком (16:9)
  const single = banners?.length === 1;

  return (
    <Carousel
      label="Акции"
      title={title}
      itemWidth={single ? "100%" : "var(--ru-promo-w)"}
      maxCols={single ? 1 : 4}
      minCols={single ? 1 : 3}
    >
      {(banners ?? [null, null]).map((b, i) =>
        b ? (
          <Link key={b.href + i} className={`${styles.promo} ${single ? styles.promoWide : ""}`} href={`${RU_BASE}/catalog/?sale=1`} data-analytics-id="promo_banner">
            <span className={styles.promoMedia}>
              {/* eslint-disable-next-line @next/next/no-img-element -- баннер с сайта магазина, внешний адрес */}
              <img src={b.image} alt="" loading={i > 1 ? "lazy" : undefined} />
              {b.logo && (
                // eslint-disable-next-line @next/next/no-img-element -- логотип акции с сайта магазина
                <img className={styles.promoLogo} src={b.logo} alt="" />
              )}
            </span>
            <span className={styles.promoTitle}>{b.title}</span>
          </Link>
        ) : (
          <span key={i} className={styles.promo} aria-hidden="true">
            <span className={`${styles.promoMedia} ${styles.promoSkeleton}`} />
          </span>
        ),
      )}
    </Carousel>
  );
}
