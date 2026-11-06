"use client";

import { useState } from "react";
import { count, fmt, MONTHS_RU } from "@/lib/lk/cabinet/format";
import { buildMetrics, METRIC_INFO, type Tile } from "@/lib/lk/cabinet/metrics";
import { lineLabel, personName, rankNameOf, type Member, type Tasks } from "@/lib/lk/cabinet/tasks";
import type { Cabinet } from "./useCabinet";
import { Hint, SkTiles, useSheet } from "./Sheet";

/* ---------- «Мои показатели»: карусель плиток с мини-графиком ---------- */
function Chart({ c }: { c: NonNullable<Tile["chart"]> }) {
  const W = 88;
  const H = 52;
  const gap = 4;
  const bw = (W - gap * (c.points.length - 1)) / c.points.length;
  const max = Math.max(...c.points.map((p) => p.v), 1);
  return (
    <svg className="mchart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={c.label}>
      {c.points.map((p, i) => {
        const h = Math.max(4, (p.v / max) * (H - 2));
        return (
          <rect key={i} className={i === c.hi ? "now" : ""} x={(i * (bw + gap)).toFixed(1)} y={(H - h).toFixed(1)} width={bw.toFixed(1)} height={h.toFixed(1)} rx="3">
            <title>{p.tip}</title>
          </rect>
        );
      })}
    </svg>
  );
}

