import styles from "./PhaseSwitcherPills.module.css";

export type PhaseTab = { id: string; name: string };

export type PhaseSwitcherPillsProps = {
  phases: PhaseTab[];
  value: string;
  onChange: (id: string) => void;
  /** Accessible name of the tab list (default English). */
  label?: string;
};

/** Shorter label for the compact pill — everywhere else on the site
 *  still says the phase's real name ("Personalisation"). */
const SHORT_LABEL: Record<string, string> = {
  personalization: "Individual",
};

/**
 * PhaseSwitcherPills — the glass segmented control living over the hero
 * photo (see HeroCarousel), replacing the old circular-thumbnail
 * PhaseSwitcher that used to sit below it in PhasesSection.
 */
export function PhaseSwitcherPills({
  phases,
  value,
  onChange,
  label,
}: PhaseSwitcherPillsProps) {
  return (
    <div
      className={styles.track}
      role="tablist"
      aria-label={label ?? "Choose a phase"}
    >
      {phases.map((phase) => {
        const selected = phase.id === value;
        return (
          <button
            key={phase.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`${styles.tab} ${selected ? styles.tabOn : ""}`}
            onClick={() => onChange(phase.id)}
          >
            {SHORT_LABEL[phase.id] ?? phase.name}
          </button>
        );
      })}
    </div>
  );
}
