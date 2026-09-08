/**
 * Personalization quiz — ~12 questions built around the 12 health domains.
 * The result is 2–3 target products (no contact capture): the подборка
 * lives inside the quiz.
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
      title: string | ((a: Answers) => string);
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

const DOMAINS = getDomains();
const DOMAIN_OPTIONS: Option[] = DOMAINS.map((d) => ({
  value: d.id,
  label: d.label,
}));

export const domainLabel = (id: string): string =>
  DOMAINS.find((d) => d.id === id)?.label ?? id;

/** Chosen domain ids, primary first. */
export const selectedDomainIds = (a: Answers): string[] => {
  const picked = asArray(a.domains);
  const primary = a.priority as string | undefined;
  return primary && picked.includes(primary)
    ? [primary, ...picked.filter((d) => d !== primary)]
    : picked;
};

const primaryDomain = (a: Answers): string | undefined =>
  selectedDomainIds(a)[0];

/* --------------------- per-domain focus questions -------------------- */

type Focus = { value: string; label: string; kw: RegExp };
const DOMAIN_FOCUS: Record<string, { title: string; options: Focus[] }> = {
  energy: {
    title: "Что важнее для энергии?",
    options: [
      { value: "physical", label: "Физическая выносливость", kw: /carnitine|q10|coenzyme|protivity|cardiopack/ },
      { value: "mental", label: "Ясная голова", kw: /memo|mindset|b-prime|lecithin/ },
      { value: "steady", label: "Ровный тонус весь день", kw: /h-500|pentokan|oceanmin/ },
    ],
  },
  "weight-metabolism": {
    title: "Что сейчас мешает больше всего?",
    options: [
      { value: "appetite", label: "Аппетит и тяга к сладкому", kw: /lipostick|slim|hi-fiber|fandetox/ },
      { value: "metabolism", label: "Медленный обмен веществ", kw: /carnitine|artichoke|spirulina|selenium/ },
      { value: "water", label: "Отёчность, задержка воды", kw: /plankton|artichoke/ },
    ],
  },
  "digestion-gut": {
    title: "Что беспокоит по пищеварению?",
    options: [
      { value: "heaviness", label: "Тяжесть после еды", kw: /assimilator|artichoke|zaferan|curcumin/ },
      { value: "regularity", label: "Нерегулярный стул", kw: /hi-fiber|alfalfa|cascara|burdock/ },
      { value: "flora", label: "Вздутие, микрофлора", kw: /super-flora|lecithin|curcumin/ },
    ],
  },
  immunity: {
    title: "Что в фокусе по иммунитету?",
    options: [
      { value: "seasonal", label: "Сезонная поддержка", kw: /d-spray|pau-d-arco|licorice|cat-s-claw/ },
      { value: "recovery", label: "Восстановление после болезни", kw: /colostrum|ultimate-max|curcumin/ },
      { value: "antiox", label: "Антиоксидантная защита", kw: /omega|curcumin|licorice/ },
    ],
  },
  "sleep-stress": {
    title: "Что мешает высыпаться?",
    options: [
      { value: "fallasleep", label: "Трудно заснуть", kw: /evening-formula|griffonia|magnesium/ },
      { value: "wakeups", label: "Просыпаюсь ночью", kw: /magnesium|oceanmin|coral-mine/ },
      { value: "daystress", label: "Стресс и тревога днём", kw: /mindset|griffonia|phytomix|safrino/ },
    ],
  },
  "brain-focus": {
    title: "Что важнее для головы?",
    options: [
      { value: "focus", label: "Концентрация", kw: /mindset|onestack|gotu-kola|b-prime/ },
      { value: "memory", label: "Память", kw: /lecithin|omega|selenium/ },
      { value: "clarity", label: "Настроение и ясность", kw: /zaferan|curcumin|gotu/ },
    ],
  },
  "heart-vessels": {
    title: "Что в приоритете по сердцу?",
    options: [
      { value: "pressure", label: "Давление", kw: /bp-phyto|circuphyt|pentokan/ },
      { value: "vessels", label: "Сосуды и кровоток", kw: /gotu-kola|circuphyt|aquaox|lymflow/ },
      { value: "muscle", label: "Сердечная мышца", kw: /q10|coenzyme|omega|magnesium|cardiopack/ },
    ],
  },
  "bones-joints": {
    title: "Что важнее по суставам и костям?",
    options: [
      { value: "mobility", label: "Подвижность суставов", kw: /b-luron|flexicor|boswellia|msm/ },
      { value: "density", label: "Плотность костей", kw: /calci-prime|pure-c|msm/ },
      { value: "inflam", label: "Воспаление и дискомфорт", kw: /curcumin|zaferan|omega|boswellia/ },
    ],
  },
  "skin-hair-nails": {
    title: "Что в фокусе — кожа, волосы или ногти?",
    options: [
      { value: "skin", label: "Кожа и упругость", kw: /collagen|shark-liver|ultimate-max/ },
      { value: "hair", label: "Волосы", kw: /collagen|iron|zinc|prenatal/ },
      { value: "nails", label: "Ногти", kw: /zinc|msm|collagen/ },
    ],
  },
  longevity: {
    title: "Что важнее для долголетия?",
    options: [
      { value: "cellular", label: "Клеточная энергия", kw: /q10|coenzyme|lecithin/ },
      { value: "protection", label: "Антиоксидантная защита", kw: /aquaox|activin|selenium/ },
      { value: "cleanse", label: "Чистота и детокс", kw: /coral-detox|assimilator/ },
    ],
  },
  "vision-eyes": {
    title: "Что беспокоит по зрению?",
    options: [
      { value: "screen", label: "Усталость глаз от экрана", kw: /visi-prime|taurine|dha-d3/ },
      { value: "dryness", label: "Сухость глаз", kw: /omega|o-mega-3-tg|dha/ },
      { value: "prevention", label: "Профилактика возрастных изменений", kw: /visi-prime|zinc|b-luron/ },
    ],
  },
  reproductive: {
    title: "Что в фокусе по репродуктивному здоровью?",
    options: [
      { value: "women", label: "Женское здоровье", kw: /phytomix|prenatal|iron|circuphyt/ },
      { value: "pregnancy", label: "Подготовка к беременности", kw: /prenatal|iron/ },
      { value: "hormones", label: "Гормональный баланс и тонус", kw: /phytomix|ultimate-max|lymflow/ },
    ],
  },
};

