import Link from "next/link";
import styles from "./ProtoHeader.module.css";

export type ProtoStep = "pdp" | "cart" | "checkout";

const STEPS: { id: ProtoStep; label: string }[] = [
  { id: "pdp", label: "Товар" },
  { id: "cart", label: "Корзина" },
  { id: "checkout", label: "Оформление" },
];

export type ProtoHeaderProps = { step: ProtoStep };

/**
 * ProtoHeader — a minimal header for the /proto checkout-flow demo. Not the
 * real SiteHeader on purpose: that one's cart icon opens the real USD cart
 * drawer, which would be confusing stacked next to this RUB demo flow.
 */
export function ProtoHeader({ step }: ProtoHeaderProps) {
  return (
    <div className={styles.root}>
      <div className={styles.bar}>
        <Link href="/proto" className={styles.brand}>
          coralclub
        </Link>
        <span className={styles.badge}>Прототип</span>
        <nav className={styles.steps} aria-label="Шаги оформления">
          {STEPS.map((s, i) => (
            <span key={s.id} style={{ display: "contents" }}>
              {i > 0 && <span className={styles.sep}>→</span>}
              <span className={s.id === step ? styles.stepOn : styles.step}>{s.label}</span>
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
}
