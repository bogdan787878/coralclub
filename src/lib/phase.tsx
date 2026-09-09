"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** The three Health Concept phases — matches PhaseView["id"] in ./products. */
export type PhaseId = "hydration" | "restart" | "personalization";

type PhaseContextValue = {
  phase: PhaseId;
  setPhase: (id: PhaseId) => void;
};

const PhaseContext = createContext<PhaseContextValue | null>(null);

/**
 * PhaseProvider — holds the active homepage phase. In-memory only: every
 * visit starts on "hydration" and it resets on reload.
 */
export function PhaseProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<PhaseId>("hydration");
  const value = useMemo(() => ({ phase, setPhase }), [phase]);
  return (
    <PhaseContext.Provider value={value}>{children}</PhaseContext.Provider>
  );
}

export function usePhase(): PhaseContextValue {
  const ctx = useContext(PhaseContext);
  if (!ctx) throw new Error("usePhase must be used within a PhaseProvider");
  return ctx;
}
