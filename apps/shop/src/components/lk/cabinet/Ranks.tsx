"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { count, fmt, numOf } from "@/lib/lk/cabinet/format";
import { PRE, RANKS, rankRu, type Rank } from "@/lib/lk/cabinet/ranks";
import type { Cabinet } from "./useCabinet";
import { useSheet } from "./Sheet";

type Facts = { lo: number; go: number; branches: number; directors: number; sop: number } | null;
type Cond = { k: string; n: number; t: string; h: number | null };

/** Условия ранга: что нужно и сколько есть (h = null, если своих цифр нет). */
function rankRows(r: Rank, f: Facts): Cond[] {
  const rows: [string, number | null, number | undefined, string][] = [
    ["ЛО", r.lo, f?.lo, "Личный объём"],
    ["ГО", r.go, f?.go, "Групповой объём"],
    ["Ветви", r.branches, f?.branches, "Директорские ветви"],
    ["Дир.", r.directors, f?.directors, `Директоров в ${r.gens} поколениях`],
    [r.sopStar ? "СОП*" : "СОП", r.sop, f?.sop, "Сетевой объём поколений"],
  ];
  return rows
    .filter(([, n]) => n !== null)
    .map(([k, n, h, t]) => ({ k, n: n as number, t, h: h === undefined || h === null || Number.isNaN(h) ? null : h }));
}
function progressTo(r: Rank, f: Facts) {
  if (!f) return null;
  const rows = rankRows(r, f);
  const done = rows.filter((x) => x.h !== null && x.h >= x.n).length;
  return { done, total: rows.length, pct: Math.round((done / rows.length) * 100) };
}

function Goal({ r, p, label }: { r: Rank; p: { done: number; total: number; pct: number }; label?: string }) {
  return (
    <>
      <p className="rk-goal">
        <span>{label ?? `До «${r.gen}»`}</span>
        <b>
          {p.pct}% • {p.done} из {p.total}
        </b>
      </p>
      <div className="rk-bar" role="progressbar" aria-valuenow={p.pct} aria-valuemin={0} aria-valuemax={100}>
        <i style={{ width: `${p.pct}%` }} />
      </div>
    </>
  );
}

/**
 * Лента рангов (перенесено из paintUser кабинета): текущий, пройденные, следующий с прогрессом, закрытые. Кнопка «i»
 * открывает чек-лист условий ранга.
 */
