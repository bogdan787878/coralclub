"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { submitLead } from "@/lib/leads";
import styles from "./LeadModal.module.css";

type Ctx = { open: (source: string) => void };
const LeadCtx = createContext<Ctx>({ open: () => {} });

/** Call `open("hero")` from any CTA under <LeadModalProvider>. */
export const useLeadModal = () => useContext(LeadCtx);

type Status = "idle" | "sending" | "done" | "error";

export function LeadModalProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  const open = useCallback((s: string) => {
    setSource(s);
    setStatus("idle");
  }, []);
  const close = useCallback(() => setSource(null), []);

  useEffect(() => {
    if (source === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [source, close]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!consent || status === "sending") return;
    setStatus("sending");
    try {
      await submitLead({ email: email.trim(), phone: phone.trim(), consent, source: source ?? "" });
      setStatus("done");
      setEmail("");
      setPhone("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <LeadCtx.Provider value={{ open }}>
      {children}
      {source !== null &&
        createPortal(
          <div className={styles.root} role="dialog" aria-modal="true" aria-label="Заявка на консультацию">
            <button type="button" className={styles.scrim} aria-label="Закрыть" onClick={close} />
            <div className={styles.panel}>
              <button type="button" className={styles.close} aria-label="Закрыть" onClick={close}>
                ×
              </button>

              {status === "done" ? (
                <div className={styles.done}>
                  <h2 className={styles.title}>Спасибо! Заявка принята</h2>
                  <p className={styles.text}>
                    Нутрициолог свяжется с вами по указанным контактам и подберёт персональную систему красоты.
                  </p>
                  <button type="button" className={styles.submit} onClick={close}>
                    Закрыть
                  </button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className={styles.form}>
                  <h2 className={styles.title}>Бесплатная консультация нутрициолога</h2>
                  <p className={styles.text}>Оставьте контакты — мы свяжемся с вами и подберём персональную систему.</p>

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
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                    <span>
                      Согласен на предоставление и использование персональных данных для связи по заявке
                    </span>
                  </label>

                  {status === "error" && (
                    <p className={styles.error}>Не удалось отправить заявку. Попробуйте ещё раз.</p>
                  )}

                  <button type="submit" className={styles.submit} disabled={!consent || status === "sending"}>
                    {status === "sending" ? "Отправляем…" : "Оставить заявку"}
                  </button>
                </form>
              )}
            </div>
          </div>,
          document.body,
        )}
    </LeadCtx.Provider>
  );
}
