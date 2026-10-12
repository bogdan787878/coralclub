/**
 * Lead capture for the /landing consultation form. Static export has no
 * server, so submissions go to a Google Apps Script web app that appends a
 * row to a Google Sheet (see scripts/leads/README.md). The endpoint URL is
 * baked in at build time via NEXT_PUBLIC_LEADS_ENDPOINT.
 */

export type LeadInput = {
  email: string;
  phone: string;
  consent: boolean;
  source: string;
};

export const LEADS_ENDPOINT = process.env.NEXT_PUBLIC_LEADS_ENDPOINT ?? "";

/** Resolves when the request was handed to the endpoint. Apps Script web
 *  apps don't send CORS headers, so the response is opaque (`no-cors`) —
 *  a resolved promise means "sent", not "row confirmed". */
export async function submitLead(input: LeadInput): Promise<void> {
  const payload = {
    ...input,
    page: typeof window !== "undefined" ? window.location.href : "",
    submittedAt: new Date().toISOString(),
  };

  if (!LEADS_ENDPOINT) {
    // not configured (local dev / preview before the sheet exists) —
    // keep the lead in localStorage so nothing is silently dropped
    console.warn("[leads] NEXT_PUBLIC_LEADS_ENDPOINT is not set; lead kept locally", payload);
    const key = "coralclub.leads.pending";
    const prev = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown[];
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
