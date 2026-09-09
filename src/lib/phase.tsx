"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** The three Health Concept phases — matches PhaseView["id"] in ./products. */
export type PhaseId = "hydration" | "restart" | "personalization";

const PHASE_IDS: PhaseId[] = ["hydration", "restart", "personalization"];
const isPhaseId = (v: unknown): v is PhaseId =>
  typeof v === "string" && (PHASE_IDS as string[]).includes(v);

/** Key under which the active phase rides along in the history entry's state. */
const STATE_KEY = "coralPhase";

type PhaseContextValue = {
  phase: PhaseId;
  setPhase: (id: PhaseId) => void;
};

const PhaseContext = createContext<PhaseContextValue | null>(null);

/**
 * PhaseProvider — holds the active homepage phase. A fresh visit starts on
 * "hydration"; the current phase is stashed in the history entry's state so
 * navigating into a product page and pressing Back returns you to the phase
 * you left (not a reset to hydration).
 */
export function PhaseProvider({ children }: { children: ReactNode }) {
  const [phase, setPhaseState] = useState<PhaseId>("hydration");

  // restore the phase from the history entry (initial mount + Back/Forward)
  useLayoutEffect(() => {
    const restore = () => {
      const stashed = (window.history.state as Record<string, unknown> | null)?.[
        STATE_KEY
      ];
      if (isPhaseId(stashed)) setPhaseState(stashed);
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  const setPhase = useCallback((id: PhaseId) => {
    setPhaseState(id);
    try {
      window.history.replaceState(
        { ...window.history.state, [STATE_KEY]: id },
        "",
      );
    } catch {
      /* history unavailable — phase still lives in state for this mount */
    }
  }, []);

  const value = useMemo(() => ({ phase, setPhase }), [phase, setPhase]);
  return (
    <PhaseContext.Provider value={value}>{children}</PhaseContext.Provider>
  );
}

export function usePhase(): PhaseContextValue {
  const ctx = useContext(PhaseContext);
  if (!ctx) throw new Error("usePhase must be used within a PhaseProvider");
  return ctx;
}
