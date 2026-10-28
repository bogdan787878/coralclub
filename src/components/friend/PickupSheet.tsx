"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  loadMapsKit,
  type GoogleMap,
  type MapMarker,
  type MapPoint,
  type MapsKit,
} from "@/lib/addressSearch";
import styles from "./PickupSheet.module.css";

/** A pick-up point as the shop lists it. */
export type PickPoint = {
  CODE: string;
  TYPE: string;
  NAME: string;
  ADDRESS: string;
  CITY: string;
  POSTINDEX?: string;
  WORKTIME?: string | null;
  PHONE?: string;
  position?: MapPoint;
};
/** A pick-up service of the shop (one carrier's points). */
export type PickService = {
  ID: string;
  NAME: string;
  TRANSIT?: string;
  PRICE?: number;
  FREE_DELIVERY?: number;
};

/** the short names of the carriers on the pins */
const SHORT: Record<string, string> = {
  I_SDEK_P: "CDEK",
  I_FIVEPOST: "5Post",
  I_YANDEX_PICKPOINT: "Yandex",
};
const COLORS = ["#1f9d4d", "#e8731a", "#6b4fd8", "#0f7c90", "#c2377a"];
const DARK = "#00464a";

const hours = (html?: string | null) =>
  (html ?? "")
    .replace(/<br\s*\/?>/gi, " · ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const km = (a: MapPoint, b: MapPoint) => {
  const r = Math.PI / 180;
  const x = (b.lng - a.lng) * r * Math.cos(((a.lat + b.lat) / 2) * r);
  const y = (b.lat - a.lat) * r;
  return Math.sqrt(x * x + y * y) * 6371;
};

const svgUrl = (svg: string) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

function pill(text: string, color: string, big: boolean) {
  const w = Math.round(text.length * 7.4 + 22);
  const h = 34;
  const f = big ? 13 : 12;
  return {
    url: svgUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
        `<path d="M${w / 2 - 5} 25 L${w / 2} 33 L${w / 2 + 5} 25Z" fill="${color}"/>` +
        `<rect x="1" y="1" width="${w - 2}" height="26" rx="13" fill="${color}" stroke="#fff" stroke-width="2"/>` +
        `<text x="${w / 2}" y="19" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="${f}" fill="#fff">${text}</text></svg>`,
    ),
    width: w,
    height: h,
  };
}

function bubble(n: number) {
  const s = 40;
  return {
    url: svgUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">` +
        `<circle cx="20" cy="20" r="18" fill="#2f9fd6" stroke="#fff" stroke-width="3"/>` +
        `<text x="20" y="25" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="${n > 999 ? 11 : 13}" fill="#fff">${n}</text></svg>`,
    ),
    width: s,
    height: s,
    center: true,
  };
}

/**
 * «Pick-up point»: a sheet with the map (pins, grouped into counters when
 * zoomed out) and a list of the same points, a filter by carrier and an
 * address search. Choosing a point hands its code to the checkout.
 */
