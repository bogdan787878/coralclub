/**
 * Russian typography: a one- or two-letter preposition, conjunction or
 * particle must not be left at the end of a line ("висячий предлог"), so the
 * space after it becomes a non-breaking one and the word travels with the
 * next one.
 */
const GLUE =
  "в|во|к|ко|с|со|у|о|об|от|из|за|на|по|до|не|ни|и|а|но|да|же|бы|ли|для|без|под|над|при|про|как|что|или|то";

const RX = new RegExp(
  `(?<![\\p{L}\\p{N}-])(?:${GLUE})[ \\t]+(?=[\\p{L}\\p{N}«"“(])`,
  "giu",
);

const NBSP = " ";

/** Glues short prepositions to the word that follows them. */
export function nbsp(text: string): string {
  if (!/[А-Яа-яЁё]/.test(text)) return text;
  return text.replace(RX, (m) => m.replace(/[ \t]+$/, NBSP));
}

/** `nbsp` over every string value of a plain data tree (keys untouched). */
export function nbspDeep<T>(value: T): T {
  if (typeof value === "string") return nbsp(value) as unknown as T;
  if (Array.isArray(value)) return value.map(nbspDeep) as unknown as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        nbspDeep(v),
      ]),
    ) as T;
  }
  return value;
}