export function Metrics({ cab }: { cab: Cabinet }) {
  const m = cab.metrics;
  if (!m) return <section className="home-metrics metrics"><SkTiles title="МОИ ПОКАЗАТЕЛИ" n={3} cls="mcar" /></section>;
  const built = "error" in m ? { message: m.error } : buildMetrics(m.json, cab.dash);
  return (
    <section className="home-metrics metrics">
      {"message" in built ? (
        <>
          <h2 className="mtitle">МОИ ПОКАЗАТЕЛИ</h2>
          <p className="muted">{built.message}</p>
        </>
      ) : (
        <>
          <div className="mtop">
            <h2 className="mtitle">МОИ ПОКАЗАТЕЛИ</h2>
          </div>
          <div className="mgrid mcar">
            {built.tiles.map((t) => (
              <article key={t.key} className="mcard" data-k={t.key}>
                <div className="mhead">
                  <h3>{t.title}</h3>
                  <Hint text={METRIC_INFO[t.key]} />
                </div>
                <div className="mbody">
                  <div className="mval">
                    <p className="mbig">{t.big}</p>
                    <p className="msub">{t.sub}</p>
                  </div>
                  {t.chart && <Chart c={t.chart} />}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* ---------- «Задачи»: новые, уходящие, директора, давно не заказывали, до порога, дни рождения ---------- */
type PRow = { name: string; sub: string; side?: string };
function People({ groups, empty, hint }: { groups: { label: string; rows: PRow[] }[]; empty: string; hint?: string }) {
  const [cur, setCur] = useState(0);
  const g = groups[cur];
  return (
    <div className="sheet-form">
      {hint && <p className="muted">{hint}</p>}
      {groups.length > 1 && (
        <div className="seg" role="group">
          {groups.map((x, i) => (
            <button key={x.label} type="button" className={i === cur ? "on" : ""} onClick={() => setCur(i)}>
              {x.label} · {x.rows.length}
            </button>
          ))}
        </div>
      )}
      {g.rows.length ? (
        <ul className="h-list">
          {g.rows.map((r, i) => (
            <li key={i} className="h-row">
              <div className="h-main">
                <b>{r.name}</b>
                <span>{r.sub}</span>
              </div>
              {r.side && <span className="h-sum">{r.side}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{empty}</p>
      )}
    </div>
  );
}

const INFO_T = {
  fresh: "Люди, зарегистрировавшиеся в этом месяце. Крупная цифра — ваша первая линия, в подписи — вся структура. Пока человек не сделал первый заказ, он кандидат.",
  leaving: "Кандидаты без первого заказа: на заказ осталось не больше 7 дней или срок уже вышел, потом их удалят. Крупная цифра — ваша первая линия, в подписи — вся структура.",
  dirs: "Директора в ваших поколениях. К 1-му поколению относятся директора, над которыми нет других директоров. «Всего» — во всех поколениях.",
  bd: "Дни рождения участников вашей структуры в ближайшие 7 дней. Дата видна только у тех, кто разрешил её показывать.",
  stale: "Участники, которые не делали заказов от 3 до 11 месяцев: их ещё можно вернуть. Крупная цифра — ваша первая линия, в подписи — вся структура. Кандидатов здесь нет.",
  near: "Дистрибьюторы с групповым объёмом ниже 500 (порог директора) или от 500 до 750 (порог экстрабонуса). Крупная цифра — ваша первая линия, в подписи — вся структура.",
};
const SHORT_MONTHS = ["янв.", "февр.", "марта", "апр.", "мая", "июня", "июля", "авг.", "сент.", "окт.", "нояб.", "дек."];
const dayWord = (n: number) => count(n, ["день", "дня", "дней"]);

export function TasksBlock({ cab }: { cab: Cabinet }) {
  const sheet = useSheet();
  const t = cab.tasks;
  if (!t) return <section className="home-metrics metrics"><SkTiles title="ЗАДАЧИ" n={2} /></section>;
  if ("error" in t) {
    return (
      <section className="home-metrics metrics">
        <div className="mtop">
          <h2 className="mtitle">ЗАДАЧИ</h2>
        </div>
        <p className="muted">{t.error}</p>
      </section>
    );
  }
  const T = t as Tasks;
  const mon = MONTHS_RU[new Date().getMonth()];
  const gen1 = T.directors.filter((d) => d.gen === 1).length;
  const sub = (m: Member, tail: string) => [lineLabel(m), tail].filter(Boolean).join(" · ");
  const mineAll = (rows: Member[], map: (m: Member) => PRow) => [
    { label: "Мои", rows: T.mine(rows).map(map) },
    { label: "В структуре", rows: rows.map(map) },
  ];
  const open: Record<keyof typeof INFO_T, () => void> = {
    fresh: () =>
      sheet.open(
        "Новые участники",
        <People
          groups={mineAll(T.fresh, (m) => ({ name: personName(m), sub: sub(m, m.status === "CANDIDATE" ? "кандидат" : "с заказом"), side: m.registrationDays != null ? `рег. ${dayWord(m.registrationDays)} назад` : "" }))}
          empty="Новых участников в этом месяце нет."
          hint={`Зарегистрировались в этом месяце (${mon}). Пока без заказа они кандидаты.`}
        />,
      ),
    leaving: () =>
      sheet.open(
        "Уходящие участники",
        <People
          groups={mineAll(T.leaving, (m) => {
            const left = (m as Member & { left: number }).left;
            return { name: personName(m), sub: sub(m, "кандидат"), side: left > 0 ? `до удаления ${dayWord(left)}` : left === 0 ? "последний день" : "срок вышел" };
          })}
          empty="Сейчас никто не уходит."
          hint="Кандидаты без первого заказа: до удаления осталось не больше 7 дней или срок уже вышел."
        />,
      ),
    dirs: () =>
      sheet.open(
        "Директора",
        <People groups={[{ label: "В ваших поколениях", rows: T.directors.map((m) => ({ name: personName(m), sub: sub(m, rankNameOf(m.rank)), side: `${m.gen}-е пок.` })) }]} empty="Директоров в ваших поколениях пока нет." />,
      ),
    stale: () =>
      sheet.open(
        "Давно не заказывали",
        <People
          groups={mineAll(T.stale, (m) => ({ name: personName(m), sub: sub(m, m.position === "CONSUMER" ? "потребитель" : "дистрибьютор"), side: `${count(m.monthsWithoutPoints ?? 0, ["месяц", "месяца", "месяцев"])} без заказа` }))}
          empty="Сейчас таких участников нет."
          hint="Не заказывали от 3 до 11 месяцев. Сверху те, кого проще вернуть."
        />,
      ),
    near: () => {
      const row = (th: number) => (m: Member) => ({ name: personName(m), sub: sub(m, `ГО ${fmt(Number(m.volumeGroup))}`), side: `не хватает ${fmt(th - Number(m.volumeGroup))}` });
      sheet.open(
        "Не хватает до порога",
        <People
          groups={[
            { label: "До 500", rows: T.to500.map(row(500)) },
            { label: "До 750", rows: T.to750.map(row(750)) },
          ]}
          empty="Сейчас ни у кого нет объёма в этом диапазоне."
          hint="Групповой объём (ГО) за текущий месяц: 500 — порог директора, 750 — порог экстрабонуса."
        />,
      );
    },
    bd: () =>
      sheet.open(
        "Дни рождения",
        <People groups={[{ label: "На этой неделе", rows: T.birthdays.map((m) => ({ name: personName(m), sub: lineLabel(m), side: m.in === 0 ? "сегодня" : `${m.when.getDate()} ${SHORT_MONTHS[m.when.getMonth()]}` })) }]} empty="На этой неделе дней рождения нет." />,
      ),
  };
  const tiles: [keyof typeof INFO_T, string, string, string][] = [
    ["fresh", "Новые участники", String(T.mine(T.fresh).length), `в 1-й линии за ${mon} · в структуре ${T.fresh.length}`],
    ["leaving", "Уходящие участники", String(T.mine(T.leaving).length), `в 1-й линии · в структуре ${T.leaving.length}`],
    ["dirs", "Директора", String(gen1), `в 1-м поколении · во всех ${T.directors.length}`],
    ["stale", "Давно не заказывали", String(T.mine(T.stale).length), `в 1-й линии · в структуре ${T.stale.length}`],
    ["near", "Не хватает до порога", String(T.mine([...T.to500, ...T.to750]).length), `в 1-й линии · в структуре ${T.to500.length + T.to750.length}`],
    ["bd", "Дни рождения", String(T.birthdays.length), "в ближайшие 7 дней"],
  ];
  return (
    <section className="home-metrics metrics" id="tasks">
      <div className="mtop">
        <h2 className="mtitle">ЗАДАЧИ</h2>
      </div>
      <div className="mgrid tcar">
        {tiles.map(([key, title, big, subline]) => (
          <article
            key={key}
            className="mcard mtap"
            role="button"
            tabIndex={0}
            onClick={open[key]}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open[key]();
              }
            }}
          >
            <div className="mhead">
              <h3>{title}</h3>
              <Hint text={INFO_T[key]} />
            </div>
            <div className="mval">
              <p className="mbig">{big}</p>
              <p className="msub">{subline}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
