import Link from "next/link";
import { buildProtocol, recapLines, type Answers } from "@/lib/quiz";
import { productHref } from "@/lib/products";
import styles from "./QuizResult.module.css";

export function QuizResult({
  answers,
  name,
  email,
}: {
  answers: Answers;
  name: string;
  email: string;
}) {
  const protocol = buildProtocol(answers);
  const recap = recapLines(answers);
  const firstName = name.trim().split(/\s+/)[0];

  return (
    <div className={styles.result}>
      <p className={styles.kicker}>Готово{firstName ? `, ${firstName}` : ""}</p>
      <h1 className={styles.title}>Твой протокол по фазам</h1>
      <p className={styles.lead}>
        Идём сверху вниз: сначала база, потом разгрузка, потом точечная поддержка.
        Разбор и подборку мы также вернём на {email || "твою почту"}.
      </p>

      {recap.length > 0 && (
        <div className={styles.recap}>
          <p className={styles.recapHead}>Что мы поняли про твою задачу</p>
          <ul>
            {recap.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <ol className={styles.phases}>
        {protocol.map((phase) => (
          <li key={phase.id} className={styles.phase}>
            <div className={styles.phaseHead}>
              <span className={styles.phaseNum}>Фаза {phase.index}</span>
              <h2 className={styles.phaseName}>{phase.name}</h2>
            </div>
            <p className={styles.phaseWhy}>{phase.why}</p>

            <ul className={styles.products} role="list">
              {phase.products.map((p) => (
                <li key={p.slug} className={styles.product}>
                  <Link href={productHref(p.slug)} className={styles.productLink}>
                    <span className={styles.productName}>{p.name}</span>
                    <span className={styles.productFor}>{p.title}</span>
                  </Link>
                  <span className={styles.productPrice}>{p.price}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <div className={styles.actions}>
        <a className={styles.primary} href="#open-in-store">
          Открыть подборку в магазине
        </a>
        <Link href="/" className={styles.secondary}>
          На главную
        </Link>
      </div>
    </div>
  );
}
