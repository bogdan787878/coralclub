/**
 * Auth flow — no backend yet. Mirrors the quiz's lead-capture seam: persist
 * the intent locally so nothing is lost, with one place to wire a real API
 * once accounts exist.
 */

export type AuthMode = "create" | "signin";
export type AuthChannel = "email" | "phone";
export type AuthProvider = "apple" | "google";

export type AuthIntent = {
  mode: AuthMode;
  channel: AuthChannel;
  /** Email address, or the phone number with its dial code prefixed. */
  value: string;
  submittedAt: string;
};

export const isEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** Digits of a US number, without the leading country "1". */
const usDigits = (v: string): string => v.replace(/\D/g, "").replace(/^1/, "").slice(0, 10);

/** Valid once the full 10-digit US national number is entered. */
export const isPhone = (v: string): boolean => usDigits(v).length === 10;

/**
 * Progressive US phone mask: "5551234567" -> "+1 (555) 123-4567".
 * Returns "" for no digits so the placeholder shows. Trailing separators
 * (the ")") are only emitted once there's a digit after them, so
 * backspace never gets "eaten" by a regenerated formatting char.
 */
export const formatUsPhone = (v: string): string => {
  const d = usDigits(v);
  if (!d) return "";
  const a = d.slice(0, 3);
  const b = d.slice(3, 6);
  const c = d.slice(6, 10);
  let out = `+1 (${a}`;
  if (d.length > 3) out += ")";
  if (b) out += ` ${b}`;
  if (c) out += `-${c}`;
  return out;
};

/**
 * Persist an auth intent. No backend yet.
 * TODO(backend): await fetch(`/api/auth/${intent.mode}`, { method: "POST", body: JSON.stringify(intent) })
 */
export const submitAuthIntent = async (intent: AuthIntent): Promise<void> => {
  try {
    localStorage.setItem(`coralclub.auth.${Date.now()}`, JSON.stringify(intent));
  } catch {
    /* storage unavailable — ignore, the UI still confirms */
  }
};

