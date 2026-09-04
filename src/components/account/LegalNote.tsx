import styles from "./LegalNote.module.css";

/** Shared consent footnote for both account screens. Links are placeholders. */
export function LegalNote() {
  return (
    <p className={styles.legal}>
      By continuing, I confirm that I am over 18 years old and agree to the{" "}
      <a href="#registration-rules">Registration Rules</a>,{" "}
      <a href="#terms">Terms of Use of coralclub</a>, and the{" "}
      <a href="#privacy">Personal Data Processing Policy</a>.
    </p>
  );
}
