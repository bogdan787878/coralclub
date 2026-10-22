"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  addressSearchEnabled,
  newSession,
  resolveAddress,
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
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [items, setItems] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const session = useRef<Promise<unknown> | null>(null);
  const seq = useRef(0);

  // suggestions for the text, after a short pause in typing
  useEffect(() => {
    if (!addressSearchEnabled) return;
    const q = value.trim();
    const mine = ++seq.current;
    const t = setTimeout(
      async () => {
        if (q.length < 3) {
          if (mine === seq.current) setItems([]);
          return;
        }
        try {
          session.current ??= newSession();
          const found = await suggestAddresses(q, await session.current);
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
  }, [value]);

  const pick = async (s: AddressSuggestion) => {
    setOpen(false);
    setItems([]);
    try {
      const a = await resolveAddress(s);
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
