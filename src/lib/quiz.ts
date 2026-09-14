/**
 * Personalization quiz — ~12 questions built around the 12 health domains.
 * The result is 2–3 target products (no contact capture): the selection
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
    title: "What matters more for energy?",
    options: [
      { value: "physical", label: "Physical stamina", kw: /carnitine|q10|coenzyme|protivity|cardiopack/ },
      { value: "mental", label: "A clear head", kw: /memo|mindset|b-prime|lecithin/ },
      { value: "steady", label: "Steady energy all day", kw: /h-500|pentokan|oceanmin/ },
    ],
  },
  "weight-metabolism": {
    title: "What's getting in the way most right now?",
    options: [
      { value: "appetite", label: "Appetite and sugar cravings", kw: /lipostick|slim|hi-fiber|fandetox/ },
      { value: "metabolism", label: "Slow metabolism", kw: /carnitine|artichoke|spirulina|selenium/ },
      { value: "water", label: "Bloating, water retention", kw: /plankton|artichoke/ },
    ],
  },
  "digestion-gut": {
    title: "What's bothering you about digestion?",
    options: [
      { value: "heaviness", label: "Heaviness after eating", kw: /assimilator|artichoke|zaferan|curcumin/ },
      { value: "regularity", label: "Irregular bowel movements", kw: /hi-fiber|alfalfa|cascara|burdock/ },
      { value: "flora", label: "Bloating, gut flora", kw: /super-flora|lecithin|curcumin/ },
    ],
  },
  immunity: {
    title: "What's the focus for immunity?",
    options: [
      { value: "seasonal", label: "Seasonal support", kw: /d-spray|pau-d-arco|licorice|cat-s-claw/ },
      { value: "recovery", label: "Recovering after illness", kw: /colostrum|ultimate-max|curcumin/ },
      { value: "antiox", label: "Antioxidant protection", kw: /omega|curcumin|licorice/ },
    ],
  },
  "sleep-stress": {
    title: "What's keeping you from sleeping well?",
    options: [
      { value: "fallasleep", label: "Trouble falling asleep", kw: /evening-formula|griffonia|magnesium/ },
      { value: "wakeups", label: "Waking up at night", kw: /magnesium|oceanmin|coral-mine/ },
      { value: "daystress", label: "Stress and anxiety during the day", kw: /mindset|griffonia|phytomix|safrino/ },
    ],
  },
  "brain-focus": {
    title: "What matters more for your mind?",
    options: [
      { value: "focus", label: "Concentration", kw: /mindset|onestack|gotu-kola|b-prime/ },
      { value: "memory", label: "Memory", kw: /lecithin|omega|selenium/ },
      { value: "clarity", label: "Mood and mental clarity", kw: /zaferan|curcumin|gotu/ },
    ],
  },
  "heart-vessels": {
    title: "What's the priority for your heart?",
    options: [
      { value: "pressure", label: "Blood pressure", kw: /bp-phyto|circuphyt|pentokan/ },
      { value: "vessels", label: "Vessels and circulation", kw: /gotu-kola|circuphyt|aquaox|lymflow/ },
      { value: "muscle", label: "Heart muscle", kw: /q10|coenzyme|omega|magnesium|cardiopack/ },
    ],
  },
  "bones-joints": {
    title: "What matters more for bones and joints?",
    options: [
      { value: "mobility", label: "Joint mobility", kw: /b-luron|flexicor|boswellia|msm/ },
      { value: "density", label: "Bone density", kw: /calci-prime|pure-c|msm/ },
      { value: "inflam", label: "Inflammation and discomfort", kw: /curcumin|zaferan|omega|boswellia/ },
    ],
  },
  "skin-hair-nails": {
    title: "What's the focus — skin, hair, or nails?",
    options: [
      { value: "skin", label: "Skin and elasticity", kw: /collagen|shark-liver|ultimate-max/ },
      { value: "hair", label: "Hair", kw: /collagen|iron|zinc|prenatal/ },
      { value: "nails", label: "Nails", kw: /zinc|msm|collagen/ },
    ],
  },
  longevity: {
    title: "What matters more for longevity?",
    options: [
      { value: "cellular", label: "Cellular energy", kw: /q10|coenzyme|lecithin/ },
      { value: "protection", label: "Antioxidant protection", kw: /aquaox|activin|selenium/ },
      { value: "cleanse", label: "Cleansing and detox", kw: /coral-detox|assimilator/ },
    ],
  },
  "vision-eyes": {
    title: "What's bothering your eyes?",
    options: [
      { value: "screen", label: "Eye strain from screens", kw: /visi-prime|taurine|dha-d3/ },
      { value: "dryness", label: "Dry eyes", kw: /omega|o-mega-3-tg|dha/ },
      { value: "prevention", label: "Prevention of age-related changes", kw: /visi-prime|zinc|b-luron/ },
    ],
  },
  reproductive: {
    title: "What's the focus for reproductive health?",
    options: [
      { value: "women", label: "Women's health", kw: /phytomix|prenatal|iron|circuphyt/ },
      { value: "pregnancy", label: "Preparing for pregnancy", kw: /prenatal|iron/ },
      { value: "hormones", label: "Hormonal balance and vitality", kw: /phytomix|ultimate-max|lymflow/ },
    ],
  },
};

/* --------------------------- question graph -------------------------- */

