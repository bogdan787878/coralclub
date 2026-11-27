/**
 * Поисковый движок каталога: индекс по основам слов (стеммер) с весами полей и разбор запроса.
 *
 *   совпадение  — название, другие названия (англ., артикулы), состав, описание; артикул цифрами — сразу товар;
 *   контекст    — морфология («суставов» = «суставы»), опечатки, неверная раскладка, синонимы, подсказка по
 *                 началу слова (пока человек печатает);
 *   интенты     — «устаю», «плохо сплю», «без глютена», «в капсулах» → домены, фазы, особенности, формы;
 *   стоп-слова  — болезни (товаров нет, только предупреждение) и лечение (предупреждение) — rules.ts.
 */
import { editDistance, typoBudget } from "./fuzzy";
import { fixLayout, normalize, tokens } from "./normalize";
import { DISEASES, FILLER, INTENTS, NOTICE_DISEASE, NOTICE_TREATMENT, SYNONYMS, TREATMENT, type IntentRule } from "./rules";
import { stem } from "./stem";

export type SearchDoc = {
  id: string;
  /** название на витрине */
  title: string;
  /** другие названия: английское, служебные, старые */
  aliases?: string[];
  /** артикулы всех фасовок */
  codes?: string[];
  /** вещества состава */
  ingredients?: string[];
  /** домены здоровья, фазы, особенности, формы — как в правилах интентов */
  domains?: string[];
  phases?: string[];
  feats?: string[];
  forms?: string[];
  /** описание */
  text?: string;
};

export type SearchIntent = { id: string; label: string; kind: "domain" | "phase" | "feat" | "form" };

export type SearchResult = {
  /** ok — выдача; blocked — запрос о болезни, товаров нет; empty — пустой запрос */
  status: "ok" | "blocked" | "empty";
  /** предупреждение для БАД */
  notice?: string;
  /** что поняли из запроса */
  intents: SearchIntent[];
  /** найденные товары, лучшие первыми */
  ids: string[];
  /** совпали не все слова — показали ближайшее */
  partial: boolean;
  /** исправили раскладку или опечатку: как поняли запрос */
  understood?: string;
};

const W = { title: 10, alias: 7, ingredient: 5, text: 1.2 };
const FIELD_BONUS = 0.25; // то же слово ещё в одном поле

type Posting = Map<number, number>;

const stems = (s: string) => tokens(s).map(stem);
const isCode = (t: string) => /^\d{3,}$/.test(t);

function intentKind(r: IntentRule): SearchIntent["kind"] {
  return r.domains ? "domain" : r.phases ? "phase" : r.feats ? "feat" : "form";
}

