"use client";

import styles from "./CheckoutExtras.module.css";

/**
 * PickupPointButton: the field that opens the pick-up point list. Shows the
 * chosen point (service name and address) or the call to choose one.
 */
export function PickupPointButton({
  title,
  address,
  emptyTitle,
  action,
  error,
  onClick,
}: {
  /** the chosen point's service name; empty when nothing is chosen */
  title?: string;
  address?: string;
  emptyTitle: string;
  /** the label at the right: «Change», «12 near Berlin» */
  action: string;
  error?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.pointBtn} ${error ? styles.pointBtnError : ""}`}
      onClick={onClick}
      data-analytics-id="pickup_open"
    >
      <span className={styles.pointText}>
        {title ? (
          <>
            <strong>{title}</strong>
            {address && <small>{address}</small>}
          </>
        ) : (
          <strong>{emptyTitle}</strong>
        )}
      </span>
      <span className={styles.pointAction}>{action}</span>
    </button>
  );
}
