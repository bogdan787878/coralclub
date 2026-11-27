"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FloatInput, Icon, Sheet } from "@/components/ui";
import {
  cityComponents,
  newSession,
  suggestCities,
  type CitySuggestion,
} from "@/lib/addressSearch";
import {
  POPULAR,
  chooseRuCity,
  cityByGeolocation,
  cityFromComponents,
  detectRuCity,
  placesReady,
  sameCity,
  searchLocalCities,
  useRuCity,
  useRuCityState,
  type RuCity,
} from "@/lib/ru/city";
import styles from "./Ru.module.css";

const OPEN = "cc:ru:city:open";
const ASKED = "ru_city_asked";

/** Кнопка города в шапке: открывает выбор. */
export function RuCityButton() {
  const city = useRuCity();
  return (
    <button
      type="button"
      className={styles.cityBtn}
      onClick={() => window.dispatchEvent(new Event(OPEN))}
      aria-label={city ? `Город: ${city.city}. Изменить` : "Выбрать город"}
    >
      <Icon name="pin" size={18} />
      <span>{city?.city ?? "Город"}</span>
    </button>
  );
}

type Row = {
  key: string;
  city: string;
  area: string;
  pick: () => Promise<RuCity | null>;
};

/**
 * Город магазина — шторка снизу (на вебе панель справа). На главной при первом заходе: «Ваш город — X?»
 * (X — по IP), «Да, верно» / «Выбрать другой». Выбор: поиск города (Google Places, без ключа — по списку),
 * «Определить по геолокации», частые города. От города зависят наличие и доставка.
 */
