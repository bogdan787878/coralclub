"use client";

import { track } from "@/lib/analytics";
import { registrationUrl } from "@/lib/friend";
import { useFriend } from "./FriendProvider";
import styles from "./FriendMemberBlock.module.css";

/** What membership gives — from the club's own «Быть членом клуба» block. */
const PERKS = [
  "Member prices: significant discounts on Coral Club products",
  "Bonuses and rewards for larger purchases and referrals",
  "Early access to new launches and products",
  "Closed sales: exclusive offers for club members",
  "VIP events: private masterclasses and webinars",
  "Rewards for inviting friends and family",
];

const Check = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M4 8.4l2.6 2.6L12 5.6"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * An inline block on the product page: what joining the club gives, and a
 * sign-up button. Nothing to choose — registration is optional, the purchase
 * works without it. The sign-up is the shop's own, opened as an invitation
 * from the friend who sent the visitor.
 */
export function FriendMemberBlock() {
  const { friend } = useFriend();
  const href = friend ? registrationUrl(friend) : undefined;

  return (
    <section
      className={styles.box}
      aria-label="Club membership"
      data-analytics-section="pdp_member_block"
    >
      <div className={styles.head}>
        <div>
          <h2 className={styles.title}>Become a club member</h2>
          <span className={styles.tag}>SAVE 20% ON EVERY ORDER</span>
        </div>
      </div>
      <ul className={styles.perks}>
        {PERKS.map((t) => (
          <li key={t}>
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
        data-analytics-id="pdp_register_cta"
        onClick={() => track("friend_register_click", { cta_location: "pdp" })}
      >
        Sign up
      </a>
      <p className={styles.note}>
        Optional: you can buy this product now without signing up.
      </p>
    </section>
  );
}
