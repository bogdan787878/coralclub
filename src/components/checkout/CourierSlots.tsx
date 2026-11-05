"use client";

import type { SlotDay } from "@/lib/deliverySlots";
import styles from "./CourierSlots.module.css";

/**
 * CourierSlots: the days and hours the courier offers (Moscow, St. Petersburg).
 * The shop's schedule is turned into `days` by lib/deliverySlots.
 */
export function CourierSlots({
  days,
  day,
  hours,
  onDay,
  onHours,
  title = "Delivery date and time",
  dayLabel = "Delivery day",
  hoursLabel = "Delivery hours",
}: {
  days: SlotDay[];
  day: SlotDay;
  hours: string;
  onDay: (date: string) => void;
  onHours: (interval: string) => void;
  title?: string;
  dayLabel?: string;
  hoursLabel?: string;
}) {
  return (
    <div className={styles.slots}>
      <p className={styles.slotsTitle}>{title}</p>
      <div className={styles.chips} role="radiogroup" aria-label={dayLabel}>
        {days.map((d) => (
          <button
            key={d.date}
            type="button"
            role="radio"
            aria-checked={d.date === day.date}
            className={`${styles.chip} ${d.date === day.date ? styles.chipOn : ""}`}
            onClick={() => onDay(d.date)}
          >
            {d.label}
          </button>
        ))}
      </div>
      <div className={styles.chips} role="radiogroup" aria-label={hoursLabel}>
        {day.times.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={t === hours}
            className={`${styles.chip} ${t === hours ? styles.chipOn : ""}`}
            onClick={() => onHours(t)}
          >
            {t.replace("-", " – ")}
          </button>
        ))}
      </div>
    </div>
  );
}
