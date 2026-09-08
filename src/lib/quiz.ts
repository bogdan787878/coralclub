/**
 * Personalization quiz — pick the health domains that matter now, get a
 * product selection (подборка) from those domains. No contact capture:
 * the result lives inside the quiz.
 */

import type { Product } from "./products";
import { getDomains, getProduct } from "./products";

export type Answer = string | string[];
export type Answers = Record<string, Answer>;

export type Option = { value: string; label: string; hint?: string };

export type Step =
  | {
      id: string;
      kind: "intro";
      kicker: string;
      title: string;
      body: string;
      cta: string;
    }
  | {
      id: string;
      kind: "single" | "multi";
      title: string;
      help?: string;
      options: Option[] | ((a: Answers) => Option[]);
      min?: number;
      max?: number;
      showIf?: (a: Answers) => boolean;
    }
  | { id: string; kind: "result" };

/* ------------------------------ helpers ------------------------------ */

export const asArray = (v: Answer | undefined): string[] =>
  Array.isArray(v) ? v : v ? [v] : [];

const DOMAIN_OPTIONS: Option[] = getDomains().map((d) => ({
  value: d.id,
  label: d.label,
}));

export const domainLabel = (id: string): string =>
  getDomains().find((d) => d.id === id)?.label ?? id;

/* --------------------------- question graph -------------------------- */

export const STEPS: Step[] = [
  {
    id: "intro",
    kind: "intro",
    kicker: "1 минута",
    title: "Найди свою подборку",
    body: "Отметь направления здоровья, которые важны прямо сейчас — покажем продукты под них.",
    cta: "Начать",
  },
  {
    id: "domains",
    kind: "multi",
    title: "Что хочешь проработать?",
    help: "Выбери от 1 до 3",
    min: 1,
    max: 3,
    options: DOMAIN_OPTIONS,
  },
  {
    id: "priority",
    kind: "single",
    title: "Что из этого — самое важное?",
    options: (a) => {
      const picked = asArray(a.domains);
      return DOMAIN_OPTIONS.filter((o) => picked.includes(o.value));
    },
    showIf: (a) => asArray(a.domains).length > 1,
  },
  { id: "result", kind: "result" },
];

export const visibleSteps = (a: Answers): Step[] =>
  STEPS.filter((s) => !("showIf" in s) || !s.showIf || s.showIf(a));

export const resolveOptions = (step: Step, a: Answers): Option[] => {
  if (step.kind !== "single" && step.kind !== "multi") return [];
  return typeof step.options === "function" ? step.options(a) : step.options;
};

export const isStepAnswered = (step: Step, a: Answers): boolean => {
  if (step.kind === "multi") {
    const n = asArray(a[step.id]).length;
    return n >= (step.min ?? 1) && (!step.max || n <= step.max);
  }
  if (step.kind === "single") return Boolean(a[step.id]);
  return true;
};

/* ------------------------------- result ------------------------------ */

/** Chosen domain ids, primary first. */
export const selectedDomainIds = (a: Answers): string[] => {
  const picked = asArray(a.domains);
  const primary = a.priority as string | undefined;
  return primary && picked.includes(primary)
    ? [primary, ...picked.filter((d) => d !== primary)]
    : picked;
};

/** Product подборка — the chosen domains' sets, primary first, deduped. */
export const buildSelection = (a: Answers): Product[] => {
  const ids = selectedDomainIds(a);
  const domains = getDomains();
  const slugs: string[] = [];
  for (const id of ids) {
    const d = domains.find((x) => x.id === id);
    if (!d) continue;
    for (const slug of d.products) if (!slugs.includes(slug)) slugs.push(slug);
  }
  return slugs
    .map((s) => getProduct(s))
    .filter((p): p is Product => Boolean(p))
    .slice(0, 12);
};

export const recapLines = (a: Answers): string[] => {
  const ids = selectedDomainIds(a);
  if (!ids.length) return [];
  const [primary, ...rest] = ids;
  const lines = [`Главное направление — ${domainLabel(primary)}.`];
  if (rest.length) {
    lines.push(`Ещё важно: ${rest.map(domainLabel).join(", ")}.`);
  }
  return lines;
};