export function RuCitySheet({ isHome }: { isHome: boolean }) {
  const state = useRuCityState();
  const city = useRuCity();
  // "auto": пока человек ничего не нажал — спросить на главной, если город не подтверждён и в этой вкладке не спрашивали
  const [mode, setMode] = useState<"auto" | "closed" | "confirm" | "pick">(
    "auto",
  );
  const [askedBefore] = useState(() => {
    try {
      return (
        typeof window !== "undefined" &&
        Boolean(window.sessionStorage.getItem(ASKED))
      );
    } catch {
      return false;
    }
  });
  const shownMode =
    mode === "auto"
      ? isHome && state && !state.chosen && !askedBefore
        ? "confirm"
        : "closed"
      : mode;

  const [query, setQuery] = useState("");
  const [google, setGoogle] = useState<{ q: string; rows: Row[] } | null>(null);
  const [places, setPlaces] = useState<boolean | null>(null);
  const session = useRef<unknown>(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  // догадка по IP — один раз, если город ещё не известен
  useEffect(() => {
    void detectRuCity();
  }, []);

  // спросили — больше в этой вкладке не спрашивать
  useEffect(() => {
    if (shownMode !== "confirm" || mode !== "auto") return;
    try {
      window.sessionStorage.setItem(ASKED, "1");
    } catch {
      /* без хранилища */
    }
  }, [shownMode, mode]);

  useEffect(() => {
    const open = () => setMode("pick");
    window.addEventListener(OPEN, open);
    return () => window.removeEventListener(OPEN, open);
  }, []);

  const close = useCallback(() => {
    setMode("closed");
    setQuery("");
    setMsg("");
    session.current = null;
  }, []);

  const choose = useCallback(
    (c: RuCity) => {
      chooseRuCity(c);
      close();
    },
    [close],
  );

  // поиск: Google Places по сессии ввода, без ключа (или если Google отказал) — список городов
  const q = query.trim();
  useEffect(() => {
    if (shownMode !== "pick") return;
    let alive = true;
    if (places === null)
      void placesReady().then((ok) => alive && setPlaces(ok));
    if (!q || !places) {
      return () => {
        alive = false;
      };
    }
    const t = setTimeout(async () => {
      try {
        session.current ??= await newSession();
        const found = await suggestCities(q, session.current);
        if (!alive) return;
        setGoogle({
          q,
          rows: found.map((s: CitySuggestion, i) => ({
            key: `g:${i}:${s.main}|${s.secondary}`,
            city: s.main,
            area: s.secondary.replace(/,?\s*Россия$/, ""),
            pick: async () => {
              const c = cityFromComponents(await cityComponents(s));
              session.current = null; // выбор закрывает сессию ввода Google
              return c;
            },
          })),
        });
      } catch {
        if (alive) setPlaces(false);
      }
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [shownMode, q, places]);

  const localRows = (text: string): Row[] =>
    searchLocalCities(text).map((c) => ({
      key: `l:${c.city}|${c.area}`,
      city: c.city,
      area: c.area,
      pick: async () => c,
    }));
  // Google — пока ждём ответа на новый запрос, остаются прежние подсказки
  const rows = !q || !places ? localRows(q) : (google?.rows ?? []);

  const pickRow = async (r: Row) => {
    setBusy(r.key);
    setMsg("");
    const c = await r.pick().catch(() => null);
    setBusy("");
    if (c) choose(c);
    else setMsg("Этот город не в России — выберите город России.");
  };

  const locate = async () => {
    setBusy("geo");
    setMsg("");
    try {
      const c = await cityByGeolocation();
      if (c) choose(c);
      else setMsg("Похоже, вы не в России. Выберите город из списка.");
    } catch (e) {
      setMsg(
        e instanceof Error ? e.message : "Не удалось определить местоположение",
      );
    } finally {
      setBusy("");
    }
  };

  if (!city) return null;

  // без запроса: текущий город (если его нет среди частых) и частые города
  const here: Row = {
    key: `c:${city.city}|${city.area}`,
    city: city.city,
    area: city.area,
    pick: async () => city,
  };
  const shown =
    !q && !POPULAR.some((c) => sameCity(c, city)) ? [here, ...rows] : rows;

  if (shownMode === "confirm") {
    return (
      <Sheet
        open
        onClose={close}
        title={`Ваш город — ${city.city}?`}
        closeLabel="Закрыть"
      >
        <p className={styles.cityText}>
          От города зависят наличие товаров и условия доставки.
        </p>
        <div className={styles.cityActions}>
          <Button variant="primary" block onClick={() => choose(city)}>
            Да, верно
          </Button>
          <Button variant="secondary" block onClick={() => setMode("pick")}>
            Выбрать другой
          </Button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      open={shownMode === "pick"}
      onClose={close}
      title="Выберите город"
      closeLabel="Закрыть"
    >
      <div className={styles.cityPick}>
        <p className={styles.cityText}>
          От города зависят наличие товаров и условия доставки.
        </p>
        <FloatInput
          name="ru-city"
          type="search"
          label="Город"
          placeholder="Начните вводить название"
          value={query}
          onChange={setQuery}
          autoComplete="off"
        />
        <button
          type="button"
          className={styles.cityLocate}
          onClick={locate}
          disabled={busy === "geo"}
        >
          <Icon name="pin" size={18} />
          {busy === "geo" ? "Определяем…" : "Определить по геолокации"}
        </button>
        {msg && (
          <p className={`${styles.authMsg} ${styles.authBad}`} role="status">
            {msg}
          </p>
        )}
        <ul className={styles.cityList}>
          {rows.length === 0 && q && (!places || google?.q === q) && (
            <li className={styles.cityEmpty}>Город не найден</li>
          )}
          {shown.map((r) => {
            const current = sameCity(r, city);
            return (
              <li key={r.key}>
                <button
                  type="button"
                  className={styles.cityRow}
                  aria-current={current || undefined}
                  disabled={Boolean(busy)}
                  onClick={() => (current ? close() : pickRow(r))}
                >
                  <span>
                    <strong>{r.city}</strong>
                    {r.area && r.area !== r.city && <small>{r.area}</small>}
                  </span>
                  {busy === r.key ? (
                    <span className={styles.citySpin}>…</span>
                  ) : current ? (
                    <Icon name="check" size={18} />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Sheet>
  );
}
