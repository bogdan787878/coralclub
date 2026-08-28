import Image from "next/image";
import styles from "./PhaseSwitcher.module.css";

export type PhaseTab = {
  id: string;
  index: number;
  name: string;
  image?: { src: string; alt: string };
};

export type PhaseSwitcherProps = {
  phases: PhaseTab[];
  value: string;
  onChange: (id: string) => void;
  /** Accessible name for the group. */
  label?: string;
};

/**
 * PhaseSwitcher — a row of circular tabs (one per Health Concept phase).
 * Presentational + controlled: it reports the picked id through `onChange`.
 */
export function PhaseSwitcher({
  phases,
  value,
  onChange,
  label = "Choose a phase",
}: PhaseSwitcherProps) {
  return (
    <div className={styles.root} role="tablist" aria-label={label}>
      {phases.map((phase) => {
        const selected = phase.id === value;
        return (
          <button
            key={phase.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={styles.tab}
            onClick={() => onChange(phase.id)}
          >
            <span className={styles.circle}>
              {phase.image && (
                <Image
                  src={phase.image.src}
                  alt={phase.image.alt}
                  fill
                  sizes="(max-width: 767px) 33vw, 180px"
                />
              )}
            </span>
            <span className={styles.label}>
              <span className={styles.phase}>Phase {phase.index}</span>
              <span className={styles.name}>{phase.name}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
