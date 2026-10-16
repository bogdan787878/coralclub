"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppleMark, GoogleMark } from "@/components/account/icons";
import { isEmail } from "@/lib/auth";
import styles from "./SignInLab.module.css";

type Cta = "flow" | "pinned";

type Viewport = {
  inner: number;
  height: number;
  top: number;
  left: number;
  /** Height the keyboard (and its accessory bar) takes off the screen. */
  keyboard: number;
};

const EMPTY: Viewport = { inner: 0, height: 0, top: 0, left: 0, keyboard: 0 };

/**
 * The "Sign in or create your account" screen, built to be tried on a real
 * iPhone. The field is a plain email input with every attribute iOS reads
 * (inputmode, autocomplete, autocapitalize, enterkeyhint). Three switches at
 * the bottom change how the page behaves when the keyboard opens:
 *  - CTA: Continue stays in the page, or is pinned just above the keyboard
 *  - Auto-scroll: after the keyboard opens, scroll so Continue is visible
 *  - Debug: live numbers from the visual viewport
 */
export function SignInLab() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState(false);
  const [focused, setFocused] = useState(false);

  const [cta, setCta] = useState<Cta>("flow");
  const [autoScroll, setAutoScroll] = useState(true);
  const [debug, setDebug] = useState(false);
  const [vp, setVp] = useState<Viewport>(EMPTY);

  const ctaRef = useRef<HTMLButtonElement>(null);

  // switches live in the URL so a link reproduces the same test
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    /* eslint-disable react-hooks/set-state-in-effect -- URL is only readable after mount */
    if (q.get("cta") === "pinned") setCta("pinned");
    if (q.get("scroll") === "off") setAutoScroll(false);
    if (q.get("debug") === "1") setDebug(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const sync = useCallback(
    (next: { cta: Cta; autoScroll: boolean; debug: boolean }) => {
      const q = new URLSearchParams();
      if (next.cta === "pinned") q.set("cta", "pinned");
      if (!next.autoScroll) q.set("scroll", "off");
      if (next.debug) q.set("debug", "1");
      const s = q.toString();
      window.history.replaceState(
        null,
        "",
        s ? `?${s}` : window.location.pathname,
      );
    },
    [],
  );

  // visual viewport: on iOS the keyboard does not resize the page, it shrinks
  // the *visual* viewport — that is the only place its height is visible
  useEffect(() => {
    const v = window.visualViewport;
    if (!v) return;
    const read = () =>
      setVp({
        inner: Math.round(window.innerHeight),
        height: Math.round(v.height),
        top: Math.round(v.offsetTop),
        left: Math.round(v.offsetLeft),
        keyboard: Math.max(
          0,
          Math.round(window.innerHeight - v.height - v.offsetTop),
        ),
      });
    read();
    v.addEventListener("resize", read);
    v.addEventListener("scroll", read);
    window.addEventListener("orientationchange", read);
    return () => {
      v.removeEventListener("resize", read);
      v.removeEventListener("scroll", read);
      window.removeEventListener("orientationchange", read);
    };
  }, []);

  const keyboardOpen = focused && vp.keyboard > 80;
  const pinned = cta === "pinned" && keyboardOpen;

  // after the keyboard has finished opening, bring Continue into view
  useEffect(() => {
    if (!focused || !autoScroll || cta !== "flow") return;
    const t = window.setTimeout(() => {
      ctaRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 350);
    return () => window.clearTimeout(t);
  }, [focused, autoScroll, cta, vp.keyboard]);

  const valid = isEmail(email);
  const showError = touched && !valid;

  const submit = () => {
    setTouched(true);
    if (valid) setDone(true);
  };

  const continueButton = (pinnedBar: boolean) => (
    <button
      ref={pinnedBar ? undefined : ctaRef}
      type="submit"
      className={styles.continue}
      // keep the field focused so tapping Continue does not drop the keyboard first
      onMouseDown={(e) => e.preventDefault()}
    >
      Continue
    </button>
  );

  return (
    <div className={styles.backdrop}>
      <main className={styles.screen}>
        <h1 className={styles.title}>Sign in or create your account</h1>

        <button type="button" className={styles.outline}>
          Sign in with Coral ID
        </button>
        <p className={styles.caption}>
          Choose this login method if you didn&apos;t register using any of the
          options below
        </p>

        <div className={styles.social}>
          <button type="button" className={styles.outline}>
            <AppleMark />
            Continue with Apple
          </button>
          <button type="button" className={styles.outline}>
            <GoogleMark />
            Continue with Google
          </button>
        </div>

        <div className={styles.or} role="separator" aria-label="or">
          <span>OR</span>
        </div>

        <form
          className={styles.form}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label className={styles.label} htmlFor="signin-email">
            Email
          </label>
          <input
            id="signin-email"
            name="email"
            className={`${styles.input} ${showError ? styles.inputError : ""}`}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            value={email}
            aria-invalid={showError}
            aria-describedby={showError ? "signin-email-error" : undefined}
            onChange={(e) => {
              setEmail(e.target.value);
              setDone(false);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {showError && (
            <p id="signin-email-error" className={styles.error} role="alert">
              Enter a valid email
            </p>
          )}

          {/* the in-page button always holds its place, even while the
              pinned copy is the one on screen */}
          <div className={pinned ? styles.hidden : undefined}>
            {continueButton(false)}
          </div>

          {done && (
            <p className={styles.ok} role="status">
              ✓ Email accepted — the next step would open here.
            </p>
          )}

          <p className={styles.legal}>
            By clicking «Continue», I confirm that I am over 18 years old and
            agree to the <a href="#rules">Registration Rules</a> and the{" "}
            <a href="#privacy">Privacy Policy</a>.
          </p>

          {pinned && (
            <div
              className={styles.pinned}
              style={{
                transform: `translate(${vp.left}px, ${vp.top + vp.height - vp.inner}px)`,
              }}
            >
              {continueButton(true)}
            </div>
          )}
        </form>

        <section className={styles.lab} aria-label="Keyboard test settings">
          <p className={styles.labTitle}>Keyboard test</p>
          <Switch
            label="Continue"
            value={cta}
            options={[
              ["flow", "In page"],
              ["pinned", "Above keyboard"],
            ]}
            onChange={(v) => {
              setCta(v as Cta);
              sync({ cta: v as Cta, autoScroll, debug });
            }}
          />
          <Switch
            label="Auto-scroll"
            value={autoScroll ? "on" : "off"}
            options={[
              ["on", "On"],
              ["off", "Off"],
            ]}
            onChange={(v) => {
              setAutoScroll(v === "on");
              sync({ cta, autoScroll: v === "on", debug });
            }}
          />
          <Switch
            label="Debug"
            value={debug ? "on" : "off"}
            options={[
              ["off", "Off"],
              ["on", "On"],
            ]}
            onChange={(v) => {
              setDebug(v === "on");
              sync({ cta, autoScroll, debug: v === "on" });
            }}
          />
        </section>

        {debug && (
          <pre
            className={styles.debug}
            aria-hidden="true"
            style={{ transform: `translate(${vp.left}px, ${vp.top}px)` }}
          >
            {`innerHeight   ${vp.inner}
visual height ${vp.height}
offsetTop     ${vp.top}
keyboard      ${vp.keyboard}
focused       ${focused ? "yes" : "no"}`}
          </pre>
        )}
      </main>
    </div>
  );
}

function Switch({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <div className={styles.sw}>
      <span className={styles.swLabel}>{label}</span>
      <div className={styles.swGroup} role="radiogroup" aria-label={label}>
        {options.map(([v, text]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            className={`${styles.swBtn} ${value === v ? styles.swOn : ""}`}
            onClick={() => onChange(v)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
