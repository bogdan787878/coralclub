"use client";

import { Accent, Heading } from "@/components/ui";
import { track } from "@/lib/analytics";
import { registrationUrl } from "@/lib/friend";
import { useFriend } from "./FriendProvider";
import styles from "./Friend.module.css";

/**
 * "Register whenever it suits you": the shop's own sign-up, opened as an
 * invitation from this distributor, so the new member lands in their team.
 */
export function FriendRegisterCta({ where }: { where: "home" | "checkout" }) {
  const { friend } = useFriend();
  const href = friend ? registrationUrl(friend) : undefined;

  return (
    <div className={styles.cta} data-analytics-section={`register_${where}`}>
      <Heading as="h2" className={styles.ctaTitle}>
        Хотите покупать по клубной цене <Accent>всегда?</Accent>
      </Heading>
      <p className={styles.ctaText}>
        Станьте членом клуба: регистрация занимает пару минут. Сделать это можно
        в любой момент — до покупки, после неё или никогда, без давления.
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
        Зарегистрироваться
      </a>
    </div>
  );
}