export const STEPS: Step[] = [
  {
    id: "intro",
    kind: "intro",
    kicker: "3 minutes · 12 questions",
    title: "Let's build your selection",
    body: "Answer a few questions about your goals and habits — you'll get 2–3 products for your needs. No sign-up required.",
    cta: "Start",
  },
  {
    id: "domains",
    kind: "multi",
    title: "What do you want to work on?",
    help: "Choose 1 to 3",
    min: 1,
    max: 3,
    options: DOMAIN_OPTIONS,
  },
  {
    id: "priority",
    kind: "single",
    title: "Which of these matters most right now?",
    options: (a) => {
      const picked = asArray(a.domains);
      return DOMAIN_OPTIONS.filter((o) => picked.includes(o.value));
    },
    showIf: (a) => asArray(a.domains).length > 1,
  },
  {
    id: "focus",
    kind: "single",
    title: (a) => DOMAIN_FOCUS[primaryDomain(a) ?? ""]?.title ?? "What's the focus?",
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
    title: "Sex",
    options: [
      { value: "f", label: "Female" },
      { value: "m", label: "Male" },
    ],
  },
  {
    id: "speed",
    kind: "single",
    title: "How soon do you want to see results?",
    options: [
      { value: "weeks", label: "In a couple of weeks" },
      { value: "month", label: "In a month or two" },
      { value: "slow", label: "No rush" },
    ],
  },
  {
    id: "horizon",
    kind: "single",
    title: "How long has this been bothering you?",
    options: [
      { value: "recent", label: "Recently" },
      { value: "months", label: "A few months" },
      { value: "long", label: "A long time — ready to finally deal with it" },
      { value: "prevention", label: "Mostly prevention" },
    ],
  },
  {
    id: "outcome",
    kind: "single",
    title: "What matters more in the result?",
    options: [
      { value: "fast", label: "A noticeable effect sooner" },
      { value: "stable", label: "A lasting result" },
      { value: "support", label: "Gentle support and prevention" },
    ],
  },
  {
    id: "routine",
    kind: "single",
    title: "What are you already taking?",
    options: [
      { value: "none", label: "Nothing, starting from scratch" },
      { value: "basic", label: "Basic vitamins" },
      { value: "many", label: "Already a full stack" },
    ],
  },
  {
    id: "format",
    kind: "single",
    title: "What's easier for you to take?",
    options: [
      { value: "caps", label: "Capsules and tablets" },
      { value: "drinks", label: "Drinks, powders, sachets" },
      { value: "any", label: "No preference" },
    ],
  },
  {
    id: "budget",
    kind: "single",
    title: "Monthly budget for this?",
    options: [
      { value: "low", label: "Up to $30" },
      { value: "mid", label: "$30–60" },
      { value: "any", label: "No limit" },
    ],
  },
  {
    id: "diet",
    kind: "single",
    title: "Any dietary restrictions?",
    options: [
      { value: "none", label: "None" },
      { value: "plant", label: "No animal-derived ingredients" },
    ],
  },
  {
    id: "stage",
    kind: "single",
    title: "Age range?",
    options: [
      { value: "u30", label: "Under 30" },
      { value: "30_45", label: "30–45" },
      { value: "45p", label: "45+" },
    ],
  },
  {
    id: "commitment",
    kind: "single",
    title: "How many products are you up for taking?",
    options: [
      { value: "one", label: "1–2, just the essentials" },
      { value: "few", label: "2–3" },
      { value: "set", label: "The full stack" },
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
  const lines = [`Main focus — ${domainLabel(primary)}.`];

  const focusLabel = DOMAIN_FOCUS[primary]?.options.find(
    (o) => o.value === a.focus,
  )?.label;
  if (focusLabel) lines.push(`Focused on: ${focusLabel.toLowerCase()}.`);
  if (rest.length) {
    lines.push(`Also matters: ${rest.map(domainLabel).join(", ")}.`);
  }
  if (a.budget === "low") lines.push("Budget — up to $30 a month.");
  if (a.diet === "plant") lines.push("No animal-derived ingredients.");
  return lines;
};
