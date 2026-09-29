import type { DomainContent } from "@/lib/products";
import styles from "./GoalNav.module.css";

export type GoalNavProps = { domains: DomainContent[] };

/**
 * GoalNav — sticky pill row navigating the catalog by goal (Energy, Sleep,
 * Weight & Metabolism…), the market pattern of shopping by outcome instead
 * of by product category. Jumps to the matching section further down.
 */
export function GoalNav({ domains }: GoalNavProps) {
  return (
    <nav className={styles.wrap} aria-label="Shop by goal">
      <div className={styles.track}>
        {domains.map((d) => (
          <a key={d.id} href={`#${d.id}`} className={styles.chip}>
            {d.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
