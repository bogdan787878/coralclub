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

/** Loose check — just "enough digits", not a real phone validator. */
export const isPhone = (v: string): boolean => v.replace(/\D/g, "").length >= 7;

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

export type Country = { code: string; dial: string; flag: string; label: string };

export const COUNTRIES: Country[] = [
  { code: "US", dial: "+1", flag: "🇺🇸", label: "USA" },
  { code: "CA", dial: "+1", flag: "🇨🇦", label: "Canada" },
  { code: "GB", dial: "+44", flag: "🇬🇧", label: "UK" },
  { code: "DE", dial: "+49", flag: "🇩🇪", label: "Germany" },
  { code: "FR", dial: "+33", flag: "🇫🇷", label: "France" },
  { code: "AU", dial: "+61", flag: "🇦🇺", label: "Australia" },
];
