"use client";

import { Accent, Heading } from "@/components/ui";
import { track } from "@/lib/analytics";
import { registrationUrl } from "@/lib/friend";
import { useFriend } from "./FriendProvider";
import styles from "./Friend.module.css";

/**
 *
 * invitation from this distributor, so the new member lands in their team.
 */
export function FriendRegisterCta({ where }: { where: "home" | "checkout" }) {
  const { friend } = useFriend();
  const href = friend ? registrationUrl(friend) : undefined;

  return (
    <div className={styles.cta} data-analytics-section={`register_${where}`}>
      <Heading as="h2" className={styles.ctaTitle}>
        Want member prices <Accent>every time?</Accent>
      </Heading>
      <p className={styles.ctaText}>
        Become a club member: sign-up takes a couple of minutes. You can do it
        any time — before you buy, after, or never. No pressure.
      </p>
      <a
        className={styles.ctaBtn}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={!href}
        data-analytics-id={`${where}_register_cta`}
        onClick={() => track("friend_register_click", { cta_location: where })}
      >
        Sign up
      </a>
    </div>
  );
}