/* --------------------------- question graph -------------------------- */

export const STEPS: Step[] = [
  {
    id: "intro",
    kind: "intro",
    kicker: "3 минуты · 12 вопросов",
    title: "Соберём твою подборку",
    body: "Ответь на несколько вопросов о своих целях и привычках — на выходе 2–3 продукта под твою задачу. Без регистрации.",
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
    title: "Что из этого — самое важное прямо сейчас?",
    options: (a) => {
      const picked = asArray(a.domains);
      return DOMAIN_OPTIONS.filter((o) => picked.includes(o.value));
    },
    showIf: (a) => asArray(a.domains).length > 1,
  },
  {
    id: "focus",
    kind: "single",
    title: (a) => DOMAIN_FOCUS[primaryDomain(a) ?? ""]?.title ?? "Что в фокусе?",
    options: (a) =>
      (DOMAIN_FOCUS[primaryDomain(a) ?? ""]?.options ?? []).map((o) => ({
        value: o.value,
        label: o.label,
      })),
    showIf: (a) => Boolean(DOMAIN_FOCUS[primaryDomain(a) ?? ""]),
  },
  {
    id: "sex",
    kind: "single",
    title: "Пол",
    options: [
      { value: "f", label: "Женский" },
      { value: "m", label: "Мужской" },
    ],
  },
  {
    id: "speed",
    kind: "single",
    title: "Как быстро хочешь увидеть результат?",
    options: [
      { value: "weeks", label: "За пару недель" },
      { value: "month", label: "За месяц-два" },
      { value: "slow", label: "Не тороплюсь" },
    ],
  },
  {
    id: "horizon",
    kind: "single",
    title: "Как давно это тебя беспокоит?",
    options: [
      { value: "recent", label: "Недавно" },
      { value: "months", label: "Несколько месяцев" },
      { value: "long", label: "Давно, хочу наконец заняться" },
      { value: "prevention", label: "Скорее профилактика" },
    ],
  },
  {
    id: "outcome",
    kind: "single",
    title: "Что важнее в результате?",
    options: [
      { value: "fast", label: "Заметный эффект быстрее" },
      { value: "stable", label: "Устойчивый результат" },
      { value: "support", label: "Мягкая поддержка и профилактика" },
    ],
  },
  {
    id: "routine",
    kind: "single",
    title: "Что уже принимаешь из добавок?",
    options: [
      { value: "none", label: "Ничего, начинаю с нуля" },
      { value: "basic", label: "Базовые витамины" },
      { value: "many", label: "Уже целый набор" },
    ],
  },
  {
    id: "format",
    kind: "single",
    title: "Как удобнее принимать?",
    options: [
      { value: "caps", label: "Капсулы и таблетки" },
      { value: "drinks", label: "Напитки, порошки, стики" },
      { value: "any", label: "Без разницы" },
    ],
  },
  {
    id: "budget",
    kind: "single",
    title: "Бюджет на месяц по этому направлению?",
    options: [
      { value: "low", label: "До $30" },
      { value: "mid", label: "$30–60" },
      { value: "any", label: "Без ограничений" },
    ],
  },
  {
    id: "diet",
    kind: "single",
    title: "Есть ограничения в питании?",
    options: [
      { value: "none", label: "Нет" },
      { value: "plant", label: "Без животных компонентов" },
    ],
  },
  {
    id: "stage",
    kind: "single",
    title: "Возрастная категория?",
    options: [
      { value: "u30", label: "До 30" },
      { value: "30_45", label: "30–45" },
      { value: "45p", label: "45+" },
    ],
  },
  {
    id: "commitment",
    kind: "single",
    title: "Сколько продуктов готов(а) принимать?",
    options: [
      { value: "one", label: "1–2, только самое нужное" },
      { value: "few", label: "2–3" },
      { value: "set", label: "Готов(а) на целый набор" },
    ],
  },
  { id: "result", kind: "result" },
];

