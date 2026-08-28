"use client";

import { useId, useState } from "react";
import styles from "./PriceSelector.module.css";

export type PriceSelectorOption = {
  id: string;
  label: string;
  note?: string;
  price: string;
};

export type PriceSelectorProps = {
  options: PriceSelectorOption[];
  /** Controlled selection. Omit to let the component manage it. */
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
};

/**
 * PriceSelector — radio group of price tiers (Club vs Regular).
 * Works controlled (`value`) or uncontrolled; reports picks via `onChange`.
 */
export function PriceSelector({
  options,
  value,
  defaultValue,
  onChange,
}: PriceSelectorProps) {
  const name = useId();
  const [internal, setInternal] = useState(defaultValue ?? options[0]?.id);
  const selected = value ?? internal;

  const select = (id: string) => {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  };

  return (
    <div className={styles.root} role="radiogroup" aria-label="Price">
      {options.map((opt) => {
        const isSelected = opt.id === selected;
        return (
          <label
            key={opt.id}
            className={`${styles.option} ${isSelected ? styles.selected : ""}`}
          >
            <input
              className={styles.input}
              type="radio"
              name={name}
              value={opt.id}
              checked={isSelected}
              onChange={() => select(opt.id)}
            />
            <span className={styles.label}>
              <span className={styles.name}>{opt.label}</span>
              {opt.note && <span className={styles.note}>{opt.note}</span>}
            </span>
            <span className={styles.right}>
              <span className={styles.price}>{opt.price}</span>
              <span className={styles.radio} aria-hidden="true" />
            </span>
          </label>
        );
      })}
    </div>
  );
}