export function PickupSheet({
  country,
  countryName,
  city,
  points,
  services,
  selected,
  money,
  onSelect,
  onClose,
}: {
  country: string;
  countryName: string;
  city: string;
  points: PickPoint[];
  services: PickService[];
  selected: string;
  money: (n: number) => string;
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const kitRef = useRef<MapsKit | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const pins = useRef<MapMarker[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading",
  );
  const [view, setView] = useState<"map" | "list">("map");
  const [types, setTypes] = useState<string[]>([]);
  const [focus, setFocus] = useState(selected);
  const [center, setCenter] = useState<MapPoint | null>(null);
  const [query, setQuery] = useState("");
  const [notFound, setNotFound] = useState(false);

  const withPlace = useMemo(() => points.filter((p) => p.position), [points]);
  const shown = useMemo(
    () =>
      types.length ? withPlace.filter((p) => types.includes(p.TYPE)) : withPlace,
    [withPlace, types],
  );
  const service = (type: string) => services.find((s) => s.ID === type);
  const colorOf = (type: string) => {
    const i = services.findIndex((s) => s.ID === type);
    return COLORS[(i < 0 ? 0 : i) % COLORS.length];
  };
  const shortOf = (type: string) =>
    SHORT[type] ?? service(type)?.NAME.split(" ").pop() ?? "Pick-up";
  const focused = points.find((p) => p.CODE === focus);

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

  // the pins in view: single points as labelled pins, close ones as counters
  const draw = useCallback(() => {
    const map = mapRef.current;
    const kit = kitRef.current;
    const b = map?.getBounds();
    if (!map || !kit || !b) return;
    pins.current.forEach((m) => m.remove());
    pins.current = [];
    const z = map.getZoom() ?? 10;
    const ne = b.getNorthEast();
    const sw = b.getSouthWest();
    const padLat = (ne.lat() - sw.lat()) * 0.1;
    const padLng = (ne.lng() - sw.lng()) * 0.1;
    const cell = (360 / 2 ** z) * (70 / 256);
    const cells = new Map<string, PickPoint[]>();
    for (const p of shown) {
      const { lat, lng } = p.position!;
      if (
        lat < sw.lat() - padLat ||
        lat > ne.lat() + padLat ||
        lng < sw.lng() - padLng ||
        lng > ne.lng() + padLng
      )
        continue;
      const key =
        z >= 16 ? p.CODE : `${Math.floor(lat / cell)}:${Math.floor(lng / cell)}`;
      const list = cells.get(key);
      if (list) list.push(p);
      else cells.set(key, [p]);
    }
    cells.forEach((list) => {
      if (list.length > 1) {
        const at = {
          lat: list.reduce((s, p) => s + p.position!.lat, 0) / list.length,
          lng: list.reduce((s, p) => s + p.position!.lng, 0) / list.length,
        };
        pins.current.push(
          kit.marker(map, at, bubble(list.length), () => {
            map.setZoom(z + 2);
            map.panTo(at);
          }),
        );
      } else {
        const p = list[0];
        const on = p.CODE === focus;
        pins.current.push(
          kit.marker(
            map,
            p.position!,
            pill(shortOf(p.TYPE), on ? DARK : colorOf(p.TYPE), on),
            () => setFocus(p.CODE),
          ),
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, focus, services]);
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
    draw();
  }, [draw]);

  useEffect(() => {
    let alive = true;
    let listener: { remove(): void } | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      let kit: MapsKit;
      try {
        kit = await loadMapsKit();
      } catch {
        if (alive) setStatus("failed");
        return;
      }
      if (!alive || !el.current) return;
      kitRef.current = kit;
      const own = points.find((p) => p.CODE === selected)?.position;
      const start =
        own ??
        (await kit.find(`${city}, ${countryName}`, country))?.point ??
        points.find((p) => p.position)?.position ?? { lat: 50, lng: 10 };
      if (!alive || !el.current) return;
      const map = kit.newMap(el.current, start, own ? 15 : 11);
      mapRef.current = map;
      setCenter(start);
      listener = map.addListener("idle", () => {
        drawRef.current();
        clearTimeout(timer);
        timer = setTimeout(() => {
          const c = map.getCenter();
          if (alive && c) setCenter({ lat: c.lat(), lng: c.lng() });
        }, 200);
      });
      setStatus("ready");
    })();
    return () => {
      alive = false;
      clearTimeout(timer);
      listener?.remove();
      pins.current.forEach((m) => m.remove());
      pins.current = [];
    };
    // the map is made once for the sheet
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nearest = useMemo(() => {
    const from = center ?? shown[0]?.position;
    if (!from) return shown.slice(0, 60).map((p) => ({ p, d: 0 }));
    return [...shown]
      .map((p) => ({ p, d: km(from, p.position!) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 60);
  }, [shown, center]);

  async function search() {
    const q = query.trim();
    const kit = kitRef.current;
    const map = mapRef.current;
    if (!q || !kit || !map) return;
    const r = await kit.find(`${q}, ${city}, ${countryName}`, country);
    setNotFound(!r);
    if (!r) return;
    map.setCenter(r.point);
    map.setZoom(15);
    setCenter(r.point);
  }

  const toggleType = (id: string) =>
    setTypes((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );

  const priceOf = (type: string) => {
    const s = service(type);
    if (!s) return "";
    return [s.PRICE ? money(s.PRICE) : "free", s.TRANSIT]
      .filter(Boolean)
      .join(" · ");
  };

  const card = (p: PickPoint, list: boolean) => (
    <div className={list ? styles.row : styles.card}>
      <div className={styles.cardBody}>
        <p className={styles.cardName}>
          <span
            className={styles.dot}
            style={{ background: colorOf(p.TYPE) }}
            aria-hidden="true"
          />
          {service(p.TYPE)?.NAME ?? p.NAME}
        </p>
        <p className={styles.cardLine}>
          {[p.ADDRESS, p.CITY].filter(Boolean).join(", ")}
        </p>
        {hours(p.WORKTIME) && (
          <p className={styles.cardMuted}>{hours(p.WORKTIME)}</p>
        )}
        {priceOf(p.TYPE) && <p className={styles.cardMuted}>{priceOf(p.TYPE)}</p>}
      </div>
      <button
        type="button"
        className={list ? styles.pick : styles.choose}
        onClick={() => onSelect(p.CODE)}
      >
        {p.CODE === selected ? "Chosen" : "Choose"}
      </button>
    </div>
  );

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pickup-title"
      >
        <div className={styles.head}>
          <h2 id="pickup-title" className={styles.title}>
            Pick-up point
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

        <div className={styles.body}>
          <div className={styles.map} ref={el} />
          {status === "loading" && (
            <p className={styles.state} role="status">
              Loading the map…
            </p>
          )}
          {status === "failed" && (
            <p className={styles.state} role="alert">
              The map could not be loaded. Use the list instead.
            </p>
          )}

          <div className={styles.views} role="tablist">
            {(["map", "list"] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                className={`${styles.view} ${view === v ? styles.viewOn : ""}`}
                onClick={() => setView(v)}
              >
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  {v === "map" ? (
                    <path
                      d="M2.5 5l5-2 5 2 5-2v12l-5 2-5-2-5 2V5zM7.5 3v12M12.5 5v12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <path
                      d="M3 5h14M3 10h14M3 15h14"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  )}
                </svg>
                {v === "map" ? "Map" : "List"}
              </button>
            ))}
          </div>

          {view === "list" && (
            <div className={styles.list}>
              {nearest.length === 0 ? (
                <p className={styles.empty}>No pick-up points match.</p>
              ) : (
                nearest.map(({ p }) => <div key={p.CODE}>{card(p, true)}</div>)
              )}
            </div>
          )}

          {view === "map" && (
            <div className={styles.over}>
              {focused && card(focused, false)}
              {services.length > 1 && (
                <div className={styles.chips}>
                  {services.map((s) => (
                    <button
                      key={s.ID}
                      type="button"
                      aria-pressed={types.includes(s.ID)}
                      className={`${styles.chip} ${types.includes(s.ID) ? styles.chipOn : ""}`}
                      onClick={() => toggleType(s.ID)}
                    >
                      {s.NAME}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {view === "list" && services.length > 1 && (
            <div className={styles.chipsList}>
              {services.map((s) => (
                <button
                  key={s.ID}
                  type="button"
                  aria-pressed={types.includes(s.ID)}
                  className={`${styles.chip} ${types.includes(s.ID) ? styles.chipOn : ""}`}
                  onClick={() => toggleType(s.ID)}
                >
                  {s.NAME}
                </button>
              ))}
            </div>
          )}
        </div>

        <form
          className={styles.foot}
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
        >
          <div className={`${styles.search} ${notFound ? styles.searchError : ""}`}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              enterKeyHint="search"
              placeholder="Find address"
              aria-label="Find address"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setNotFound(false);
              }}
            />
          </div>
          {notFound && (
            <p className={styles.notFound} role="alert">
              We could not find this address.
            </p>
          )}
        </form>
      </div>
    </>
  );
}
