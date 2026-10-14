import { Heading } from "@/components/ui";
import type { LandingReview } from "@/lib/landingReviewsRu";
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

/**
 * Reviews — word-for-word excerpts from public reviews, each with its
 * author, date, rating and a link to the full text at the source.
 */
export function Reviews({
  title = "Что говорят покупатели",
  items,
  showProduct = true,
}: {
  title?: string;
  items: LandingReview[];
  /** Show the product name above each quote (landing); hide on a PDP. */
  showProduct?: boolean;
}) {
  if (!items.length) return null;

  return (
    <div className={styles.root}>
      <Heading as="h2" className={styles.title}>
        {title}
      </Heading>
      <ul className={styles.list}>
        {items.map((r) => (
          <li key={r.id} className={styles.card}>
            <Stars value={r.rating} />
            {showProduct && (
              <span className={styles.product}>{r.productName}</span>
            )}
            <blockquote className={styles.quote}>«{r.quote}»</blockquote>
            <div className={styles.meta}>
              <span className={styles.author}>{r.author}</span>
              <span className={styles.date}>{r.date}</span>
            </div>
            <a
              className={styles.source}
              href={r.source.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              Читать полностью: {r.source.name}
            </a>
          </li>
        ))}
      </ul>
      <p className={styles.note}>
        Выдержки из публичных отзывов на стороннем сайте, мнение авторов
        субъективно. Результат зависит от индивидуальных особенностей.
      </p>
    </div>
  );
}
