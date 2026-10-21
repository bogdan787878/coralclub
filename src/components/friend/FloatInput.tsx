"use client";

import { useId } from "react";
import co from "../landing/LandingCheckout.module.css";
import styles from "./FriendCheckout.module.css";

/** Text input with its label inside the field (floats up on focus / value). */
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
}) {
  const id = useId();
  return (
    <div className={`${co.float} ${shake ? co.shake : ""}`} data-field={name}>
      <div
        className={`${co.floatBox} ${attention ? co.floatBoxActive : ""} ${error ? styles.errorBox : ""}`}
      >
        <input
          id={id}
          className={co.floatInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? " "}
          inputMode={inputMode}
          autoComplete={autoComplete}
          maxLength={maxLength}
        />
        <label htmlFor={id} className={co.floatLabel}>
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
