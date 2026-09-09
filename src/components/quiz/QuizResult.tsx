import Link from "next/link";
import { buildSelection, recapLines, type Answers } from "@/lib/quiz";
import { productHref } from "@/lib/catalog";
import styles from "./QuizResult.module.css";

export function QuizResult({ answers }: { answers: Answers }) {
  const products = buildSelection(answers);
  const recap = recapLines(answers);

  return (
    <div className={styles.result}>
      <p className={styles.kicker}>Готово</p>
      <h1 className={styles.title}>Твоя подборка</h1>

      {recap.length > 0 && (
        <div className={styles.recap}>
          <ul>
            {recap.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <ul className={styles.products} role="list">
        {products.map((p) => (
          <li key={p.slug} className={styles.product}>
            <Link href={productHref(p.slug)} className={styles.productLink}>
              <span className={styles.productBody}>
                <span className={styles.productName}>{p.name}</span>
                <span className={styles.productCat}>{p.category}</span>
              </span>
              <span className={styles.productPrice}>
                <span className={styles.now}>{p.prices[0].price}</span>
                <span className={styles.was}>{p.prices[1].price}</span>
              </span>
              <span className={styles.chevron} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className={styles.actions}>
        <Link href="/#phases" className={styles.primary}>
          Смотреть все направления
        </Link>
        <Link href="/" className={styles.secondary}>
          На главную
        </Link>
      </div>
    </div>
  );
}
