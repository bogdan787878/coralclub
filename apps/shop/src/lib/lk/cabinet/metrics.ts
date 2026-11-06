/**
 * «Мои показатели»: плитки с цифрой и мини-графиком по месяцам (перенесено из metrics.js кабинета).
 * Данные: GET /account/metrics (закрытые месяцы) и GET /account/dashboard (текущий месяц).
 * По кастдевам: СОП* первым и крупно; только абсолютные числа с подписью «относительно чего»; у каждой метрики «?».
 */
import { RANKS, rankRu } from "./ranks";

const MONTHS_NOM = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
const MONTHS_PREP = ["январе", "феврале", "марте", "апреле", "мае", "июне", "июле", "августе", "сентябре", "октябре", "ноябре", "декабре"];
type Row = { date: string; total?: number | string; rank?: string; fullRank?: string; countries?: { country: string; shared: number | string }[] };
export type Dash = Record<string, unknown> | null;
export type ChartPoint = { v: number; tip: string };
export type Tile = { key: "sop" | "group" | "rank" | "geo"; title: string; big: string; sub: string; chart?: { points: ChartPoint[]; label: string; hi: number } };

export const METRIC_INFO: Record<Tile["key"], string> = {
  rank: "Ранг, закрытый по итогам последнего закрытого месяца.",
  sop: "СОП* — сетевой объём поколений со звёздочкой: показатель, который лидеры смотрят каждый день. СОП — сетевой объём поколений без звёздочки. Объём в баллах. План берётся из кабинета.",
  group: "ГО — групповой объём: баллы вашей группы за месяц. Личный объём (ЛО) входит в групповой.",
  geo: "Доля СОП по странам: какую часть объёма дала каждая страна в закрытом месяце. «Нет данных» — если за месяц объёма не было.",
};

const monthIdx = (iso: string) => Number(String(iso).slice(5, 7)) - 1;
const asc = (a: Row[] | undefined) => [...(a ?? [])].sort((x, y) => (x.date < y.date ? -1 : 1));
const n = (v: unknown): number | null => {
  const x = Number(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(x) ? x : null;
};
const fmt = (v: number | null) => (v === null ? "—" : v.toLocaleString("ru-RU", { maximumFractionDigits: 1 }));

/** Текущий месяц «ГГГГ-ММ»: из дашборда (currentMonth = ГГММ), иначе по часам компьютера. */
function currentKey(dash: Dash) {
  const m = String(dash?.currentMonth ?? "");
  if (/^\d{4}$/.test(m)) return `20${m.slice(0, 2)}-${m.slice(2)}`;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
const chart = (points: ChartPoint[], label: string, hi = points.length - 1) => (points.length < 2 ? undefined : { points, label, hi });
const monthPoints = (rows: Row[], live: number | null, cur: string) => {
  const pts = rows.slice(-5).map((m) => ({ v: n(m.total) ?? 0, tip: `${MONTHS_NOM[monthIdx(m.date)]}: ${fmt(n(m.total))}` }));
  if (live !== null) pts.push({ v: live, tip: `${MONTHS_NOM[monthIdx(cur)]} (идёт): ${fmt(live)}` });
  return pts.slice(-6);
};
const planPart = (plan: number | null) => (plan && plan > 0 ? `, план ${fmt(plan)}` : "");

function volumeTile(key: "sop" | "group", title: string, rows: Row[], live: number | null, plan: number | null, cur: string, last: Row | undefined, label: string): Tile {
  const value = live ?? (rows.length ? n(rows[rows.length - 1].total) : null);
  const sub = live !== null ? `в ${MONTHS_PREP[monthIdx(cur)]}${planPart(plan)}` : last ? `за ${MONTHS_NOM[monthIdx(last.date)]}` : "";
  return { key, title, big: fmt(value), sub, chart: chart(monthPoints(rows, live, cur), label) };
}
function rankTile(star: Row[]): Tile {
  const cur = star[star.length - 1];
  const level = (m: Row) => RANKS.findIndex((r) => r.codes.includes(m.rank ?? "")) + 1; // ниже директора — самый низкий
  const pts = star.slice(-6).map((m) => ({ v: level(m), tip: `${MONTHS_NOM[monthIdx(m.date)]}: ${rankRu(m.fullRank || m.rank)}` }));
  return { key: "rank", title: "Закрытый ранг", big: rankRu(cur.fullRank || cur.rank), sub: `за ${MONTHS_NOM[monthIdx(cur.date)]}`, chart: chart(pts, "Закрытый ранг по месяцам") };
}
function geoTile(geo: Row[]): Tile {
  const withData = [...geo].reverse().find((m) => Number(m.total) > 0 && (m.countries ?? []).length);
  const m = withData ?? geo[geo.length - 1];
  if (!withData) return { key: "geo", title: "География СОП", big: "н/д", sub: `нет данных за ${MONTHS_NOM[monthIdx(m.date)]}` };
  const sorted = [...(m.countries ?? [])].sort((a, b) => Number(b.shared) - Number(a.shared));
  const top = sorted[0];
  const pts = sorted.slice(0, 4).map((c) => ({ v: Number(c.shared) || 0, tip: `${c.country}: ${fmt(Number(c.shared))}%` }));
  return { key: "geo", title: "География СОП", big: `${top.country} ${fmt(Number(top.shared))}%`, sub: `доля СОП в ${MONTHS_PREP[monthIdx(m.date)]}`, chart: chart(pts, "Доля СОП по странам", 0) };
}

/** Плитки показателей или текст, почему их нет. */
export function buildMetrics(json: unknown, dash: Dash): { tiles: Tile[] } | { message: string } {
  const d = ((json as { data?: unknown })?.data ?? json) as { volumeQualifyingStar?: Row[]; volumeGroup?: Row[]; countries?: Row[] } | null;
  const star = asc(d?.volumeQualifyingStar);
  const group = asc(d?.volumeGroup);
  const geo = asc(d?.countries);
  if (!star.length && !group.length) return { message: "В ответе нет данных по месяцам." };
  const cur = currentKey(dash);
  // закрытые месяцы: всё, что раньше текущего; если таких нет, берём последний доступный
  const closed = (a: Row[]) => {
    const c = a.filter((m) => m.date < cur);
    return c.length ? c : a;
  };
  const lastOf = (a: Row[]) => closed(a)[closed(a).length - 1];
  const tiles: Tile[] = [];
  if (star.length) tiles.push(volumeTile("sop", "СОП со звёздочкой", closed(star), n(dash?.volumeQualifyingStar), n(dash?.volumeQualifyingStarPlan), cur, lastOf(star), "СОП со звёздочкой по месяцам"));
  if (group.length) tiles.push(volumeTile("group", "Групповой объём (ГО)", closed(group), n(dash?.volumeGroup), n(dash?.volumeGroupPlan), cur, lastOf(group), "Групповой объём по месяцам"));
  if (star.length) tiles.push(rankTile(closed(star)));
  if (geo.length) tiles.push(geoTile(closed(geo)));
  return { tiles };
}
