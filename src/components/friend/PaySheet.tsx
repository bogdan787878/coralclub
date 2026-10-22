"use client";

import { useEffect } from "react";
import { asset } from "@/lib/asset";
import styles from "./PaySheet.module.css";

/**
 * The card form of the payment step as a bottom sheet over the checkout (a
 * centred dialog on a wide screen). The form is our own payment page opened
 * in a frame: a separate document, so it runs without analytics and without
 * any script of the checkout page — as the card page always did. When the
 * payment goes through, the frame tells us and the checkout moves on to the
 * confirmation page.
 */
export function PaySheet({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as { type?: string; order?: string } | null;
      if (d?.type !== "cc-paid") return;
      const id = String(d.order ?? "").replace(/\D/g, "");
      if (id)
        window.location.assign(asset(`/friend/checkout/done/?order=${id}`));
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("message", onMessage);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("message", onMessage);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <>
      <div className={styles.sheetBackdrop} onClick={onClose} />
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label="Pay by card"
      >
        <div className={styles.sheetHead}>
          <span className={styles.sheetGrip} aria-hidden="true" />
          <button
            type="button"
            className={styles.sheetClose}
            aria-label="Close"
            onClick={onClose}
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3.5 3.5l9 9m0-9l-9 9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <iframe className={styles.frame} src={src} title="Card payment" />
      </div>
    </>
  );
}
