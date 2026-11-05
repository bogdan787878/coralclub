import type { ReactNode } from "react";
import styles from "./Consent.module.css";

/**
 * Consent: a checkbox with its text (terms, personal data …). `attention`
 * outlines a skipped required box, `shake` makes it shake once; `name` is the
 * `data-field` the form scrolls to.
 */
export function Consent({
  checked,
  onChange,
  children,
  name,
  shake,
  attention,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  name?: string;
  shake?: boolean;
  attention?: boolean;
}) {
  return (
    <label
      className={[
        styles.check,
        shake ? styles.shake : "",
        attention ? styles.checkActive : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-field={name}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{children}</span>
    </label>
  );
}
