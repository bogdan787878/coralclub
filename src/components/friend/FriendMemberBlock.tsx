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
 * The closing block of the product page: what joining the club gives and a
 * sign-up button. Nothing to choose — registration is optional and the
 * purchase works without it. The sign-up is the shop's own, opened as an
 * invitation from the friend who sent the visitor.
 */
export function FriendMemberBlock({
  title = "Become a club member",
  cta = "Sign up",
  where = "pdp",
}: {
  title?: string;
  cta?: string;
  /** Where the block sits — goes to analytics. */
  where?: string;
} = {}) {
  const { friend } = useFriend();
  const href = friend ? registrationUrl(friend) : undefined;

  return (
    <section
      className={styles.box}
      aria-label="Club membership"
      data-analytics-section={`${where}_member_block`}
    >
      <div className={styles.intro}>
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.tag}>SAVE 20% ON EVERY ORDER</span>
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
        data-analytics-id={`${where}_register_cta`}
        onClick={() => track("friend_register_click", { cta_location: where })}
      >
        {cta}
      </a>
    </section>
  );
}
