/**
 * Нормализация текста запроса и индекса: нижний регистр, ё → е, без пунктуации; исправление раскладки
 * (набрали по-русски на английской: «gtynjrfy» → «пентокан»).
 */

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[́]/g, "")
    .replace(/[«»"'`’“”()[\]{}.,;:!?/\\|+*=<>#№%&_~^]/g, " ")
    .replace(/(\p{L})-(\p{L})/gu, "$1 $2") // «корал-майн» → «корал майн»
    .replace(/\s+/g, " ")
    .trim();
}

export function tokens(s: string): string[] {
  return normalize(s).split(" ").filter(Boolean);
}

const EN = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`";
const RU = "йцукенгшщзхъфывапролджэячсмитьбюё";
const EN_RU = new Map([...EN].map((c, i) => [c, RU[i]]));

/** Слово набрано латиницей на русской раскладке → по-русски. Только если всё слово из этих клавиш. */
export function fixLayout(word: string): string | null {
  if (!/^[a-z[\];',.`]+$/.test(word)) return null;
  const out = [...word].map((c) => EN_RU.get(c) ?? c).join("");
  return /[а-я]/.test(out) ? out : null;
}