export const visibleSteps = (a: Answers): Step[] =>
  STEPS.filter((s) => !("showIf" in s) || !s.showIf || s.showIf(a));

export const titleOf = (step: Step, a: Answers): string => {
  if (step.kind !== "single" && step.kind !== "multi") return "";
  return typeof step.title === "function" ? step.title(a) : step.title;
};

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

const priceValue = (s: string): number => {
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const BUDGET_CAP: Record<string, number> = { low: 30, mid: 60, any: Infinity };
const COUNT: Record<string, number> = { one: 2, few: 3, set: 5 };
const ANIMAL = /collagen|omega|fish|colostrum|shark|liver|carnitine|dha|krill/i;
const DRINK = /shake|mix|hi-fiber|powder|stick|spray|drink|protein|sagrada|pentokan|h-500|oceanmin/i;
const AGE_DOMAINS = ["longevity", "bones-joints", "heart-vessels"];
const YOUNG_DOMAINS = ["skin-hair-nails", "energy"];

/** 2–3 target products, ranked across the chosen domains + practical answers. */
export const buildSelection = (a: Answers): Product[] => {
  const ids = selectedDomainIds(a);
  if (!ids.length) return [];
  const primary = ids[0];
  const cap = BUDGET_CAP[a.budget as string] ?? Infinity;
  const count = COUNT[a.commitment as string] ?? 3;

  const focus = DOMAIN_FOCUS[primary]?.options.find(
    (o) => o.value === a.focus,
  )?.kw;

  const inDomain: Record<string, Set<string>> = {};
  for (const d of DOMAINS) inDomain[d.id] = new Set(d.products);

  const candidates = new Map<string, Product>();
  for (const id of ids)
    for (const slug of inDomain[id] ?? []) {
      if (candidates.has(slug)) continue;
      const p = getProduct(slug);
      if (p) candidates.set(slug, p);
    }

  const scored = [...candidates.values()].map((p) => {
    let s = 0;
    if (inDomain[primary]?.has(p.slug)) s += 4;
    s += 2 * ids.slice(1).filter((id) => inDomain[id]?.has(p.slug)).length;

    const hay = `${p.slug} ${p.name}`.toLowerCase();
    if (focus && focus.test(hay)) s += 3;

    const price = priceValue(p.prices[1].price);
    if (price > cap) s -= 5;

    if (a.diet === "plant" && ANIMAL.test(hay)) s -= 4;

    const isDrink = DRINK.test(hay);
    if (a.format === "drinks" && isDrink) s += 2;
    if (a.format === "caps" && !isDrink) s += 1;

    if (a.routine === "none" && price <= 25) s += 1;
    if (a.outcome === "support" && price <= 25) s += 1;

    if (a.stage === "45p" && AGE_DOMAINS.some((d) => inDomain[d]?.has(p.slug)))
      s += 1;
    if (a.stage === "u30" && YOUNG_DOMAINS.some((d) => inDomain[d]?.has(p.slug)))
      s += 1;

    if (a.sex === "m" && /for-women|prenatal|phytomix/i.test(hay)) s -= 6;
    if (a.sex === "f" && /for-women|phytomix/i.test(hay)) s += 1;

    return { p, s };
  });

  return scored
    .sort((x, y) => y.s - x.s)
    .slice(0, count)
    .map((x) => x.p);
};

export const recapLines = (a: Answers): string[] => {
  const ids = selectedDomainIds(a);
  if (!ids.length) return [];
  const [primary, ...rest] = ids;
  const lines = [`Главное направление — ${domainLabel(primary)}.`];

  const focusLabel = DOMAIN_FOCUS[primary]?.options.find(
    (o) => o.value === a.focus,
  )?.label;
  if (focusLabel) lines.push(`В фокусе: ${focusLabel.toLowerCase()}.`);
  if (rest.length) {
    lines.push(`Ещё важно: ${rest.map(domainLabel).join(", ")}.`);
  }
  if (a.budget === "low") lines.push("Бюджет — до $30 в месяц.");
  if (a.diet === "plant") lines.push("Без животных компонентов.");
  return lines;
};
