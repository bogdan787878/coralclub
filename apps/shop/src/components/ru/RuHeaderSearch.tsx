"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RU_BASE } from "@/lib/ru/shop";
import { setSearchQuery, useSearchQuery } from "@/lib/ru/searchQuery";
import styles from "./RuHeaderSearch.module.css";

/**
 * Поиск в шапке на вебе (как у маркетплейсов): сразу поле, без иконки-перехода. Ввод открывает страницу поиска
 * с выдачей и дальше обновляет её на лету; поле страницы поиска на вебе скрыто — работает это.
 */
/** Когда в поле печатали в последний раз: шапка пересоздаётся при переходе (главная → поиск) — фокус возвращаем. */
let typedAt = 0;

export function RuHeaderSearch() {
  const q = useSearchQuery();
  const router = useRouter();
  const path = usePathname();
  const input = useRef<HTMLInputElement>(null);
  const onSearchPage = path.startsWith(`${RU_BASE}/search`);
  // печатали только что — после перехода и пересоздания шапки курсор остаётся в поле, в конце текста
  useEffect(() => {
    const el = input.current;
    if (!el || Date.now() - typedAt > 2000 || document.activeElement === el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [path]);
  const go = (v: string) => {
    if (!onSearchPage) router.push(`${RU_BASE}/search/${v.trim() ? `?q=${encodeURIComponent(v.trim())}` : ""}`);
  };
  return (
    <form
      className={styles.form}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        go(q);
        typedAt = 0;
        input.current?.blur();
      }}
    >
      <input
        ref={input}
        className={styles.input}
        type="search"
        enterKeyHint="search"
        placeholder="Искать в Coral Club"
        aria-label="Поиск по магазину"
        value={q}
        onChange={(e) => {
          typedAt = Date.now();
          setSearchQuery(e.target.value);
          go(e.target.value);
        }}
      />
      <button type="submit" className={styles.btn} aria-label="Найти">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
    </form>
  );
}
