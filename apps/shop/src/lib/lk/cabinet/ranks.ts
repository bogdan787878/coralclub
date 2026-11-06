/**
 * Условия рангов: маркетинг-план ред. 17 (таблица «Условия рангов»). В API кабинета этих правил нет, поэтому они здесь.
 * codes — как ранг приходит из API (D, SD, GD, ED, DD, E…). Ранги ниже директора (PRE) — карточка «до директора».
 * null — у ранга нет такого условия (в таблице прочерк).
 */
export type Rank = { codes: string[]; name: string; gen: string; perk: string; tone: string; lo: number; go: number; branches: number | null; directors: number | null; gens: number | null; sop: number | null; sopStar?: boolean; months: number; opens: string };

export const RANKS: Rank[] = [
  { codes: ["D"], name: "Директор", gen: "Директора", perk: "Бонус 25% с ЛО", tone: "d", lo: 50, go: 500, branches: null, directors: null, gens: null, sop: null, months: 1, opens: "Бонус 25% с ЛО и 10–25% с группы. Экстрабонус 50 у.е. при ГО ≥ 750" },
  { codes: ["SD"], name: "Серебряный директор", gen: "Серебряного директора", perk: "Бонус с 2 поколений", tone: "sd", lo: 50, go: 500, branches: 1, directors: 1, gens: 2, sop: null, months: 2, opens: "Бонус с 2 поколений директоров: 10–8%" },
  { codes: ["GD"], name: "Золотой директор", gen: "Золотого директора", perk: "Бонус с 3 поколений", tone: "gd", lo: 70, go: 500, branches: 2, directors: 2, gens: 3, sop: 2000, months: 2, opens: "Бонус с 3 поколений: 10–8–5%" },
  { codes: ["ED"], name: "Изумрудный директор", gen: "Изумрудного директора", perk: "Бонус с 4 поколений", tone: "ed", lo: 70, go: 500, branches: 3, directors: 4, gens: 4, sop: 3500, months: 2, opens: "Бонус с 4 поколений: 10–8–5–5%" },
  { codes: ["DD"], name: "Бриллиантовый директор", gen: "Бриллиантового директора", perk: "Бонус с 5 поколений", tone: "bd", lo: 70, go: 500, branches: 3, directors: 8, gens: 5, sop: 6500, sopStar: true, months: 2, opens: "Бонус с 5 поколений: 10–8–5–5–5%" },
  { codes: ["E"], name: "Мастер", gen: "Мастера", perk: "Бонус с 6 поколений и бонус бесконечности", tone: "m", lo: 100, go: 500, branches: 4, directors: 16, gens: 6, sop: 12500, sopStar: true, months: 2, opens: "Бонус с 6 поколений и бонус бесконечности 1%" },
];

/** Ранги до директора: у них нет условий в таблице, Директор для них «следующий». */
export const PRE = ["M", "PM", "jA", "A"];

/** Ранг, как его пишет русский кабинет: «jA» → «мА», латинские буквы на русские. */
const CYR: Record<string, string> = { A: "А", B: "В", C: "С", E: "Е", H: "Н", K: "К", M: "М", O: "О", P: "Р", T: "Т", X: "Х" };
export const rankRu = (r: unknown): string => (typeof r === "string" && r ? r.replace(/^j/, "м").replace(/[A-Z]/g, (c) => CYR[c] ?? c) : "—");
export const rankName = (code: string | undefined): string => RANKS.find((r) => r.codes.includes(code ?? ""))?.name ?? rankRu(code);
