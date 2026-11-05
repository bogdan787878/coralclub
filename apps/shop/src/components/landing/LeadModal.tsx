"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { LeadForm } from "./LeadForm";
import styles from "./LeadModal.module.css";

type Ctx = { open: (source: string) => void };
const LeadCtx = createContext<Ctx>({ open: () => {} });

/** Call `open("hero")` from any CTA under <LeadModalProvider>. */
export const useLeadModal = () => useContext(LeadCtx);

export function LeadModalProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<string | null>(null);
  // a new key per opening: the form starts empty and reports "viewed" again
  const [openings, setOpenings] = useState(0);

  const open = useCallback((s: string) => {
    setSource(s);
    setOpenings((n) => n + 1);
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

  return (
    <LeadCtx.Provider value={{ open }}>
      {children}
      {source !== null &&
        createPortal(
          <div
            className={styles.root}
            role="dialog"
            aria-modal="true"
            aria-label="Заявка на консультацию"
          >
            <button
              type="button"
              className={styles.scrim}
              aria-label="Закрыть"
              data-analytics-id="lead_modal_scrim"
              onClick={close}
            />
            <div className={styles.panel}>
              <button
                type="button"
                className={styles.close}
                aria-label="Закрыть"
                data-analytics-id="lead_modal_close"
                onClick={close}
              >
                ×
              </button>
              <LeadForm
                key={openings}
                source={source}
                presentation="modal"
                onClose={close}
              />
            </div>
          </div>,
          document.body,
        )}
    </LeadCtx.Provider>
  );
}