export function createSearch(docs: SearchDoc[]) {
  const postings = new Map<string, Posting>();
  const words = new Map<string, string>(); // слово индекса → основа (для подсказки по началу и опечаток)
  const codes = new Map<string, number>();

  const add = (text: string, weight: number, seen: Map<string, number>) => {
    const base = tokens(text);
    const list = [...base];
    // названия пишут и слитно: «Би-Лурон» → ещё «билурон», «Корал-Майн Сильвер» → «коралмайн», «коралмайнсильвер»
    if (weight >= W.alias && base.length > 1) {
      for (let i = 0; i + 1 < base.length; i++) list.push(base[i] + base[i + 1]);
      if (base.length > 2) list.push(base.join(""));
    }
    for (const word of list) {
      const s = stem(word);
      words.set(word, s);
      words.set(s, s);
      seen.set(s, Math.max(seen.get(s) ?? 0, weight) + (seen.has(s) ? weight * FIELD_BONUS : 0));
    }
  };

  docs.forEach((d, i) => {
    const seen = new Map<string, number>();
    add(d.title, W.title, seen);
    for (const a of d.aliases ?? []) add(a, W.alias, seen);
    for (const g of d.ingredients ?? []) add(g, W.ingredient, seen);
    if (d.text) add(d.text, W.text, seen);
    for (const [s, w] of seen) {
      let p = postings.get(s);
      if (!p) postings.set(s, (p = new Map()));
      p.set(i, w);
    }
    for (const c of d.codes ?? []) codes.set(String(c), i);
  });
  const vocab = [...words.keys()];

  /** Основы индекса для слова запроса: точно, по началу слова, с опечаткой — с весом уверенности. */
  function expand(word: string, last: boolean): Map<string, number> {
    const out = new Map<string, number>();
    const s = stem(word);
    if (postings.has(s)) out.set(s, 1);
    if (postings.has(word)) out.set(word, 1);
    // начало слова — пока человек печатает (и для коротких основ)
    if (word.length >= (last ? 2 : 4)) {
      for (const v of vocab) if (v.startsWith(word) && v !== word) out.set(words.get(v) as string, Math.max(out.get(words.get(v) as string) ?? 0, 0.8));
    }
    // опечатка
    if (!out.size) {
      const max = typoBudget(word.length);
      if (max > 0) {
        for (const v of vocab) {
          if (Math.abs(v.length - word.length) > max) continue;
          const d = editDistance(word, v, max);
          if (d <= max) out.set(words.get(v) as string, Math.max(out.get(words.get(v) as string) ?? 0, d === 1 ? 0.6 : 0.4));
        }
      }
    }
    return out;
  }

  const known = (word: string) => expand(word, true).size > 0;

  /** Стоп-слова БАД: болезнь или лечение (по основам, болезнь — и с одной опечаткой для длинных слов). */
  const diseaseStems = DISEASES.map((w) => stems(w).join(" "));
  const treatmentStems = new Set(TREATMENT.map((w) => stem(normalize(w))));
  function compliance(all: string[]): { disease: boolean; treatment: Set<number> } {
    // служебные слова не сравниваем с болезнями: «отит» → основа «от», как предлог
    const qs = all.map((s) => (fillerStems.has(s) ? "·" : s));
    const joined = ` ${qs.join(" ")} `;
    const disease = diseaseStems.some((d) => joined.includes(` ${d} `)) || qs.some((s) => s.length >= 6 && diseaseStems.some((d) => !d.includes(" ") && d.length >= 6 && editDistance(s, d, 1) <= 1));
    const treatment = new Set<number>();
    qs.forEach((s, i) => treatmentStems.has(s) && treatment.add(i));
    return { disease, treatment };
  }

  const intentStems = INTENTS.map((r) => ({ rule: r, phrases: r.triggers.map((t) => stems(t)) }));
  const synonymStems = Object.entries(SYNONYMS).map(([k, v]) => ({ key: stems(k), add: v }));
  const fillerStems = new Set(FILLER.map((w) => stem(normalize(w))));

  /** Позиции фразы (основы подряд) в запросе. */
  function findPhrase(qs: string[], phrase: string[]): number[] | null {
    outer: for (let i = 0; i + phrase.length <= qs.length; i++) {
      for (let j = 0; j < phrase.length; j++) if (qs[i + j] !== phrase[j]) continue outer;
      return phrase.map((_, j) => i + j);
    }
    return null;
  }

  function search(query: string): SearchResult {
    let raw = tokens(query);
    if (!raw.length) return { status: "empty", intents: [], ids: [], partial: false };

    // раскладка: латинское слово, которого нет в индексе, но по-русски есть
    let fixed = false;
    raw = raw.map((w) => {
      if (/[a-z]/.test(w) && !isCode(w) && !known(w)) {
        const ru = fixLayout(w);
        if (ru && known(ru)) {
          fixed = true;
          return ru;
        }
      }
      return w;
    });
    const qs = raw.map(stem);

    // стоп-слова БАД
    const c = compliance(qs);
    if (c.disease) return { status: "blocked", notice: NOTICE_DISEASE, intents: [], ids: [], partial: false, understood: fixed ? raw.join(" ") : undefined };

    // интенты: фраза целиком; слова особенностей и форм («без глютена») дальше не ищем по тексту
    const intents: IntentRule[] = [];
    const consumed = new Set<number>();
    const optional = new Set<number>();
    for (const { rule, phrases } of intentStems) {
      for (const ph of phrases) {
        const at = findPhrase(qs, ph);
        if (!at) continue;
        if (!intents.includes(rule)) intents.push(rule);
        for (const i of at) (rule.feats || rule.forms ? consumed : optional).add(i);
        break;
      }
    }

    // синонимы — дополнительные слова (не обязательные)
    const extra: string[] = [];
    for (const { key, add } of synonymStems) if (findPhrase(qs, key)) extra.push(...add.flatMap((a) => tokens(a)));

    // обязательные слова — всё, кроме служебных, лечения, особенностей и форм
    const required: { word: string; last: boolean }[] = [];
    const soft: string[] = [...extra];
    raw.forEach((w, i) => {
      if (consumed.has(i) || c.treatment.has(i) || fillerStems.has(qs[i])) return;
      if (optional.has(i)) soft.push(w);
      else required.push({ word: w, last: i === raw.length - 1 });
    });

    const score = new Map<number, number>();
    const hits = new Map<number, number>();
    const bump = (i: number, v: number) => score.set(i, (score.get(i) ?? 0) + v);

    // артикул
    for (const { word } of required) {
      const at = isCode(word) ? codes.get(word) : undefined;
      if (at !== undefined) {
        bump(at, 1000);
        hits.set(at, (hits.get(at) ?? 0) + 1);
      }
    }
    // обязательные слова
    const textual = required.filter((r) => !isCode(r.word) || codes.get(r.word) === undefined);
    for (const { word, last } of textual) {
      const cand = expand(word, last);
      const best = new Map<number, number>();
      for (const [s, conf] of cand) for (const [i, w] of postings.get(s) ?? []) best.set(i, Math.max(best.get(i) ?? 0, conf * w));
      for (const [i, v] of best) {
        bump(i, v);
        hits.set(i, (hits.get(i) ?? 0) + 1);
      }
    }
    // необязательные: слова интентов и синонимы
    for (const word of soft) {
      for (const [s, conf] of expand(word, false)) for (const [i, w] of postings.get(s) ?? []) bump(i, conf * w * 0.5);
    }

    // интенты: домены и фазы поднимают, особенности и формы — фильтр
    const filters = intents.filter((r) => r.feats || r.forms);
    const boosts = intents.filter((r) => r.domains || r.phases);
    const pass = (d: SearchDoc) =>
      filters.every((r) => (r.feats ? r.feats.some((f) => d.feats?.includes(f)) : r.forms!.some((f) => d.forms?.includes(f))));
    const boosted = (d: SearchDoc) => boosts.filter((r) => r.domains?.some((x) => d.domains?.includes(x)) || r.phases?.some((x) => d.phases?.includes(x))).length;

    const need = required.length;
    let partial = false;
    let pool: number[];
    if (need) {
      const all = [...hits.entries()].filter(([, n]) => n >= need).map(([i]) => i);
      if (all.length) pool = all;
      else {
        // ни один товар не подошёл по всем словам — по большинству
        const most = Math.max(0, ...hits.values());
        pool = most ? [...hits.entries()].filter(([, n]) => n === most).map(([i]) => i) : [];
        partial = pool.length > 0 && need > 1;
      }
      // слова совпали, но интент ведёт в другой домен — товары интента тоже (ниже по списку)
      if (boosts.length) for (let i = 0; i < docs.length; i++) if (boosted(docs[i]) && !pool.includes(i)) pool.push(i);
    } else {
      // запрос — только намерение («плохо сплю», «без глютена»)
      pool = docs.map((_, i) => i).filter((i) => (boosts.length ? boosted(docs[i]) > 0 : filters.length > 0) || score.has(i));
    }

    const ids = pool
      .filter((i) => pass(docs[i]))
      .map((i) => ({ i, s: (score.get(i) ?? 0) + boosted(docs[i]) * 8 }))
      .sort((a, b) => b.s - a.s || docs[a.i].title.localeCompare(docs[b.i].title, "ru"))
      .map(({ i }) => docs[i].id);

    return {
      status: "ok",
      notice: c.treatment.size ? NOTICE_TREATMENT : undefined,
      intents: intents.map((r) => ({ id: r.id, label: r.label, kind: intentKind(r) })),
      ids,
      partial,
      understood: fixed ? raw.join(" ") : undefined,
    };
  }

  return { search };
}

export type Search = ReturnType<typeof createSearch>;
