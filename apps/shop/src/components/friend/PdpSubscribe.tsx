"use client";

import { track } from "@/lib/analytics";
import { registrationUrl } from "@/lib/friend";
import { useFriend } from "./FriendProvider";
import styles from "./PdpSubscribeBox.module.css";

const PERKS = [
  "Early access to new launches and products",
  "VIP events: private masterclasses and webinars",
  "Bonuses and rewards for larger purchases and referrals",
  "Closed sales: exclusive offers for club members",
];

const Check = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3.5 8.4l3 3 6-6.4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * «Subscribe and Save» on the product page: what the club gives and the
 * sign-up (the shop's own, opened as an invitation from the friend). Joining
 * is optional, the purchase works without it.
 */
export function PdpSubscribe() {
  const { friend } = useFriend();
  const href = friend ? registrationUrl(friend) : undefined;

  return (
    <section
      className={styles.card}
      aria-label="Club membership"
      data-analytics-section="pdp_subscribe"
    >
      <div className={styles.head}>
        <h2 className={styles.title}>Subscribe and Save</h2>
        <span className={styles.tag}>−20% on every order</span>
      </div>
      <ul className={styles.perks}>
        {PERKS.map((t) => (
          <li key={t} className={styles.perk}>
            <span className={styles.check}>
              <Check />
            </span>
            {t}
          </li>
        ))}
      </ul>
      <a
        className={styles.btn}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={!href}
        data-analytics-id="pdp_subscribe_cta"
        onClick={() =>
          track("friend_register_click", { cta_location: "pdp_subscribe" })
        }
      >
        Become a club member
      </a>
    </section>
  );
}
