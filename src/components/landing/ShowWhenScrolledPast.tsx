"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * ShowWhenScrolledPast — renders its children only while the element with
 * `watchId` has scrolled out of view *upwards* (the reader is below it). Used
 * for the PDP's top price + CTA bar: it appears when the inline buy block is
 * gone and disappears again when it comes back.
 */
export function ShowWhenScrolledPast({
  watchId,
  children,
}: {
  watchId: string;
  children: ReactNode;
}) {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const el = document.getElementById(watchId);
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        setPast(!entry.isIntersecting && entry.boundingClientRect.bottom < 0),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [watchId]);

  return past ? <>{children}</> : null;
}
