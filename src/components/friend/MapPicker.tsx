"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadMapsKit,
  streetLine,
  type GoogleMap,
  type MapsKit,
  type ResolvedAddress,
} from "@/lib/addressSearch";
import styles from "./MapPicker.module.css";

type Found = { address: ResolvedAddress; country: string; line: string };

/**
 * «Choose on map»: the pin stays in the middle, the shopper moves the map under
 * it, and the address under the pin is read from the geocoder. Confirming hands
 * the address to the checkout, which fills the same fields as a picked
 * suggestion does. Only addresses in the chosen country, with a house number.
 */
export function MapPicker({
  country,
  countryName,
  nearby,
  onSelect,
  onClose,
}: {
  country: string;
  countryName: string;
  /** a town already typed: the map opens there rather than on the whole country */
  nearby?: string;
  onSelect: (a: ResolvedAddress) => void;
  onClose: () => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading",
  );
  const [found, setFound] = useState<Found | null>(null);
  const [reading, setReading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useEffect(() => {
    let alive = true;
    let map: GoogleMap | null = null;
    let listener: { remove(): void } | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let seq = 0;

    (async () => {
      let kit: MapsKit;
      try {
        kit = await loadMapsKit();
      } catch {
        if (alive) setStatus("failed");
        return;
      }
      if (!alive || !el.current) return;
      const start =
        (nearby
          ? await kit.find(`${nearby}, ${countryName}`, country)
          : null) ?? (await kit.find(countryName, country));
      if (!alive || !el.current) return;
      map = kit.newMap(
        el.current,
        start?.point ?? { lat: 50, lng: 10 },
        nearby && start ? 15 : 5,
      );
      if (!nearby && start?.bounds) map.fitBounds(start.bounds);
      setStatus("ready");

      const read = async () => {
        const c = map?.getCenter();
        if (!c) return;
        const mine = ++seq;
        setReading(true);
        const r = await kit.at({ lat: c.lat(), lng: c.lng() });
        if (!alive || mine !== seq) return;
        setFound(r);
        setReading(false);
      };
      // read the address when the map has stopped moving
      listener = map.addListener("idle", () => {
        clearTimeout(timer);
        timer = setTimeout(read, 250);
      });
      void read();
    })();

    return () => {
      alive = false;
      clearTimeout(timer);
      listener?.remove();
    };
  }, [country, countryName, nearby]);

  const a = found?.address;
  const wrongCountry = !!found && found.country !== country;
  const noNumber = !!a && !wrongCountry && (!a.street || !a.houseNumber);
  const ok = !!a && !wrongCountry && !noNumber && !reading;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-picker-title"
      >
        <div className={styles.head}>
          <h2 id="map-picker-title" className={styles.title}>
            Choose on map
          </h2>
          <button
            type="button"
            className={styles.close}
            aria-label="Close"
            onClick={onClose}
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3.5 3.5l9 9m0-9l-9 9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className={styles.mapWrap}>
          <div className={styles.map} ref={el} />
          {status === "ready" && (
            <svg className={styles.pin} viewBox="0 0 34 44" aria-hidden="true">
              <path
                d="M17 1C8.7 1 2 7.7 2 16c0 11 15 27 15 27s15-16 15-27C32 7.7 25.3 1 17 1z"
                fill="#d0342c"
              />
              <circle cx="17" cy="16" r="6" fill="#fff" />
            </svg>
          )}
          {status === "loading" && (
            <p className={styles.state} role="status">
              Loading the map…
            </p>
          )}
          {status === "failed" && (
            <p className={styles.state} role="alert">
              The map could not be loaded. Search for the address instead.
            </p>
          )}
        </div>
        <div className={styles.foot}>
          <p className={styles.line} aria-live="polite">
            {reading || !a
              ? "Move the map to your building"
              : a.street
                ? streetLine(country, a.street, a.houseNumber) +
                  (a.zip || a.city
                    ? `, ${[a.zip, a.city].filter(Boolean).join(" ")}`
                    : "")
                : "Move the map to your building"}
          </p>
          {wrongCountry && (
            <p className={`${styles.note} ${styles.noteError}`} role="alert">
              This point is not in {countryName}. Move the pin or change the
              country in the header.
            </p>
          )}
          {noNumber && (
            <p className={styles.note}>
              There is no house number here: zoom in and put the pin on a
              building.
            </p>
          )}
          <button
            type="button"
            className={styles.confirm}
            disabled={!ok}
            onClick={() => a && onSelect(a)}
          >
            Confirm address
          </button>
        </div>
      </div>
    </>
  );
}
