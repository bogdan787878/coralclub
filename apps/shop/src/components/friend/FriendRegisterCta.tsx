"use client";

import { Accent, Heading } from "@/components/ui";
import { track } from "@/lib/analytics";
import { registrationUrl } from "@/lib/friend";
import { useFriendLang } from "@/lib/friendLang";
import { useFriend } from "./FriendProvider";
import styles from "./Friend.module.css";

/**
 *
 * invitation from this distributor, so the new member lands in their team.
 */
export function FriendRegisterCta({ where }: { where: "home" | "checkout" }) {
  const { friend } = useFriend();
  const href = friend ? registrationUrl(friend) : undefined;
  const ru = useFriendLang() === "ru";

  return (
    <div className={styles.cta} data-analytics-section={`register_${where}`}>
      <Heading as="h2" className={styles.ctaTitle}>
        {ru ? (
          <>
            Цены участника — <Accent>всегда?</Accent>
          </>
        ) : (
          <>
            Want member prices <Accent>every time?</Accent>
          </>
        )}
      </Heading>
      <p className={styles.ctaText}>
        {ru
          ? "Станьте участником клуба: регистрация занимает пару минут. Это можно сделать когда угодно — до покупки, после или никогда. Без давления."
          : "Become a club member: sign-up takes a couple of minutes. You can do it any time — before you buy, after, or never. No pressure."}
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
        {ru ? "Зарегистрироваться" : "Sign up"}
      </a>
    </div>
  );
}
