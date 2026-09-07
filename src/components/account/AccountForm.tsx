"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  formatUsPhone,
  isEmail,
  isPhone,
  submitAuthIntent,
  type AuthChannel,
  type AuthMode,
} from "@/lib/auth";
import { LegalNote } from "./LegalNote";
import { SocialButtons } from "./SocialButtons";
import { ChevronLeft, ChevronRight } from "./icons";
import styles from "./AccountForm.module.css";

const HEADING: Record<AuthMode, string> = {
  create: "Create account",
  signin: "Sign in",
};

const TOGGLE_CAPTION: Record<AuthMode, string> = {
  create: "Already have an account?",
  signin: "New here?",
};
const TOGGLE_ACTION: Record<AuthMode, string> = {
  create: "Sign in",
  signin: "Create account",
};

const OTP_LENGTH = 4;
const RESEND_SECONDS = 45;

type Phase = "form" | "otp";

/**
 * The email/phone create-account & sign-in screen. One component covers
 * both modes (the mockup only designs "create"; "sign in" swaps the
 * heading/toggle). Submitting a phone number moves to an SMS-code step;
 * email falls straight through to the confirmation panel. No backend —
 * submitAuthIntent just persists locally.
 */
export function AccountForm() {
  const [mode, setMode] = useState<AuthMode>("create");
  const [channel, setChannel] = useState<AuthChannel>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(false);

  const [phase, setPhase] = useState<Phase>("form");
  const [otp, setOtp] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // "/account/create#signin" lands directly in sign-in mode. The hash is
  // only readable client-side, so this has to run post-mount rather than
  // as a lazy useState initializer (which would mismatch the static HTML).
  useEffect(() => {
    if (window.location.hash === "#signin") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above
      setMode("signin");
    }
  }, []);

  // resend countdown, runs only on the OTP step
  useEffect(() => {
    if (phase !== "otp" || resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [phase, resendIn]);

  // move focus into the first code box when the OTP step opens
  useEffect(() => {
    if (phase === "otp") otpRefs.current[0]?.focus();
  }, [phase]);

  const valid = channel === "email" ? isEmail(email) : isPhone(phone);
  const hasValue = channel === "email" ? email.trim().length > 0 : phone.trim().length > 0;
  // Continue only shows once the field is active (focused) or filled
  const showSubmit = focused || hasValue;

  const persist = (extra?: string) =>
    submitAuthIntent({
      mode,
      channel,
      value:
        (channel === "email" ? email.trim() : phone.trim()) + (extra ? ` · ${extra}` : ""),
      submittedAt: new Date().toISOString(),
    });

  const submit = async () => {
    setTouched(true);
    if (!valid || submitting) return;
    setSubmitting(true);
    await persist();
    setSubmitting(false);
    if (channel === "phone") {
      setOtp(Array(OTP_LENGTH).fill(""));
      setResendIn(RESEND_SECONDS);
      setPhase("otp");
    } else {
      setSubmitted(true);
    }
  };

  const verify = async (code: string) => {
    await persist(`code ${code}`);
    setSubmitted(true);
  };

  const setOtpDigit = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = d;
    setOtp(next);
    if (d && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus();
    if (next.every((x) => x !== "")) void verify(next.join(""));
  };

  const onOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const backToForm = () => {
    setPhase("form");
    setTouched(false);
  };

  const flipMode = () => {
    setMode((m) => (m === "create" ? "signin" : "create"));
    setPhase("form");
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
      {phase === "otp" ? (
        <button type="button" className={styles.back} aria-label="Back" onClick={backToForm}>
          <ChevronLeft />
        </button>
      ) : (
        <Link href="/account" className={styles.back} aria-label="Back">
          <ChevronLeft />
        </Link>
      )}

      <div className={styles.head}>
        <p className={styles.brand}>coralclub</p>
        <div className={styles.locale}>
          <span aria-hidden="true">USA</span>
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

        {phase === "otp" ? (
          <>
            <div className={styles.verifyBlock}>
              <p className={styles.verifyHint}>Enter verification code from SMS</p>
              <p className={styles.verifyPhone}>{phone}</p>
            </div>

            <div className={styles.otpRow}>
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  className={styles.otpBox}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  aria-label={`Digit ${i + 1}`}
                  value={d}
                  onChange={(e) => setOtpDigit(i, e.target.value)}
                  onKeyDown={(e) => onOtpKeyDown(i, e)}
                />
              ))}
            </div>

            <p className={styles.resend}>
              {resendIn > 0 ? (
                `Send again in ${resendIn} sec.`
              ) : (
                <button
                  type="button"
                  className={styles.resendBtn}
                  onClick={() => setResendIn(RESEND_SECONDS)}
                >
                  Send again
                </button>
              )}
            </p>
          </>
        ) : (
          <>
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
                <input
                  className={styles.input}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+1"
                  value={phone}
                  onChange={(e) => setPhone(formatUsPhone(e.target.value))}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
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
          </>
        )}
      </div>

      <div className={styles.bottom}>
        <button type="button" className={styles.toggle} onClick={flipMode}>
          <span className={styles.toggleCaption}>{TOGGLE_CAPTION[mode]}</span>
          <span className={styles.toggleAction}>{TOGGLE_ACTION[mode]}</span>
        </button>
        <SocialButtons />
        <LegalNote />
      </div>
    </div>
  );
}
