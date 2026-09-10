import { asset } from "@/lib/asset";
import styles from "./DietaryBadges.module.css";

/** slug → { icon file, display label }. Slugs are what products store. */
const BADGES: Record<string, { icon: string; label: string }> = {
  "gluten-free": { icon: "gluten-free", label: "Gluten-free" },
  "soy-free": { icon: "no-soy", label: "Soy-free" },
  "lactose-free": { icon: "lactose-free", label: "Lactose-free" },
  "contains-lactose": { icon: "contains-lactose", label: "Contains lactose" },
  "plant-capsule": { icon: "plant-based-capsules", label: "Plant-based capsule" },
  "beef-gelatin": { icon: "beef-gelatin", label: "Beef gelatin capsule" },
  "fish-gelatin": { icon: "fish-gelatin", label: "Fish gelatin capsule" },
  vegetarian: { icon: "vegetarian", label: "Vegetarian" },
  pescatarian: { icon: "pescatarian", label: "Pescatarian" },
  halal: { icon: "halal", label: "Halal certified" },
  kosher: { icon: "kosher", label: "Kosher certified" },
};

export type DietaryBadgesProps = {
  /** Badge slugs, in order. */
  items: string[];
};

/**
 * DietaryBadges — a row of dietary / manufacturing badges (gluten-free,
 * soy-free, capsule type, halal…) with the coralclub.us icons, recoloured
 * to navy. Sits under Key Elements on the PDP. Renders nothing when there
 * are no known badges.
 */
export function DietaryBadges({ items }: DietaryBadgesProps) {
  const badges = items
    .map((slug) => BADGES[slug])
    .filter((b): b is { icon: string; label: string } => Boolean(b));
  if (!badges.length) return null;

  return (
    <ul className={styles.list}>
      {badges.map((b) => (
        <li className={styles.badge} key={b.icon}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.icon}
            src={asset(`/images/badges/${b.icon}.svg`)}
            alt=""
            width={28}
            height={28}
          />
          <span className={styles.label}>{b.label}</span>
        </li>
      ))}
    </ul>
  );
}
