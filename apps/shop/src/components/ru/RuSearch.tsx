"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createSearch, type Search, type SearchDoc } from "@coral/search";
import { Container } from "@/components/ui";
import { useRuPrices } from "@/lib/ru/live";
import { RU_BASE, RU_PRODUCTS, ruProductByCode, type RuProduct } from "@/lib/ru/shop";
import { RuCard } from "./RuCards";
import grid from "./RuCatalog.module.css";
import styles from "./RuSearch.module.css";

/** Частые запросы — пока ничего не введено. */
const POPULAR = ["Энергия", "Плохо сплю", "Коллаген", "Магний", "Детокс", "Иммунитет", "Для суставов", "Без глютена"];

/** Интент поиска → домен каталога (плашка «Похоже, вы ищете…» ведёт туда). */
const INTENT_DOMAIN: Record<string, string> = {
  energy: "energy",
  sleep: "sleep-stress",
  immunity: "immunity",
  digestion: "digestion-gut",
  skin: "skin-hair-nails",
  weight: "weight-metabolism",
  brain: "brain-focus",
  heart: "heart-vessels",
  joints: "bones-joints",
  aging: "longevity",
  vision: "vision-eyes",
  women: "reproductive",
};

type Extra = { code: number; en: string; terms: string[]; ingredients: string[]; text: string };

/** Индекс поиска: товары каталога + то, что знает канон (content/ru/search.json — грузится только здесь). */
let engine: Promise<Search> | null = null;
function loadEngine(): Promise<Search> {
  engine ??= import("../../../content/ru/search.json").then((m) => {
    const extra = new Map((m.default as Extra[]).map((e) => [e.code, e]));
    const docs: SearchDoc[] = RU_PRODUCTS.map((p) => {
      const e = extra.get(p.code);
      return {
        id: String(p.code),
        title: p.name,
        aliases: [e?.en ?? "", ...(e?.terms ?? []), p.pack].filter(Boolean),
        codes: p.codes.map(String),
        ingredients: e?.ingredients ?? [],
        domains: p.domains,
        phases: p.phase,
        feats: p.feat,
        forms: p.formGroup ? [p.formGroup] : [],
        text: e?.text ?? p.lead,
      };
    });
    return createSearch(docs);
  });
  return engine;
}

/**
 * Поиск магазина России (движок — пакет @coral/search): по названию, артикулу и составу, с опечатками и
 * неверной раскладкой, по намерению («плохо сплю» → сон и стресс) и со стоп-словами БАД (болезни — без товаров,
 * лечение — предупреждение). Запрос в адресе: /search/?q=магний.
 */
export function RuSearch() {
  const prices = useRuPrices();
  const [search, setSearch] = useState<Search | null>(null);
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    loadEngine().then((s) => alive && setSearch(s));
    const fromUrl = new URLSearchParams(window.location.search).get("q") ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- адрес известен только в браузере
    if (fromUrl) setQ(fromUrl);
    input.current?.focus();
    return () => {
      alive = false;
    };
  }, []);

  // запрос — в адрес (назад возвращает к выдаче)
  useEffect(() => {
    const t = setTimeout(() => {
      const url = new URL(window.location.href);
      if (q.trim()) url.searchParams.set("q", q.trim());
      else url.searchParams.delete("q");
      window.history.replaceState(null, "", url);
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  const result = useMemo(() => (search && q.trim() ? search.search(q) : null), [search, q]);
  const products = useMemo(() => {
    const list = (result?.ids ?? []).map((id) => ruProductByCode(id)).filter((p): p is RuProduct => Boolean(p));
    const sold = (p: RuProduct) => {
      const l = prices.get(p.code);
      return !l || (l.available && l.club !== null);
    };
    return [...list.filter(sold), ...list.filter((p) => !sold(p))];
  }, [result, prices]);

  const domainIntents = (result?.intents ?? []).filter((i) => i.kind === "domain" && INTENT_DOMAIN[i.id]);
  const phaseIntents = (result?.intents ?? []).filter((i) => i.kind === "phase");

  return (
    <main className={styles.page} data-analytics-location="search">
      <Container>
        <form
          className={styles.form}
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            input.current?.blur();
          }}
        >
          <svg className={styles.icon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={input}
            className={styles.input}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            placeholder="Название, артикул, состав или беспокоит"
            aria-label="Поиск по магазину"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button type="button" className={styles.clear} onClick={() => (setQ(""), input.current?.focus())} aria-label="Очистить">
              ×
            </button>
          )}
        </form>

        {!q.trim() && (
          <section className={styles.block}>
            <p className={styles.label}>Часто ищут</p>
            <div className={styles.chips}>
              {POPULAR.map((p) => (
                <button key={p} type="button" className={styles.chip} onClick={() => setQ(p)}>
                  {p}
                </button>
              ))}
            </div>
          </section>
        )}


        {result && (
          <>
            {result.notice && (
              <div className={`${styles.notice} ${result.status === "blocked" ? styles.noticeStrong : ""}`} role="note">
                {result.notice}
              </div>
            )}
            {result.understood && (
              <p className={styles.note}>
                Показываем результаты по запросу «{result.understood}»
              </p>
            )}
            {(domainIntents.length > 0 || phaseIntents.length > 0) && (
              <div className={styles.block}>
                <p className={styles.label}>Похоже, вы ищете</p>
                <div className={styles.chips}>
                  {domainIntents.map((i) => (
                    <Link key={i.id} className={`${styles.chip} ${styles.chipIntent}`} href={`${RU_BASE}/catalog/?d=${INTENT_DOMAIN[i.id]}`}>
                      {i.label} →
                    </Link>
                  ))}
                  {phaseIntents.map((i) => (
                    <Link key={i.id} className={`${styles.chip} ${styles.chipIntent}`} href={`${RU_BASE}/#phases`}>
                      {i.label} →
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {result.status === "ok" &&
              (products.length ? (
                <>
                  <p className={styles.count}>
                    {result.partial ? "Точных совпадений нет — похожие товары" : `Найдено: ${products.length}`}
                  </p>
                  <ul key={result.ids.join(",")} className={`${grid.grid} ${styles.results}`} data-analytics-list="search">
                    {products.map((p, i) => (
                      <li key={p.code}>
                        <RuCard p={p} index={i + 1} />
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className={styles.block}>
                  <p className={styles.note}>Ничего не нашли. Попробуйте иначе или загляните в каталог.</p>
                  <Link className={`${styles.chip} ${styles.chipIntent}`} href={`${RU_BASE}/catalog/`}>
                    Каталог →
                  </Link>
                </div>
              ))}
          </>
        )}
      </Container>
    </main>
  );
}
