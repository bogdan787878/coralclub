"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent, type WheelEvent as RWheelEvent } from "react";
import Image from "next/image";
import styles from "./ImageViewer.module.css";

export type ViewerImage = { src: string; alt: string };

const MAX = 4;
const DOUBLE_TAP_MS = 300;

type Pt = { x: number; y: number };
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * ImageViewer — фото на весь экран с зумом: листать свайпом, стрелками или клавишами; увеличивать щипком двумя
 * пальцами, двойным тапом (или двойным кликом) и колёсиком; увеличенное фото — перетаскивать. Жесты свои (без
 * браузерного зума страницы): одна система указателей и для листания, и для зума, чтобы они не спорили.
 */
export function ImageViewer({
  images,
  start = 0,
  onClose,
  labels = { close: "Закрыть", prev: "Предыдущее фото", next: "Следующее фото", dialog: "Просмотр фото" },
}: {
  images: ViewerImage[];
  start?: number;
  onClose: () => void;
  labels?: { close: string; prev: string; next: string; dialog: string };
}) {
  const [index, setIndex] = useState(start);
  const [view, setViewState] = useState({ scale: 1, x: 0, y: 0 });
  const [dragX, setDragXState] = useState(0);
  // последние значения — для обработчиков указателя (между событиями страница может не успеть перерисоваться)
  const viewRef = useRef(view);
  const dragRef = useRef(0);
  const setView = (v: { scale: number; x: number; y: number } | ((v: { scale: number; x: number; y: number }) => { scale: number; x: number; y: number })) => {
    const next = typeof v === "function" ? v(viewRef.current) : v;
    viewRef.current = next;
    setViewState(next);
  };
  const setDragX = (x: number) => {
    dragRef.current = x;
    setDragXState(x);
  };
  const [moving, setMoving] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Pt>());
  const gesture = useRef<{
    kind: "none" | "swipe" | "pan" | "pinch";
    start: Pt;
    view: { scale: number; x: number; y: number };
    dist: number;
    mid: Pt;
    moved: boolean;
  }>({ kind: "none", start: { x: 0, y: 0 }, view: { scale: 1, x: 0, y: 0 }, dist: 0, mid: { x: 0, y: 0 }, moved: false });
  const lastTap = useRef<{ t: number; p: Pt } | null>(null);

  const count = images.length;
  const go = useCallback(
    (to: number) => {
      setIndex(clamp(to, 0, count - 1));
      viewRef.current = { scale: 1, x: 0, y: 0 };
      setViewState(viewRef.current);
    },
    [count],
  );

  // клавиатура и прокрутка страницы под просмотром
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "ArrowRight") go(index + 1);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [go, index, onClose]);

  /** Точка относительно центра сцены. */
  const local = (p: Pt): Pt => {
    const r = stage.current?.getBoundingClientRect();
    return r ? { x: p.x - (r.left + r.width / 2), y: p.y - (r.top + r.height / 2) } : p;
  };

  /** Сдвиг не дальше краёв увеличенного фото. */
  const bound = (v: { scale: number; x: number; y: number }) => {
    const r = stage.current?.getBoundingClientRect();
    if (!r) return v;
    const mx = ((v.scale - 1) * r.width) / 2;
    const my = ((v.scale - 1) * r.height) / 2;
    return { scale: v.scale, x: clamp(v.x, -mx, mx), y: clamp(v.y, -my, my) };
  };

  /** Масштаб с якорем в точке (палец, курсор): точка под ним остаётся на месте. */
  const zoomAt = (from: { scale: number; x: number; y: number }, scale: number, at: Pt) => {
    const s = clamp(scale, 1, MAX);
    const k = s / from.scale;
    return bound({ scale: s, x: at.x - (at.x - from.x) * k, y: at.y - (at.y - from.y) * k });
  };

  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* указатель уже отпущен — жест обработаем без захвата */
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const g = gesture.current;
    if (pts.length === 2) {
      g.kind = "pinch";
      g.dist = dist(pts[0], pts[1]);
      g.mid = local(mid(pts[0], pts[1]));
      g.view = viewRef.current;
      setDragX(0);
    } else if (pts.length === 1) {
      g.kind = viewRef.current.scale > 1 ? "pan" : "swipe";
      g.start = pts[0];
      g.view = viewRef.current;
      g.moved = false;
    }
    setMoving(true);
  };

  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const g = gesture.current;
    if (g.kind === "pinch" && pts.length === 2) {
      const m = local(mid(pts[0], pts[1]));
      const z = zoomAt(g.view, (g.view.scale * dist(pts[0], pts[1])) / (g.dist || 1), g.mid);
      // за двумя пальцами фото ещё и едет
      setView(bound({ ...z, x: z.x + (m.x - g.mid.x), y: z.y + (m.y - g.mid.y) }));
      return;
    }
    const p = pts[0];
    if (!p) return;
    const dx = p.x - g.start.x;
    const dy = p.y - g.start.y;
    if (Math.hypot(dx, dy) > 6) g.moved = true;
    if (g.kind === "pan") setView(bound({ scale: g.view.scale, x: g.view.x + dx, y: g.view.y + dy }));
    if (g.kind === "swipe") setDragX(index === 0 && dx > 0 ? dx / 3 : index === count - 1 && dx < 0 ? dx / 3 : dx);
  };

  const onUp = (e: RPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    const p = pointers.current.get(e.pointerId);
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 1 && g.kind === "pinch") {
      // остался один палец — дальше двигаем
      const rest = [...pointers.current.values()][0];
      g.kind = viewRef.current.scale > 1 ? "pan" : "swipe";
      g.start = rest;
      g.view = viewRef.current;
      return;
    }
    if (pointers.current.size > 0) return;
    setMoving(false);

    if (g.kind === "swipe") {
      const w = stage.current?.clientWidth ?? 1;
      const dx = dragRef.current;
      if (dx < -w * 0.18) go(index + 1);
      else if (dx > w * 0.18) go(index - 1);
      setDragX(0);
    }
    if (viewRef.current.scale < 1.05) setView({ scale: 1, x: 0, y: 0 });

    // двойной тап — увеличить в точке / вернуть
    if (p && !g.moved && g.kind !== "pinch") {
      const now = Date.now();
      const prev = lastTap.current;
      if (prev && now - prev.t < DOUBLE_TAP_MS && dist(prev.p, p) < 30) {
        setView((v) => (v.scale > 1 ? { scale: 1, x: 0, y: 0 } : zoomAt(v, 2.5, local(p))));
        lastTap.current = null;
      } else lastTap.current = { t: now, p };
    }
    g.kind = "none";
  };

  const onWheel = (e: RWheelEvent<HTMLDivElement>) => {
    const at = local({ x: e.clientX, y: e.clientY });
    setView((v) => zoomAt(v, v.scale * Math.exp(-e.deltaY * 0.0025), at));
  };

  return (
    <div className={styles.viewer} role="dialog" aria-modal="true" aria-label={labels.dialog}>
      <div className={styles.top}>
        <span className={styles.count}>{count > 1 ? `${index + 1} / ${count}` : ""}</span>
        <button type="button" className={styles.btn} onClick={onClose} aria-label={labels.close}>
          <svg width="20" height="20" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div
        ref={stage}
        className={styles.stage}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onWheel={onWheel}
      >
        <div className={`${styles.track} ${moving ? "" : styles.animate}`} style={{ transform: `translateX(calc(${-index * 100}% + ${dragX}px))` }}>
          {images.map((img, i) => (
            <div key={img.src + i} className={styles.slide} aria-hidden={i !== index}>
              <div
                className={`${styles.zoom} ${moving ? "" : styles.animate}`}
                style={i === index ? { transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` } : undefined}
              >
                {Math.abs(i - index) <= 1 && <Image src={img.src} alt={img.alt} fill sizes="(max-width: 1023px) 200vw, 100vw" style={{ objectFit: "contain" }} draggable={false} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {count > 1 && (
        <>
          <button type="button" className={`${styles.btn} ${styles.prev}`} onClick={() => go(index - 1)} disabled={index === 0} aria-label={labels.prev}>
            ‹
          </button>
          <button type="button" className={`${styles.btn} ${styles.next}`} onClick={() => go(index + 1)} disabled={index === count - 1} aria-label={labels.next}>
            ›
          </button>
        </>
      )}
    </div>
  );
}
