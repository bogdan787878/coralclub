import Image from "next/image";
import { Heading } from "@/components/ui";
import { asset } from "@/lib/asset";
import type { LandingReview } from "@/lib/landingReviewsRu";
import { ReviewPhotos } from "./ReviewPhotos";
import { ReviewText } from "./ReviewText";
import styles from "./Reviews.module.css";

function Stars({ value }: { value: number }) {
  return (
    <span
      className={styles.stars}
      role="img"
      aria-label={`Оценка ${value} из 5`}
    >
      {"★".repeat(value)}
      <span className={styles.starsOff}>{"★".repeat(5 - value)}</span>
    </span>
  );
}

/** The big rating + review count, as on the source page. */
export function RatingSummary({
  rating,
  count,
  caption,
}: {
  rating: number;
  count: number;
  /** Small line under the count, e.g. "по отзывам на Отзовике". */
  caption?: string;
}) {
  return (
    <div className={styles.summary}>
      <span className={styles.summaryStar} aria-hidden="true">
        ★
      </span>
      <span className={styles.summaryScore}>{rating.toFixed(1)}</span>
      <span className={styles.summaryMeta}>
        <span>
          Отзывов: <b>{count}</b>
        </span>
        {caption && <span className={styles.summaryCaption}>{caption}</span>}
      </span>
    </div>
  );
}

function ReviewCard({
  review,
  productName,
}: {
  review: LandingReview;
  productName?: string;
}) {
  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <Stars value={review.rating} />
        <span className={styles.date}>{review.date}</span>
      </div>
      {productName && <span className={styles.product}>{productName}</span>}
      <h3 className={styles.reviewTitle}>{review.title}</h3>
      <ReviewText text={review.text} clamp />
      {review.plus && (
        <p className={styles.plus}>
          <b>Достоинства:</b> {review.plus}
        </p>
      )}
      {review.minus && (
        <p className={styles.minus}>
          <b>Недостатки:</b> {review.minus}
        </p>
      )}
      {review.photos.length > 0 && (
        <ul className={styles.photos}>
          {review.photos.map((src, i) => (
            <li key={src}>
              <a
                href={asset(src)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.photo}
                aria-label={`Фото ${i + 1} из отзыва`}
              >
                <Image
                  src={asset(src)}
                  alt=""
                  fill
                  sizes="96px"
                  style={{ objectFit: "cover" }}
                />
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.foot}>
        <span className={styles.author}>{review.author}</span>
        <a
          className={styles.source}
          href={review.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          Отзыв на Отзовике
        </a>
      </div>
    </li>
  );
}

function initials(name: string) {
  const parts = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}

/** A review as a row of a list: who / when on the left, the review on the
 *  right, photos as big tiles under the text. */
function ReviewRow({
  review,
  productName,
}: {
  review: LandingReview;
  productName?: string;
}) {
  return (
    <li className={styles.row}>
      <div className={styles.rowWho}>
        <span className={styles.avatar} aria-hidden="true">
          {initials(review.author)}
        </span>
        <div className={styles.rowWhoText}>
          <span className={styles.author}>{review.author}</span>
          <span className={styles.date}>{review.date}</span>
          <Stars value={review.rating} />
        </div>
      </div>
      <div className={styles.rowBody}>
        {productName && <span className={styles.product}>{productName}</span>}
        <h3 className={styles.reviewTitle}>{review.title}</h3>
        <ReviewText text={review.text} />
        {review.plus && (
          <p className={styles.plus}>
            <b>Достоинства:</b> {review.plus}
          </p>
        )}
        {review.minus && (
          <p className={styles.minus}>
            <b>Недостатки:</b> {review.minus}
          </p>
        )}
        {review.photos.length > 0 && <ReviewPhotos photos={review.photos} />}
        <a
          className={styles.source}
          href={review.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          Отзыв на Отзовике
        </a>
      </div>
    </li>
  );
}

/**
 * Reviews — review cards exactly as they appear on Отзовик: title, text,
 * "Достоинства", "Недостатки", attached photos, author and date, with a link
 * to the full review at the source.
 */
export function Reviews({
  title,
  items,
  summary,
  productNames,
  moreHref,
  moreLabel = "Читать все отзывы на Отзовике",
  variant = "cards",
  showNote = true,
}: {
  title: string;
  items: LandingReview[];
  summary?: { rating: number; count: number; caption?: string };
  /** product slug → name label shown on each card (landing). */
  productNames?: Record<string, string>;
  moreHref?: string;
  moreLabel?: string;
  /** "cards" — a grid of cards (landing); "list" — rows (PDP). */
  variant?: "cards" | "list";
  /** The small "reviews are published unchanged…" line under the list. */
  showNote?: boolean;
}) {
  if (!items.length) return null;

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <Heading as="h2" className={styles.title}>
          {title}
        </Heading>
        {summary && <RatingSummary {...summary} />}
      </div>

      {variant === "list" ? (
        <ul className={styles.rows}>
          {items.map((r) => (
            <ReviewRow
              key={r.id}
              review={r}
              productName={productNames?.[r.product]}
            />
          ))}
        </ul>
      ) : (
        <ul className={styles.list}>
          {items.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              productName={productNames?.[r.product]}
            />
          ))}
        </ul>
      )}

      {moreHref && (
        <a
          className={styles.more}
          href={moreHref}
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          {moreLabel}
        </a>
      )}

      {showNote && (
        <p className={styles.note}>
          Отзывы покупателей с сайта Отзовик, опубликованы без изменений. Мнение
          авторов субъективно, результат зависит от индивидуальных особенностей.
        </p>
      )}
    </div>
  );
}
