"use client";

import { useEffect, useState } from "react";
import { MAIN_SITE_URL } from "@/lib/beautySystem";
import { LandingHeader } from "./LandingHeader";
import { LeadForm } from "./LeadForm";
import styles from "./ConsultationPage.module.css";

/**
 * The consultation form as a page of its own (/landing/consultation/).
 * Where the visitor came from is taken from `?source=`, else from the UTM tag
 * (`utm_source_utm_medium`, e.g. "offline_qr"), so a link in an ad or a QR
 * code lands in the lead row with that source; with neither, it is "page".
 * The lead row also keeps the full page address, UTM included.
 */
export function ConsultationPage() {
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const utm = [q.get("utm_source"), q.get("utm_medium")]
      .filter(Boolean)
      .join("_");
    const from = q.get("source") || utm || "page";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the query is only readable after mount
    setSource(from.slice(0, 60));
  }, []);

  return (
    <div className="appShell">
      <main className={styles.page} data-analytics-location="home">
        <LandingHeader homeHref={MAIN_SITE_URL} />
        <div className={styles.card}>
          {source !== null && <LeadForm source={source} presentation="page" />}
        </div>
      </main>
    </div>
  );
}
