"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  COUNTRIES,
  isEmail,
  isPhone,
  submitAuthIntent,
  type AuthChannel,
  type AuthMode,
  type Country,
} from "@/lib/auth";
import { LegalNote } from "./LegalNote";
import { SocialButtons } from "./SocialButtons";
import { ChevronLeft, ChevronRight } from "./icons";
import styles from "./AccountForm.module.css";

const HEADING: Record<AuthMode, string> = {
  create: "Create account",
  signin: "Sign in",
};

const TOGGLE_LABEL: Record<AuthMode, string> = {
  create: "Already have an account? Sign in",
  signin: "New here? Create account",
};

/**
 * The email/phone create-account & sign-in screen. One component covers
 * both modes (matches the mockup 1:1 for "create"; "sign in" swaps the
 * heading/toggle only — no separate screen was designed for it).
 * No backend: submit persists locally via submitAuthIntent and swaps in a
 * confirmation panel.
 */
export function AccountForm() {
  const [mode, setMode] = useState<AuthMode>("create");
  const [channel, setChannel] = useState<AuthChannel>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(false);

  // "/account/create#signin" lands directly in sign-in mode. The hash is
  // only readable client-side, so this has to run post-mount rather than
  // as a lazy useState initializer (which would mismatch the static HTML).
  useEffect(() => {
    if (window.location.hash === "#signin") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above
      setMode("signin");
    }
  }, []);

  const valid = channel === "email" ? isEmail(email) : isPhone(phone);
  const hasValue = channel === "email" ? email.trim().length > 0 : phone.trim().length > 0;
  // Continue only shows once the field is active (focused) or filled
  const showSubmit = focused || hasValue;

  const submit = async () => {
    setTouched(true);
    if (!valid || submitting) return;
    setSubmitting(true);
    await submitAuthIntent({
      mode,
      channel,
      value: channel === "email" ? email.trim() : `${country.dial} ${phone.trim()}`,
      submittedAt: new Date().toISOString(),
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={styles.screen}>
        <div className={styles.done}>
          <p className={styles.brand}>coralclub</p>
          <h1 className={styles.title}>You&apos;re on the list</h1>
          <p className={styles.doneBody}>
            Accounts aren&apos;t live yet — we saved your{" "}
            {channel === "email" ? "email" : "number"} and will get you in the moment sign-in is
            connected.
          </p>
          <Link href="/" className={styles.continue}>
            Back to Coral Club
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <Link href="/account" className={styles.back} aria-label="Back">
        <ChevronLeft />
      </Link>

      <div className={styles.head}>
        <p className={styles.brand}>coralclub</p>
        <div className={styles.locale}>
          <span aria-hidden="true">🇺🇸 USA</span>
          <svg viewBox="0 0 12 12" aria-hidden="true" className={styles.localeChevron}>
            <path
              d="M2.5 4.5 6 8l3.5-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.srOnly}>Region: USA (fixed while the shop is US-only)</span>
        </div>
      </div>

      <div className={styles.body}>
        <h1 className={styles.title}>{HEADING[mode]}</h1>

        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={channel === "email"}
            className={`${styles.tab} ${channel === "email" ? styles.tabOn : ""}`}
            onClick={() => {
              setChannel("email");
              setFocused(false);
            }}
          >
            Email
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={channel === "phone"}
            className={`${styles.tab} ${channel === "phone" ? styles.tabOn : ""}`}
            onClick={() => {
              setChannel("phone");
              setFocused(false);
            }}
          >
            Phone
          </button>
        </div>

        <div className={styles.inputRow}>
          {channel === "email" ? (
            <input
              className={styles.input}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          ) : (
            <>
              <select
                className={styles.countrySelect}
                aria-label="Country code"
                value={country.code}
                onChange={(e) =>
                  setCountry(COUNTRIES.find((c) => c.code === e.target.value) ?? COUNTRIES[0])
                }
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.dial}
                  </option>
                ))}
              </select>
              <input
                className={styles.phoneInput}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </>
          )}
          <button
            type="button"
            className={`${styles.submit} ${showSubmit ? "" : styles.submitHidden}`}
            disabled={submitting}
            aria-label="Continue"
            aria-hidden={!showSubmit}
            tabIndex={showSubmit ? 0 : -1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={submit}
          >
            {submitting ? "…" : <ChevronRight />}
          </button>
        </div>
        {touched && !valid && (
          <span className={styles.error}>
            {channel === "email" ? "Enter a valid email" : "Enter a valid phone number"}
          </span>
        )}

        <button
          type="button"
          className={styles.toggle}
          onClick={() => setMode((m) => (m === "create" ? "signin" : "create"))}
        >
          {TOGGLE_LABEL[mode]}
        </button>
      </div>

      <div className={styles.bottom}>
        <SocialButtons />
        <LegalNote />
      </div>
    </div>
  );
}
