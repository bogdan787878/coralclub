"use client";

import { useId, useMemo, useState } from "react";
import co from "../landing/LandingCheckout.module.css";
import styles from "./FriendCheckout.module.css";

/** Lower case, without accents and punctuation: «Thüringen» ~ «thuringen». */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Entries whose name — or any word of it — starts with what was typed. */
function filterStates(
  query: string,
  all: readonly string[],
): readonly string[] {
  const q = norm(query).trim();
  if (!q) return all;
  return all.filter((s) =>
    norm(s)
      .split(" ")
      .some(
        (w, i, all) => w.startsWith(q) || all.slice(i).join(" ").startsWith(q),
      ),
  );
}

/**
 * The region field with search (State, Bundesland): type «New» and the list
 * narrows to the names that start with it. Pick with a click, or with ↑ ↓ and
 * Enter. The value is always a name from the list.
 */
export function StateCombobox({
  options: all,
  label = "State",
  value,
  onChange,
  name,
  shake,
  attention,
  error,
  hint,
}: {
  options: readonly string[];
  label?: string;
  value: string;
  onChange: (state: string) => void;
  name?: string;
  shake?: boolean;
  /** a skipped required field: shown in the active state */
  attention?: boolean;
  /** failed validation: red border, red hint */
  error?: boolean;
  hint?: string;
}) {
  const id = useId();
  const listId = `${id}-list`;
  // what is being typed; null while the field just shows the chosen state
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const options = useMemo(
    () => (query === null ? all : filterStates(query, all)),
    [query, all],
  );
  const shownValue = query ?? value;

  const pick = (state: string) => {
    onChange(state);
    setQuery(null);
    setOpen(false);
  };

  const close = () => {
    // leaving the field: a name typed in full counts, anything else is dropped
    if (query !== null) {
      const exact = all.find((s) => norm(s) === norm(query).trim());
      if (exact) onChange(exact);
    }
    setQuery(null);
    setOpen(false);
  };

  return (
    <div className={`${co.float} ${shake ? co.shake : ""}`} data-field={name}>
      <div
        className={`${co.floatBox} ${styles.combo} ${attention ? co.floatBoxActive : ""} ${error ? styles.errorBox : ""}`}
      >
        <input
          id={id}
          className={`${co.floatInput} ${styles.comboInput}`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && options[active] ? `${id}-o${active}` : undefined
          }
          autoComplete="off"
          autoCapitalize="words"
          spellCheck={false}
          placeholder=" "
          value={shownValue}
          onFocus={() => setOpen(true)}
          onBlur={close}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, options.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              if (open && options[active]) {
                e.preventDefault();
                pick(options[active]);
              }
            } else if (e.key === "Escape") {
              setQuery(null);
              setOpen(false);
            }
          }}
        />
        <label htmlFor={id} className={co.floatLabel}>
          {label}
        </label>
        <svg
          className={styles.comboChevron}
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {open && (
          <ul id={listId} role="listbox" className={styles.comboList}>
            {options.length === 0 ? (
              <li className={styles.comboEmpty}>Nothing found</li>
            ) : (
              options.map((s, i) => (
                <li
                  key={s}
                  id={`${id}-o${i}`}
                  role="option"
                  aria-selected={s === value}
                  className={`${styles.comboOption} ${i === active ? styles.comboActive : ""} ${s === value ? styles.comboChosen : ""}`}
                  // keep the focus in the field, so the click is not a blur first
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(s)}
                >
                  {s}
                </li>
              ))
            )}
          </ul>
        )}
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
