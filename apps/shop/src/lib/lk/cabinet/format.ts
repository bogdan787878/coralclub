/** Форматы кабинета (перенесено из кабинета на чистом JS, home.js): деньги, баллы, месяцы, даты, ФИО. */
import type { Cc4Answer } from "@coral/api";

export const money = (amount: number, currency: string): string => {
  try {
    return new Intl.NumberFormat("ru-RU", { style: "currency", currency, currencyDisplay: "narrowSymbol" }).format(amount);
  } catch {
    return `${amount.toLocaleString("ru-RU", { minimumFractionDigits: 2 })} ${currency}`;
  }
};
export const plural = (n: number, [one, few, many]: [string, string, string]): string => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  return a > 10 && a < 20 ? many : b === 1 ? one : b >= 2 && b <= 4 ? few : many;
};
export const count = (n: number, forms: [string, string, string]): string => `${n} ${plural(n, forms)}`;
/** Дробное число по-русски: «36,4 балла». */
export const points = (n: number): string => `${n.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ${Number.isInteger(n) ? plural(n, ["балл", "балла", "баллов"]) : "балла"}`;
export const MONTHS_RU = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
/** Месяц трансфера приходит как «ГГММ» (2611 = ноябрь 2026). */
export const monthLabel = (m: string | number): string => {
  const s = String(m);
  return /^\d{4}$/.test(s) ? `${MONTHS_RU[Number(s.slice(2)) - 1] ?? s.slice(2)} 20${s.slice(0, 2)}` : s;
};
export const dmy = (iso: unknown): string => (/^\d{4}-\d{2}-\d{2}/.test(String(iso)) ? `${String(iso).slice(8, 10)}.${String(iso).slice(5, 7)}.${String(iso).slice(0, 4)}` : String(iso ?? ""));
export const fmt = (n: number): string => n.toLocaleString("ru-RU", { maximumFractionDigits: 1 });
export const numOf = (v: unknown): number => Number(String(v ?? "").replace(/\s/g, "").replace(",", "."));
/** «TEST TEST» → «Test Test»: имена, написанные заглавными, приводим к обычному виду. */
export const titleCase = (s: string): string => (s && s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s-])(\S)/g, (_, a: string, b: string) => a + b.toUpperCase()) : s);

export type Person = { id?: number | string; name?: string; surname?: string; patronymic?: string; avatar?: string };
export const fio = (p: Person | null): string => titleCase([p?.surname, p?.name, p?.patronymic].filter(Boolean).join(" ")) || "Участник";
export const initials = (p: Person | null): string => [p?.name, p?.surname].filter(Boolean).map((x) => String(x)[0]).join("").toUpperCase() || "•";
/** Месяц для отчётов: «ГГГГ-ММ». */
export const ym = (d = new Date()): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
/** Часовой пояс, как просит API: минуты смещения, например -180. */
export const tz = (): string => String(new Date().getTimezoneOffset());

/** Сообщение об ошибке из ответа API. */
export function problem(r: Cc4Answer<unknown>): string {
  const j = r.json as { errors?: Record<string, string[] | string>; message?: string } | null;
  if (j?.errors && typeof j.errors === "object") return Object.values(j.errors).flat().join(" ");
  return j?.message || (r.status === 401 ? "Нужно войти заново" : r.status === 403 ? "Нет доступа" : `Ошибка ${r.status || "сети"}`);
}
