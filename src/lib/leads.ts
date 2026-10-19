/**
 * Lead capture for the /landing consultation form (name, phone, e-mail). Static export
 * has no server, so submissions go to a Google Apps Script web app that
 * appends a row to a Google Sheet (see scripts/leads/README.md).
 *
 * The web app's address is not a secret (it ends up in the page anyway), so
 * it can live right here: paste the /exec URL into LEADS_WEB_APP_URL. The
 * NEXT_PUBLIC_LEADS_ENDPOINT environment variable, when set at build time,
 * takes precedence.
 */

/** https://script.google.com/macros/s/…/exec — filled in after the deployment. */
export const LEADS_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzNJvMQsflEk2R9ulAe2dAvZGkA_BrZJMkGu4QvLgvuwQAHqJvPyd26NwF1qj8WDWfaug/exec";

export const LEADS_ENDPOINT =
  process.env.NEXT_PUBLIC_LEADS_ENDPOINT || LEADS_WEB_APP_URL;

export type LeadInput = {
  name: string;
  phone: string;
  /** Optional. */
  email: string;
  /** Where the visitor came from ("hero", "consultation", "offline_qr"…). */
  source: string;
};

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
] as const;

/** Resolves when the request was handed to the endpoint. Apps Script web
 *  apps don't send CORS headers, so the response is opaque (`no-cors`) —
 *  a resolved promise means "sent", not "row confirmed". */
export async function submitLead(input: LeadInput): Promise<void> {
  const q = new URLSearchParams(window.location.search);
  const payload = {
    ...input,
    // the UTM tag of the link the visitor arrived by, one value per column
    ...Object.fromEntries(UTM_KEYS.map((k) => [k, q.get(k) ?? ""])),
    page: window.location.href,
    submittedAt: new Date().toISOString(),
  };

  if (!LEADS_ENDPOINT) {
    // not configured (local dev / before the sheet exists) — keep the lead in
    // localStorage so nothing is silently dropped
    console.warn("[leads] no endpoint configured; lead kept locally", payload);
    const key = "coralclub.leads.pending";
    const prev = JSON.parse(
      window.localStorage.getItem(key) ?? "[]",
    ) as unknown[];
    window.localStorage.setItem(key, JSON.stringify([...prev, payload]));
    return;
  }

  await fetch(LEADS_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
}
