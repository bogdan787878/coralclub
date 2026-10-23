"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  addressSearchEnabled,
  newSession,
  resolveAddress,
  resolveStreet,
  suggestAddresses,
  type AddressSuggestion,
  type ResolvedAddress,
} from "@/lib/addressSearch";
import co from "../landing/LandingCheckout.module.css";
import styles from "./FriendCheckout.module.css";

/**
 * The Address field with US address suggestions: type a few characters, pick
 * a line, and the form fills in (street, unit, city, state, ZIP). Typing
 * works as a plain field when search is not configured or a request fails.
 */
export function AddressSearch({
  value,
  onChange,
  onPick,
  label = "Address",
  placeholder,
  name,
  shake,
  attention,
  error,
  hint,
  autoComplete = "address-line1",
  country,
}: {
  value: string;
  onChange: (text: string) => void;
  onPick: (a: ResolvedAddress) => void;
  label?: string;
  placeholder?: string;
  name?: string;
  shake?: boolean;
  /** a skipped required field: shown in the active state */
  attention?: boolean;
  error?: boolean;
  hint?: string;
  autoComplete?: string;
  /** ISO code of the country to search in (the market's by default) */
  country?: string;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [items, setItems] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const session = useRef<Promise<unknown> | null>(null);
  const seq = useRef(0);
  // after a street is picked the shopper types the number: the town of that
  // street goes along with the query, so the right street is found
  const anchor = useRef<{ text: string; city: string } | null>(null);

  // suggestions for the text, after a short pause in typing
  useEffect(() => {
    if (!addressSearchEnabled) return;
    if (anchor.current && !value.startsWith(anchor.current.text)) {
      anchor.current = null;
    }
    const waiting = anchor.current?.text === value; // street picked, no number yet
    const q = anchor.current
      ? `${value.trim()}, ${anchor.current.city}`
      : value.trim();
    const mine = ++seq.current;
    const t = setTimeout(
      async () => {
        if (q.length < 3 || waiting) {
          if (mine === seq.current) setItems([]);
          return;
        }
        try {
          session.current ??= newSession();
          const found = await suggestAddresses(
            q,
            await session.current,
            country,
          );
          // an older answer must not overwrite a newer one
          if (mine === seq.current) {
            setItems(found);
            setActive(0);
          }
        } catch {
          if (mine === seq.current) setItems([]);
        }
      },
      q.length < 3 ? 0 : 250,
    );
    return () => clearTimeout(t);
  }, [value, country]);

  const pick = async (s: AddressSuggestion) => {
    if (s.street) {
      // a street alone is not an address: carry on with the house number
      setItems([]);
      try {
        const { route, city } = await resolveStreet(s);
        anchor.current = { text: `${route} `, city };
        onChange(`${route} `);
      } catch {
        onChange(`${s.main} `);
      }
      return;
    }
    setOpen(false);
    setItems([]);
    try {
      const a = await resolveAddress(s, country);
      onPick(a);
    } catch {
      onChange(s.main);
    }
    session.current = null; // a pick ends the billing session
  };

  const shown = open && items.length > 0;

  return (
    <div className={`${co.float} ${shake ? co.shake : ""}`} data-field={name}>
      <div
        className={`${co.floatBox} ${styles.combo} ${attention ? co.floatBoxActive : ""} ${error ? styles.errorBox : ""}`}
      >
        <input
          id={id}
          className={co.floatInput}
          role={addressSearchEnabled ? "combobox" : undefined}
          aria-expanded={addressSearchEnabled ? shown : undefined}
          aria-controls={addressSearchEnabled ? listId : undefined}
          aria-autocomplete={addressSearchEnabled ? "list" : undefined}
          aria-activedescendant={
            shown && items[active] ? `${id}-o${active}` : undefined
          }
          autoComplete={addressSearchEnabled ? "off" : autoComplete}
          placeholder={placeholder ?? " "}
          value={value}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (!shown) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, items.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              void pick(items[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        <label htmlFor={id} className={co.floatLabel}>
          {label}
        </label>

        {shown && (
          <ul id={listId} role="listbox" className={styles.comboList}>
            {items.map((s, i) => (
              <li
                key={`${s.main}|${s.secondary}`}
                id={`${id}-o${i}`}
                role="option"
                aria-selected={i === active}
                className={`${styles.comboOption} ${i === active ? styles.comboActive : ""}`}
                // keep the focus in the field, so the click is not a blur first
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => void pick(s)}
              >
                {s.main}
                {s.secondary && (
                  <span className={styles.suggestSecondary}>{s.secondary}</span>
                )}
              </li>
            ))}
            <li className={styles.poweredBy} aria-hidden="true">
              powered by Google
            </li>
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
