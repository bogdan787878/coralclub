import { BADGES } from "@/components/organisms";
import { asset } from "@/lib/asset";
import styles from "./LargeDietaryBadges.module.css";

export type LargeDietaryBadgesProps = { items: string[] };

/**
 * LargeDietaryBadges — DietaryBadges' /alt counterpart: the same icons and
 * labels, as large pill chips instead of a plain inline list, matching the
 * market pattern of prominent Sugar Free / Soy Free style labels.
 */
export function LargeDietaryBadges({ items }: LargeDietaryBadgesProps) {
  const badges = items.map((slug) => BADGES[slug]).filter((b): b is { icon: string; label: string } => Boolean(b));
  if (!badges.length) return null;

  return (
    <ul className={styles.list}>
      {badges.map((b) => (
        <li className={styles.badge} key={b.icon}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.icon} src={asset(`/images/badges/${b.icon}.svg`)} alt="" width={20} height={20} />
          <span className={styles.label}>{b.label}</span>
        </li>
      ))}
    </ul>
  );
}
