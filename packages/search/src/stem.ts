/**
 * Стеммер русского языка (алгоритм Snowball, Мартин Портер): «суставов», «суставы», «суставам» → «сустав».
 * Латиница и цифры не трогаются.
 */

const V = "аеиоуыэюя";
const isV = (c: string) => V.includes(c);

const PERFECTIVE_1 = ["вшись", "вши", "в"]; // после а/я
const PERFECTIVE_2 = ["ившись", "ывшись", "ивши", "ывши", "ив", "ыв"];
const REFLEXIVE = ["ся", "сь"];
const ADJECTIVE = ["ими", "ыми", "его", "ого", "ему", "ому", "ее", "ие", "ые", "ое", "ей", "ий", "ый", "ой", "ем", "им", "ым", "ом", "их", "ых", "ую", "юю", "ая", "яя", "ою", "ею"];
const PARTICIPLE_1 = ["ем", "нн", "вш", "ющ", "щ"]; // после а/я
const PARTICIPLE_2 = ["ивш", "ывш", "ующ"];
const VERB_1 = ["ете", "йте", "ешь", "нно", "ла", "на", "ли", "ем", "ло", "но", "ет", "ют", "ны", "ть", "й", "л", "н"]; // после а/я
const VERB_2 = ["ейте", "уйте", "ила", "ыла", "ена", "ите", "или", "ыли", "ило", "ыло", "ено", "ует", "уют", "ены", "ить", "ыть", "ишь", "ей", "уй", "ил", "ыл", "им", "ым", "ен", "ят", "ит", "ыт", "ую", "ю"];
const NOUN = ["иями", "ями", "ами", "ией", "иям", "ием", "иях", "ев", "ов", "ие", "ье", "еи", "ии", "ей", "ой", "ий", "ям", "ем", "ам", "ом", "ах", "ях", "ию", "ью", "ия", "ья", "а", "е", "и", "й", "о", "у", "ы", "ь", "ю", "я"];
const SUPERLATIVE = ["ейше", "ейш"];
const DERIVATIONAL = ["ость", "ост"];

const byLength = (list: string[]) => [...list].sort((a, b) => b.length - a.length);
const L = {
  p1: byLength(PERFECTIVE_1),
  p2: byLength(PERFECTIVE_2),
  refl: byLength(REFLEXIVE),
  adj: byLength(ADJECTIVE),
  part1: byLength(PARTICIPLE_1),
  part2: byLength(PARTICIPLE_2),
  v1: byLength(VERB_1),
  v2: byLength(VERB_2),
  noun: byLength(NOUN),
  sup: byLength(SUPERLATIVE),
  der: byLength(DERIVATIONAL),
};

/** Снять окончание из group2 или (после а/я) из group1; null — не нашлось. */
function strip(rv: string, g1: string[], g2: string[] | null): string | null {
  if (g2) for (const e of g2) if (rv.endsWith(e)) return rv.slice(0, -e.length);
  for (const e of g1) {
    if (rv.endsWith(e)) {
      const before = rv.charAt(rv.length - e.length - 1);
      if (before === "а" || before === "я") return rv.slice(0, -e.length);
    }
  }
  return null;
}
const stripPlain = (rv: string, list: string[]) => {
  for (const e of list) if (rv.endsWith(e)) return rv.slice(0, -e.length);
  return null;
};

/** Начало региона: после первой гласной, за которой согласная (R1/R2), или после первой гласной (RV). */
function rvStart(w: string): number {
  for (let i = 0; i < w.length; i++) if (isV(w[i])) return i + 1;
  return w.length;
}
function rStart(w: string, from: number): number {
  for (let i = from + 1; i < w.length; i++) if (!isV(w[i]) && isV(w[i - 1])) return i + 1;
  return w.length;
}

export function stem(word: string): string {
  if (!/[а-я]/.test(word) || word.length < 3) return word;
  const w = word.replace(/ё/g, "е");
  const rvAt = rvStart(w);
  const pre = w.slice(0, rvAt);
  let rv = w.slice(rvAt);
  // R2 — в координатах слова
  const r1 = rStart(w, 0);
  const r2 = rStart(w, r1);

  // шаг 1
  const pg = strip(rv, L.p1, L.p2);
  if (pg !== null) rv = pg;
  else {
    rv = stripPlain(rv, L.refl) ?? rv;
    const adj = stripPlain(rv, L.adj);
    if (adj !== null) rv = strip(adj, L.part1, L.part2) ?? adj;
    else {
      const verb = strip(rv, L.v1, L.v2);
      if (verb !== null) rv = verb;
      else rv = stripPlain(rv, L.noun) ?? rv;
    }
  }
  // шаг 2
  if (rv.endsWith("и")) rv = rv.slice(0, -1);
  // шаг 3: словообразовательное окончание в R2
  for (const e of L.der) {
    if (rv.endsWith(e) && pre.length + rv.length - e.length >= r2) {
      rv = rv.slice(0, -e.length);
      break;
    }
  }
  // шаг 4
  if (rv.endsWith("нн")) rv = rv.slice(0, -1);
  else {
    const sup = stripPlain(rv, L.sup);
    if (sup !== null) {
      rv = sup;
      if (rv.endsWith("нн")) rv = rv.slice(0, -1);
    } else if (rv.endsWith("ь")) rv = rv.slice(0, -1);
  }
  return pre + rv;
}
