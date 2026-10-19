"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { track } from "@/lib/analytics";
import { submitLead } from "@/lib/leads";
import styles from "./LeadModal.module.css";

type Status = "idle" | "sending" | "done" | "error";

export const LEAD_FORM_ID = "consultation";

/**
 * The consultation request form — one component for the pop-up (opened from
 * the page's buttons) and for the standalone page /landing/consultation/.
 * `source` says where the visitor came from ("hero", "consultation", "page"…).
 */
export function LeadForm({
  source,
  presentation,
  onClose,
}: {
  source: string;
  presentation: "modal" | "page";
  /** Modal only: closes the pop-up from the thank-you screen. */
  onClose?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  // the form was shown (once per mount — StrictMode runs effects twice in dev)
  const reported = useRef(false);
  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    track("lead_form_view", { form_id: LEAD_FORM_ID, source, presentation });
  }, [source, presentation]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!consent || status === "sending") return;
    setStatus("sending");
    try {
      await submitLead({
        email: email.trim(),
        phone: phone.trim(),
        consent,
        source,
      });
      setStatus("done");
      setEmail("");
      setPhone("");
      track("generate_lead", { form_id: LEAD_FORM_ID, source, presentation });
    } catch {
      setStatus("error");
      track("lead_form_error", {
        form_id: LEAD_FORM_ID,
        source,
        error_type: "send_failed",
      });
    }
  };

  if (status === "done") {
    return (
      <div className={styles.done}>
        <h2 className={styles.title}>Спасибо! Заявка принята</h2>
        <p className={styles.text}>
          Нутрициолог свяжется с вами по указанным контактам и подберёт
          персональную систему красоты.
        </p>
        {presentation === "modal" && onClose && (
          <button
            type="button"
            className={styles.submit}
            data-analytics-id="lead_form_done_close"
            onClick={onClose}
          >
            Закрыть
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <h2 className={styles.title}>Бесплатная консультация нутрициолога</h2>
      <p className={styles.text}>
        Оставьте контакты — мы свяжемся с вами и подберём персональную систему.
      </p>

      <label className={styles.field}>
        <span>E-mail</span>
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className={styles.field}>
        <span>Телефон</span>
        <input
          type="tel"
          required
          autoComplete="tel"
          placeholder="+7 999 111-22-33"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>

      <label className={styles.consent}>
        <input
          type="checkbox"
          checked={consent}
          data-analytics-id="lead_form_consent"
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          Согласен на предоставление и использование персональных данных
          для связи по заявке
        </span>
      </label>

      {status === "error" && (
        <p className={styles.error}>
          Не удалось отправить заявку. Попробуйте ещё раз.
        </p>
      )}

      <button
        type="submit"
        className={styles.submit}
        data-analytics-id="lead_form_submit"
        disabled={!consent || status === "sending"}
      >
        {status === "sending" ? "Отправляем…" : "Оставить заявку"}
      </button>
    </form>
  );
}
