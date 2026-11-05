"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { COUNTRY_EN, type CountryLabels } from "./labels";
import styles from "./CountryMenu.module.css";

/** «FR» → 🇫🇷 */
export const flagEmoji = (code: string): string =>
  [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");

/**
 * The country of the order as a flag in the header; a click opens the list of
 * countries (with a search when it is long). The shop prices delivery and
 * payment by the country, so the choice is the page's, not a form field's.
 */
export function CountryMenu({
  countries,
  value,
  onChange,
  labels,
}: {
  countries: Record<string, string>;
  value: string;
  onChange: (code: string) => void;
  /** the words of the menu (English by default) */
  labels?: Partial<CountryLabels>;
}) {
  const t: CountryLabels = { ...COUNTRY_EN, ...labels };
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const entries = useMemo(
    () => Object.entries(countries).sort((a, b) => a[1].localeCompare(b[1])),
    [countries],
  );
  const q = query.trim().toLowerCase();
  // names that start with what was typed come first
  const shown = q
    ? entries
        .filter(([, name]) => name.toLowerCase().includes(q))
        .sort(
          (a, b) =>
            Number(b[1].toLowerCase().startsWith(q)) -
            Number(a[1].toLowerCase().startsWith(q)),
        )
    : entries;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (code: string) => {
    setOpen(false);
    setQuery("");
    onChange(code);
  };

  return (
    <div className={styles.root} ref={root}>
      <button
        type="button"
        className={styles.flagBtn}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        aria-label={t.aria(countries[value] ?? value)}
        data-analytics-id="header_country"
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">{flagEmoji(value)}</span>
      </button>
      {open && (
        <div className={styles.panel} id={`${id}-panel`}>
          {entries.length > 8 && (
            <input
              className={styles.search}
              type="search"
              placeholder={t.search}
              aria-label={t.search}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && shown[0]) {
                  e.preventDefault();
                  pick(shown[0][0]);
                }
              }}
            />
          )}
          {shown.length === 0 ? (
            <p className={styles.empty}>{t.empty}</p>
          ) : (
            <ul className={styles.list} role="listbox" aria-label={t.list}>
              {shown.map(([code, name]) => (
                <li key={code} role="option" aria-selected={code === value}>
                  <button
                    type="button"
                    className={`${styles.option} ${code === value ? styles.optionOn : ""}`}
                    onClick={() => pick(code)}
                  >
                    <span className={styles.optionFlag} aria-hidden="true">
                      {flagEmoji(code)}
                    </span>
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
