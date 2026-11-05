"use client";

import styles from "./CheckoutExtras.module.css";

export type DeliveryMode = "courier" | "pickup";

/**
 * DeliveryModeSwitch: «home delivery / pick-up» segmented control at the top of
 * the checkout. `data-analytics-id` keeps the ids the analytics already uses.
 */
export function DeliveryModeSwitch({
  value,
  onChange,
  labels = { courier: "Home delivery", pickup: "Pick-up" },
  label = "How to receive your order",
}: {
  value: DeliveryMode;
  onChange: (mode: DeliveryMode) => void;
  labels?: Record<DeliveryMode, string>;
  label?: string;
}) {
  return (
    <div className={styles.switch} role="radiogroup" aria-label={label}>
      {(["courier", "pickup"] as const).map((id) => {
        const on = id === value;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            className={`${styles.switchBtn} ${on ? styles.switchOn : ""}`}
            data-analytics-id={`delivery_mode_${id}`}
            onClick={() => onChange(id)}
          >
            {labels[id]}
          </button>
        );
      })}
    </div>
  );
}
