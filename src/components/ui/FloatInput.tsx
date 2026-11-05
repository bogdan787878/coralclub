"use client";

import { useId } from "react";
import styles from "./FloatInput.module.css";

/**
 * FloatInput: text input with its label inside the field (floats up on focus / value).
 * Единый компонент UI kit; раньше лежал в friend/ и брал стили из чужих модулей.
 */
export function FloatInput({
  label,
  value,
  onChange,
  placeholder,
  attention,
  inputMode,
  autoComplete,
  name,
  shake,
  hint,
  error,
  maxLength,
  type,
}: {
  name?: string;
  shake?: boolean;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  attention?: boolean;
  inputMode?: "text" | "tel" | "email" | "numeric";
  autoComplete?: string;
  /** a short line under the field (what is wrong / what to type) */
  hint?: string;
  /** the value failed validation: red border and a red hint */
  error?: boolean;
  maxLength?: number;
  type?: "text" | "tel" | "email" | "password" | "search";
}) {
  const id = useId();
  return (
    <div className={`${styles.float} ${shake ? styles.shake : ""}`} data-field={name}>
      <div
        className={`${styles.floatBox} ${attention ? styles.floatBoxActive : ""} ${error ? styles.errorBox : ""}`}
      >
        <input
          id={id}
          className={styles.floatInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? " "}
          inputMode={inputMode}
          autoComplete={autoComplete}
          maxLength={maxLength}
          type={type}
        />
        <label htmlFor={id} className={styles.floatLabel}>
          {label}
        </label>
      </div>
      {hint && (
        <p
          className={`${styles.floatHint} ${error ? styles.floatHintError : ""}`}
          role={error ? "alert" : undefined}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