export function Ranks({ cab }: { cab: Cabinet }) {
  const sheet = useSheet();
  const list = useRef<HTMLUListElement>(null);
  const [on, setOn] = useState(0);
  const d = cab.dash;
  const f: Facts = d ? { lo: numOf(d.volumePersonal), go: numOf(d.volumeGroup), branches: numOf(d.directorBranchesCount), directors: numOf(d.generationDirectorsCount), sop: numOf(d.volumeQualifyingStar) } : null;
  const metrics = cab.metrics && "json" in cab.metrics ? (cab.metrics.json as { data?: { volumeQualifyingStar?: { date: string; rank?: string; fullRank?: string }[] } }) : null;
  const star = [...(metrics?.data?.volumeQualifyingStar ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const codes = [cab.member?.rank, cab.member?.fullNameRank, star?.rank, star?.fullRank].filter((x): x is string => !!x);
  let cur: number | null = null;
  for (const t of codes) {
    const i = RANKS.findIndex((r) => r.codes.includes(t));
    if (i >= 0) {
      cur = i;
      break;
    }
    if (PRE.includes(t)) {
      cur = -1;
      break;
    }
  }
  const hasOwn = cur === null || cur < 0;
  const ready = cab.member !== null || cab.metrics !== null;
  const total = (hasOwn ? 1 : 0) + RANKS.length;

  // при первой отрисовке лента прокручена к текущему рангу
  const startKey = `${cur}|${codes[0]}`;
  const shownFor = useRef("");
  useEffect(() => {
    const el = list.current;
    if (!el || !ready || shownFor.current === startKey) return;
    shownFor.current = startKey;
    const start = hasOwn ? 0 : (cur as number);
    const item = el.children[start] as HTMLElement | undefined;
    if (item) el.scrollLeft = item.offsetLeft - el.offsetLeft;
  }, [ready, startKey, hasOwn, cur]);

  const onScroll = () => {
    const el = list.current;
    if (!el) return;
    const x = el.getBoundingClientRect().left;
    let best = 0;
    [...el.children].forEach((c, i) => {
      const dx = Math.abs(c.getBoundingClientRect().left - x);
      if (dx < Math.abs(el.children[best].getBoundingClientRect().left - x)) best = i;
    });
    setOn(best);
  };

  const openRank = (i: number) => {
    const r = RANKS[i];
    const mine = cur === null ? i === 0 : i === cur || i === cur + 1 || (cur === -1 && i === 0);
    const rows = rankRows(r, mine ? f : null);
    sheet.open(
      `До «${r.gen}»`,
      <div className="sheet-form">
        <ul className="rk-list">
          {rows.map((x) => {
            const ok = x.h !== null && x.h >= x.n;
            return (
              <li key={x.k} className={ok ? "ok" : ""}>
                <span className="rk-box" aria-hidden="true">
                  {ok ? "✓" : ""}
                </span>
                <div>
                  <b>{x.t}</b>
                  <span>{x.h !== null ? `${fmt(x.h)} из ${fmt(x.n)}` : `нужно ${fmt(x.n)}`}</span>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="muted">
          Условия считаются за {count(r.months, ["месяц", "месяца", "месяцев"])} подряд. {r.opens}.
        </p>
      </div>,
    );
  };
  const info = (i: number) => (
    <button className="rk-info" type="button" aria-label="Что нужно сделать" onClick={() => openRank(i)}>
      <Icon name="info" size={22} />
    </button>
  );

  if (!ready) {
    return (
      <ul className="rkslider" aria-label="Ранги">
        <li className="rk rk-load" role="status" aria-label="Загрузка">
          <h2 className="rk-name">
            <i className="sk" />
          </h2>
          <p className="rk-phrase rk-sk">
            <i className="sk" />
          </p>
          <p className="rk-phrase rk-sk">
            <i className="sk" />
          </p>
        </li>
      </ul>
    );
  }

  const card = (r: Rank, i: number) => {
    const st = cur === null ? "plain" : i < cur ? "past" : i === cur ? "now" : i === cur + 1 ? "next" : "ahead";
    const target = st === "now" ? (RANKS[i + 1] ?? r) : r; // у текущего шкала ведёт к следующему рангу
    const ti = st === "now" && RANKS[i + 1] ? i + 1 : i;
    let side = info(i);
    let body;
    if (st === "past") {
      side = (
        <i aria-hidden="true">
          <Icon name="check" size={22} />
        </i>
      );
      body = <p className="rk-phrase">Ранг пройден</p>;
    } else if (st === "ahead") {
      body = (
        <p className="rk-phrase">
          <span className="rk-lock" aria-hidden="true">
            <Icon name="lock" size={22} />
          </span>
          Откроется после ранга «{RANKS[i - 1].name}»
        </p>
      );
    } else if (st === "plain") {
      body = <p className="rk-phrase">Что нужно для этого ранга</p>;
    } else if (st === "now" && !RANKS[i + 1]) {
      body = <p className="rk-phrase">Высший ранг в таблице условий</p>;
    } else {
      const p = progressTo(target, f);
      body = p ? (
        <Goal r={target} p={p} label={st === "next" ? "Условия ранга" : undefined} />
      ) : (
        <p className="rk-phrase rk-sk">
          <i className="sk" />
        </p>
      );
      side = info(ti);
    }
    return (
      <li key={r.codes[0]} className={`rk rk-${r.tone} rk-${st}`} title={`${r.perk}: ${r.opens}`}>
        <h2 className="rk-name">
          <span>{r.name}</span>
          {side}
        </h2>
        {body}
      </li>
    );
  };

  const own = () => {
    const code = codes[0];
    const pre = cur === -1;
    const p = pre ? progressTo(RANKS[0], f) : null;
    return (
      <li key="own" className="rk rk-x rk-now" title={`Код ранга из API: ${code ?? "нет"}`}>
        <h2 className="rk-name">
          <span>{code ? rankRu(code) : " "}</span>
          {pre && info(0)}
        </h2>
        {pre ? (
          p ? (
            <Goal r={RANKS[0]} p={p} />
          ) : (
            <p className="rk-phrase rk-sk">
              <i className="sk" />
            </p>
          )
        ) : (
          <p className="rk-phrase">Ваш ранг</p>
        )}
      </li>
    );
  };

  return (
    <>
      <ul className="rkslider" tabIndex={0} aria-label="Ранги" ref={list} onScroll={() => requestAnimationFrame(onScroll)}>
        {hasOwn && own()}
        {RANKS.map(card)}
      </ul>
      <div className="rkdots" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <i key={i} className={i === on ? "on" : ""} />
        ))}
      </div>
    </>
  );
}
