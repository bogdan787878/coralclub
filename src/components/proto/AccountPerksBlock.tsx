"use client";

import styles from "./AccountPerksBlock.module.css";

const PERKS = [
  { title: "Выгода и экономия", text: "Существенные скидки на продукты Coral Club." },
  { title: "Бонусы и награды", text: "Бонусы за крупные покупки и рекомендации." },
  { title: "Ранний доступ", text: "Первыми узнавайте о новых запусках и продуктах." },
  { title: "Закрытые акции", text: "Эксклюзивные предложения для участников клуба." },
  { title: "VIP-события", text: "Участие в закрытых мастер-классах и вебинарах." },
];

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L1.5 7.7l5.9-.8L10 1.5z" />
    </svg>
  );
}

export type AccountPerksBlockProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/**
 * AccountPerksBlock — the cart's "create a club account" upsell: a
 * pre-checked checkbox (checkout still works unchecked — this is an
 * opt-in, not a requirement, matching the guest-checkout flow) plus the
 * five member perks.
 */
export function AccountPerksBlock({ checked, onChange }: AccountPerksBlockProps) {
  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.head}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
      >
        <span className={`${styles.checkbox}${checked ? "" : ` ${styles.off}`}`}>
          <CheckIcon />
        </span>
        <span className={styles.headText}>
          <span className={styles.title}>Создать аккаунт клуба</span>
          <span className={styles.subtitle}>Бесплатно. Необязательно — можно оформить заказ и без него.</span>
        </span>
      </button>

      <ul className={styles.perks}>
        {PERKS.map((p) => (
          <li className={styles.perk} key={p.title}>
            <span className={styles.perkIcon}>
              <StarIcon />
            </span>
            <span className={styles.perkBody}>
              <span className={styles.perkTitle}>{p.title}</span>
              <span className={styles.perkText}>{p.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
