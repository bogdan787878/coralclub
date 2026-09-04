"use client";

import { useState } from "react";
import { AppleMark, GoogleMark } from "./icons";
import styles from "./SocialButtons.module.css";

/**
 * Apple / Google continue buttons. No OAuth is wired yet — tapping either
 * surfaces an inline notice instead of pretending to sign the user in.
 */
export function SocialButtons() {
  const [notice, setNotice] = useState(false);

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.circle}
          aria-label="Continue with Apple"
          onClick={() => setNotice(true)}
        >
          <AppleMark />
        </button>
        <button
          type="button"
          className={styles.circle}
          aria-label="Continue with Google"
          onClick={() => setNotice(true)}
        >
          <GoogleMark />
        </button>
      </div>
      {notice && (
        <p className={styles.notice} role="status">
          Sign-in with Apple and Google isn&apos;t connected yet — use email or phone instead.
        </p>
      )}
    </div>
  );
}
