"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { track } from "@/lib/analytics";
import { submitLead } from "@/lib/leads";
import styles from "./LeadModal.module.css";

type Status = "idle" | "sending" | "done" | "error";

export const LEAD_FORM_ID = "consultation";

/** A phone is complete from ten digits (a Russian number without the +7). */
const phoneDigits = (v: string) => v.replace(/\D/g, "").length;

/**
 * The consultation request form — a phone number and one button. One
 * component for the pop-up (opened from the page's buttons) and for the
 * standalone page /landing/consultation/. `source` says where the visitor
 * came from ("hero", "consultation", "offline_qr"…).
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
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  // the form was shown (once per mount — StrictMode runs effects twice in dev)
  const reported = useRef(false);
  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    track("lead_form_view", { form_id: LEAD_FORM_ID, source, presentation });
  }, [source, presentation]);

  const valid = phoneDigits(phone) >= 10;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    setTouched(true);
    if (!valid) return;
    setStatus("sending");
    try {
      await submitLead({ phone: phone.trim(), source });
      setStatus("done");
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
          Нутрициолог перезвонит вам по указанному номеру и подберёт
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
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      <h2 className={styles.title}>Бесплатная консультация нутрициолога</h2>
      <p className={styles.text}>
        Оставьте номер телефона — мы перезвоним и подберём персональную систему.
      </p>

      <label className={styles.field}>
        <span>Телефон</span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+7 999 111-22-33"
          value={phone}
          aria-invalid={touched && !valid}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>

      {touched && !valid && (
        <p className={styles.error} role="alert">
          Введите номер телефона полностью.
        </p>
      )}
      {status === "error" && (
        <p className={styles.error}>
          Не удалось отправить заявку. Попробуйте ещё раз.
        </p>
      )}

      <button
        type="submit"
        className={styles.submit}
        data-analytics-id="lead_form_submit"
        disabled={status === "sending"}
      >
        {status === "sending" ? "Отправляем…" : "Записаться"}
      </button>

      <p className={styles.note}>
        Нажимая «Записаться», вы соглашаетесь на обработку персональных данных.
      </p>
    </form>
  );
}
