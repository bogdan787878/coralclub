"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui";

/**
 * Нижний лист кабинета (как в кабинете на чистом JS: .sheet-wrap / .sheet / .sheet-head). Открывается из любого
 * места экрана: const sheet = useSheet(); sheet.open("Заголовок", <Содержимое />).
 */
type SheetApi = { open: (title: string, body: ReactNode) => void; close: () => void };
const Ctx = createContext<SheetApi>({ open: () => {}, close: () => {} });
export const useSheet = () => useContext(Ctx);

export function SheetProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<{ title: string; body: ReactNode } | null>(null);
  const close = useCallback(() => setSheet(null), []);
  const open = useCallback((title: string, body: ReactNode) => setSheet({ title, body }), []);
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet, close]);
  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      {sheet && (
        <div className="sheet-wrap">
          <div className="sheet-back" onClick={close} />
          <div className="sheet" role="dialog" aria-label={sheet.title}>
            <div className="sheet-head">
              <h2>{sheet.title}</h2>
              <button className="sheet-x" type="button" aria-label="Закрыть" onClick={close}>
                <Icon name="close" />
              </button>
            </div>
            {sheet.body}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

/** Подсказка «?»: всплывает поверх страницы, закрывается по клику мимо, Escape и прокрутке. */
export function Hint({ text }: { text: string }) {
  const [at, setAt] = useState<{ left: number; top: number; width: number } | null>(null);
  useEffect(() => {
    if (!at) return;
    const off = () => setAt(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && off();
    window.addEventListener("click", off);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", off, true);
    window.addEventListener("resize", off);
    return () => {
      window.removeEventListener("click", off);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", off, true);
      window.removeEventListener("resize", off);
    };
  }, [at]);
  return (
    <>
      <button
        className="mi"
        type="button"
        aria-label="Что это за показатель"
        aria-expanded={!!at}
        onClick={(e) => {
          e.stopPropagation();
          if (at) return setAt(null);
          const r = e.currentTarget.getBoundingClientRect();
          const width = Math.min(260, window.innerWidth - 24);
          setAt({ width, left: Math.min(Math.max(12, r.right - width), window.innerWidth - width - 12), top: r.bottom + 8 });
        }}
      >
        ?
      </button>
      {at && (
        <div className="hint-pop" role="tooltip" style={{ position: "fixed", ...at }} onClick={(e) => e.stopPropagation()}>
          {text}
        </div>
      )}
    </>
  );
}

/* ---------- шимер: заглушки на время загрузки (как в кабинете) ---------- */
export const SkLines = ({ n = 3 }: { n?: number }) => (
  <div className="sk-lines" role="status" aria-label="Загрузка">
    {Array.from({ length: n }, (_, i) => (
      <i key={i} className="sk" style={{ width: `${[92, 74, 58][i % 3]}%` }} />
    ))}
  </div>
);
export const SkRows = ({ n = 3 }: { n?: number }) => (
  <ul className="sk-rows" role="status" aria-label="Загрузка">
    {Array.from({ length: n }, (_, i) => (
      <li key={i}>
        <i className="sk sk-dot" />
        <span>
          <i className="sk" style={{ width: "62%" }} />
          <i className="sk" style={{ width: "38%" }} />
        </span>
        <i className="sk sk-sum" />
      </li>
    ))}
  </ul>
);
export const SkTiles = ({ title, n = 4, cls = "" }: { title: string; n?: number; cls?: string }) => (
  <>
    <div className="mtop">
      <h2 className="mtitle">{title}</h2>
    </div>
    <div className={`mgrid ${cls}`} role="status" aria-label="Загрузка">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="mcard sk-card">
          <i className="sk" style={{ width: "70%" }} />
          <i className="sk sk-big" />
          <i className="sk" style={{ width: "50%" }} />
        </div>
      ))}
    </div>
  </>
);
