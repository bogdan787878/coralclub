import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";
import { LegalNote } from "@/components/account/LegalNote";
import { SocialButtons } from "@/components/account/SocialButtons";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sign in — Coral Club",
  description: "Create a Coral Club account or sign in to an existing one.",
};

/**
 * /account — the entry screen: full-bleed splash photo, the wordmark
 * lockup, and the two ways in (create account / sign in). No backend yet —
 * both routes lead to the /account/create form, which stubs the submit.
 */
export default function AccountLanding() {
  return (
    <div className={styles.backdrop}>
      <main className={styles.screen}>
        <Image
          src={asset("/images/account-splash.png")}
          alt=""
          fill
          priority
          sizes="(min-width: 768px) 420px, 100vw"
          className={styles.bg}
        />
        <div className={styles.scrim} aria-hidden="true" />

        <Link href="/" className={styles.close} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </Link>

        <Image
          src={asset("/images/account-liner.svg")}
          alt="Coral Club — The Art of Being Healthy, MCMXCVIII"
          width={186}
          height={96}
          className={styles.mark}
        />

        <div className={styles.content}>
          <Link href="/account/create" className={styles.primary}>
            Create account
          </Link>
          <Link href="/account/create#signin" className={styles.secondary}>
            Sign in
          </Link>

          <SocialButtons />
          <LegalNote />
        </div>
      </main>
    </div>
  );
}
