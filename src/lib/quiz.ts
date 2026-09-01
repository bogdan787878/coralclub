/**
 * Wellness quiz — the question graph + the protocol builder.
 *
 * Every answer maps onto the 7 base Goals (see products.ts). The result is a
 * three-phase protocol (Hydration → Restart → Personalization) plus a product
 * selection filtered by the chosen goals. Contacts are captured at the end;
 * `submitLead` is the single seam to wire a real backend into later.
 */

import type { Goal } from "./products";
import { GOALS, getPhases } from "./products";

export type Answer = string | string[];
export type Answers = Record<string, Answer>;

export type Tone = "navy" | "blue" | "peach" | "green";

export type Option = { value: string; label: string; hint?: string };

export type Step =
  | { id: string; kind: "intro"; tone: Tone; kicker: string; title: string; body: string; cta: string }
  | {
      id: string;
      kind: "single" | "multi";
      tone: Tone;
      title: string;
      help?: string;
      options: Option[] | ((a: Answers) => Option[]);
      /** multi only */
      min?: number;
      max?: number;
      showIf?: (a: Answers) => boolean;
    }
  | { id: string; kind: "contact"; tone: Tone; title: string; help: string }
  | { id: string; kind: "result"; tone: Tone };

/* -------------------------------------------------------------------------- */
/* Goal metadata                                                             */
/* -------------------------------------------------------------------------- */

const GOAL_EMOJI: Record<Goal, string> = {
  energy: "⚡️",
  sleep: "🌙",
  skin: "✨",
  detox: "🍃",
  weight: "⚖️",
  immune: "🛡️",
  hydration: "💧",
};

const GOAL_HINT: Record<Goal, string> = {
  energy: "Меньше усталости, ровные силы весь день",
  sleep: "Легче засыпать, крепче спать, бодрее вставать",
  skin: "Кожа, волосы и ногти",
  detox: "Убрать тяжесть, наладить ЖКТ",
  weight: "Сдвинуть вес и разогнать обмен",
  immune: "Реже болеть, быстрее восстанавливаться",
  hydration: "Нормальный водно-солевой баланс",
};

export const goalLabel = (id: Goal): string =>
  GOALS.find((g) => g.id === id)?.label ?? id;

const GOAL_OPTIONS: Option[] = GOALS.map((g) => ({
  value: g.id,
  label: `${GOAL_EMOJI[g.id]}  ${g.label}`,
  hint: GOAL_HINT[g.id],
}));

/* -------------------------------------------------------------------------- */
/* Answer helpers                                                            */
/* -------------------------------------------------------------------------- */

export const asArray = (v: Answer | undefined): string[] =>
  Array.isArray(v) ? v : v ? [v] : [];

const goalsOf = (a: Answers): Goal[] => asArray(a.goals) as Goal[];

const wants = (a: Answers, g: Goal) => goalsOf(a).includes(g);

/** The one goal that matters most — explicit priority, else the first pick. */
export const primaryGoal = (a: Answers): Goal | undefined =>
  (a.priority as Goal) || goalsOf(a)[0];

/* -------------------------------------------------------------------------- */
/* The question graph                                                        */
/* -------------------------------------------------------------------------- */

export const STEPS: Step[] = [
  {
    id: "intro",
    kind: "intro",
    tone: "navy",
    kicker: "2 минуты · 12 вопросов",
    title: "Соберём твой протокол",
    body: "Ответь на несколько вопросов о самочувствии и целях — на выходе получишь персональный план по фазам и подборку продуктов под свою задачу.",
    cta: "Начать",
  },

  {
    id: "goals",
    kind: "multi",
    tone: "blue",
    title: "Что хочешь улучшить в первую очередь?",
    help: "Выбери от 1 до 3",
    min: 1,
    max: 3,
    options: GOAL_OPTIONS,
  },

  {
    id: "priority",
    kind: "single",
    tone: "peach",
    title: "А что из этого — самое важное прямо сейчас?",
    help: "С этого начнём протокол",
    showIf: (a) => goalsOf(a).length > 1,
    options: (a) =>
      goalsOf(a).map((g) => ({
        value: g,
        label: `${GOAL_EMOJI[g]}  ${goalLabel(g)}`,
      })),
  },

  /* ---- per-goal follow-ups ------------------------------------------------ */
  {
    id: "energy_when",
    kind: "single",
    tone: "green",
    title: "Когда энергии не хватает сильнее всего?",
    showIf: (a) => wants(a, "energy"),
    options: [
      { value: "morning", label: "Тяжело по утрам" },
      { value: "afternoon", label: "Проседаю после обеда" },
      { value: "evening", label: "К вечеру ничего не остаётся" },
      { value: "allday", label: "Устаю весь день, без пиков" },
    ],
  },
  {
    id: "sleep_issue",
    kind: "single",
    tone: "blue",
    title: "Что именно не так со сном?",
    showIf: (a) => wants(a, "sleep"),
    options: [
      { value: "fallasleep", label: "Долго не могу заснуть" },
      { value: "wakeup", label: "Просыпаюсь среди ночи" },
      { value: "unrested", label: "Встаю разбитым даже после 8 часов" },
      { value: "stress", label: "Мысли и стресс не дают расслабиться" },
    ],
  },
  {
    id: "skin_issue",
    kind: "single",
    tone: "peach",
    title: "Что беспокоит с кожей и волосами?",
    showIf: (a) => wants(a, "skin"),
    options: [
      { value: "dry", label: "Сухость и стянутость" },
      { value: "dull", label: "Тусклый цвет, нет тонуса" },
      { value: "breakouts", label: "Высыпания, воспаления" },
      { value: "hair", label: "Волосы и ногти слабые" },
    ],
  },
  {
    id: "detox_why",
    kind: "single",
    tone: "green",
    title: "Откуда, по ощущениям, тяжесть?",
    showIf: (a) => wants(a, "detox"),
    options: [
      { value: "eatout", label: "Часто ем вне дома / фастфуд" },
      { value: "lowfiber", label: "Мало воды и клетчатки" },
      { value: "gut", label: "Нерегулярный ЖКТ, вздутие" },
      { value: "afterload", label: "После праздников, поездки или лекарств" },
    ],
  },
  {
    id: "weight_block",
    kind: "single",
    tone: "blue",
    title: "Что не получается с весом?",
    showIf: (a) => wants(a, "weight"),
    options: [
      { value: "stuck", label: "Вес стоит, хотя стараюсь" },
      { value: "cravings", label: "Постоянно тянет на сладкое и мучное" },
      { value: "metabolism", label: "Обмен будто замедлился" },
      { value: "evening", label: "Срываюсь по вечерам, заедаю стресс" },
    ],
  },
  {
    id: "immune_freq",
    kind: "single",
    tone: "peach",
    title: "Как часто болеешь?",
    showIf: (a) => wants(a, "immune"),
    options: [
      { value: "often", label: "3+ раза в год" },
      { value: "seasonal", label: "Только в сезон простуд" },
      { value: "longrecovery", label: "Выздоравливаю долго, с осложнениями" },
      { value: "prevention", label: "Почти не болею — хочу профилактику" },
    ],
  },
  {
    id: "hydration_intake",
    kind: "single",
    tone: "green",
    title: "Сколько чистой воды выпиваешь в день?",
    showIf: (a) => wants(a, "hydration"),
    options: [
      { value: "low", label: "Меньше 1 литра" },
      { value: "mid", label: "1–1.5 литра" },
      { value: "high", label: "2 литра и больше" },
      { value: "unknown", label: "Не считаю, чаще кофе и чай" },
    ],
  },

  /* ---- context --------------------------------------------------------- */
  {
    id: "day_rhythm",
    kind: "single",
    tone: "blue",
    title: "Какой у тебя обычный день?",
    help: "Влияет на то, что реально впишется в рутину",
    options: [
      { value: "home", label: "Дом / удалёнка" },
      { value: "office", label: "Офис, режим более-менее стабильный" },
      { value: "travel", label: "Разъезды, командировки, часовые пояса" },
      { value: "shifts", label: "Сменный или ненормированный график" },
    ],
  },
  {
    id: "supp_experience",
    kind: "single",
    tone: "peach",
    title: "Твой опыт с добавками?",
    options: [
      { value: "none", label: "Никогда толком не пробовал" },
      { value: "random", label: "Пробовал бессистемно, без результата" },
      { value: "regular", label: "Принимаю что-то регулярно" },
      { value: "quit", label: "Принимал курсами и бросил — не увидел эффекта" },
    ],
  },
  {
    id: "format_pref",
    kind: "single",
    tone: "green",
    title: "Как удобнее принимать?",
    options: [
      { value: "caps", label: "Капсулы и таблетки" },
      { value: "powder", label: "Порошок в воду" },
      { value: "drink", label: "Готовый напиток" },
      { value: "any", label: "Без разницы, лишь бы работало" },
    ],
  },
  {
    id: "success_signals",
    kind: "multi",
    tone: "blue",
    title: "Как поймёшь, что протокол сработал?",
    help: "Выбери всё, что подходит",
    min: 1,
    options: [
      { value: "energy_evening", label: "Есть силы к вечеру" },
      { value: "sleep_rested", label: "Высыпаюсь и легко встаю" },
      { value: "skin_mirror", label: "Кожа и волосы заметно лучше" },
      { value: "weight_scale", label: "Вес и объёмы уходят" },
      { value: "immune_lesssick", label: "Реже простужаюсь" },
      { value: "gut_light", label: "Лёгкость в животе, стабильный ЖКТ" },
      { value: "labs", label: "Лучше анализы и общее самочувствие" },
    ],
  },
  {
    id: "budget",
    kind: "single",
    tone: "peach",
    title: "Комфортный бюджет в месяц?",
    options: [
      { value: "s", label: "До $50" },
      { value: "m", label: "$50–100" },
      { value: "l", label: "$100–200" },
      { value: "xl", label: "Бюджет вторичен, важен результат" },
    ],
  },
  {
    id: "horizon",
    kind: "single",
    tone: "green",
    title: "Когда хочешь увидеть первый результат?",
    options: [
      { value: "week", label: "Уже на этой неделе" },
      { value: "month", label: "Готов подождать месяц" },
      { value: "quarter", label: "Готов идти системно 2–3 месяца" },
    ],
  },

  {
    id: "contact",
    kind: "contact",
    tone: "navy",
    title: "Куда прислать протокол?",
    help: "Разберём ответы и вернёмся с персональным планом и подборкой.",
  },

  { id: "result", kind: "result", tone: "navy" },
];

/** Steps visible for the current answers (branching resolved). */
export const visibleSteps = (a: Answers): Step[] =>
  STEPS.filter((s) => !("showIf" in s) || !s.showIf || s.showIf(a));

export const resolveOptions = (step: Step, a: Answers): Option[] => {
  if (step.kind !== "single" && step.kind !== "multi") return [];
  return typeof step.options === "function" ? step.options(a) : step.options;
};

export const isStepAnswered = (step: Step, a: Answers): boolean => {
  if (step.kind === "single") return typeof a[step.id] === "string" && a[step.id] !== "";
  if (step.kind === "multi") return asArray(a[step.id]).length >= (step.min ?? 1);
  return true; // intro / contact / result validate elsewhere
};

/* -------------------------------------------------------------------------- */
/* Protocol builder                                                          */
/* -------------------------------------------------------------------------- */

const LABELS: Record<string, Record<string, string>> = {
  day_rhythm: {
    home: "дом и удалёнка",
    office: "офис со стабильным режимом",
    travel: "частые разъезды и смена часовых поясов",
    shifts: "сменный график",
  },
  supp_experience: {
    none: "добавок раньше не было",
    random: "принимал бессистемно, без результата",
    regular: "уже принимаешь что-то регулярно",
    quit: "пробовал курсами и бросил",
  },
  format_pref: {
    caps: "капсулы",
    powder: "порошок в воду",
    drink: "готовый напиток",
    any: "формат не принципиален",
  },
  budget: { s: "до $50 / мес", m: "$50–100 / мес", l: "$100–200 / мес", xl: "бюджет вторичен" },
  horizon: {
    week: "результат нужен уже на этой неделе",
    month: "готов подождать месяц",
    quarter: "готов идти системно 2–3 месяца",
  },
  success_signals: {
    energy_evening: "силы к вечеру",
    sleep_rested: "высыпаться",
    skin_mirror: "кожа и волосы",
    weight_scale: "вес и объёмы",
    immune_lesssick: "реже болеть",
    gut_light: "лёгкость в животе",
    labs: "анализы и самочувствие",
  },
};

const PHASE_WHY: Record<string, string> = {
  hydration:
    "Основа протокола. Пока клетки обезвожены, остальные добавки почти не работают — сначала выравниваем водно-солевой баланс.",
  restart:
    "Снимаем накопленную нагрузку на ЖКТ и печень, чтобы следующий шаг усваивался в полную силу.",
  personalization:
    "Точечная нутриционная поддержка под твою главную цель — когда база и разгрузка уже сделаны.",
};

export type ProtocolPhase = {
  id: string;
  index: number;
  name: string;
  why: string;
  products: ReturnType<typeof getPhases>[number]["products"];
  /** how many products matched the chosen goals directly */
  matched: number;
};

/** Build the 3-phase protocol: every phase is shown; products are ranked by
 *  overlap with the chosen goals, with the phase lead as a fallback. */
export const buildProtocol = (a: Answers): ProtocolPhase[] => {
  const goals = goalsOf(a);
  const primary = primaryGoal(a);

  return getPhases().map((phase) => {
    const ranked = phase.products
      .map((p) => {
        const overlap = p.goals.filter((g) => goals.includes(g)).length;
        const score = overlap + (primary && p.goals.includes(primary) ? 1 : 0);
        return { p, score, overlap };
      })
      .sort((x, y) => y.score - x.score);

    const matched = ranked.filter((r) => r.overlap > 0);
    const products = (matched.length ? matched : ranked.slice(0, 1))
      .slice(0, 3)
      .map((r) => r.p);

    return {
      id: phase.id,
      index: phase.index,
      name: phase.name,
      why: PHASE_WHY[phase.id] ?? "",
      products,
      matched: matched.length,
    };
  });
};

/** Human-readable recap of what the quiz learned — shown on the result. */
export const recapLines = (a: Answers): string[] => {
  const lines: string[] = [];
  const primary = primaryGoal(a);
  if (primary) lines.push(`Главная цель — ${goalLabel(primary)}.`);

  const rest = goalsOf(a).filter((g) => g !== primary);
  if (rest.length) lines.push(`Ещё важно: ${rest.map((g) => goalLabel(g)).join(", ")}.`);

  const signals = asArray(a.success_signals)
    .map((v) => LABELS.success_signals[v])
    .filter(Boolean);
  if (signals.length) lines.push(`Успех для тебя — это ${signals.join(", ")}.`);

  const ctx: string[] = [];
  if (typeof a.day_rhythm === "string") ctx.push(LABELS.day_rhythm[a.day_rhythm]);
  if (typeof a.supp_experience === "string") ctx.push(LABELS.supp_experience[a.supp_experience]);
  if (ctx.length) lines.push(`Контекст: ${ctx.join("; ")}.`);

  const pick = (k: string) =>
    typeof a[k] === "string" ? LABELS[k]?.[a[k] as string] : undefined;
  const prefs = [pick("format_pref"), pick("budget"), pick("horizon")].filter(Boolean);
  if (prefs.length) lines.push(`Предпочтения: ${prefs.join("; ")}.`);

  return lines;
};

/* -------------------------------------------------------------------------- */
/* Lead capture — the single seam for a future backend                       */
/* -------------------------------------------------------------------------- */

export type Lead = {
  name: string;
  email: string;
  phone?: string;
  goals: string[];
  answers: Answers;
  submittedAt: string;
};

export const buildLead = (
  a: Answers,
  contact: { name: string; email: string; phone?: string },
): Lead => ({
  name: contact.name.trim(),
  email: contact.email.trim(),
  phone: contact.phone?.trim() || undefined,
  goals: goalsOf(a),
  answers: a,
  submittedAt: new Date().toISOString(),
});

/**
 * Persist a lead. No backend yet — we keep it in localStorage so nothing is
 * lost, and this is the one place to add a POST when the API exists.
 */
export const submitLead = async (lead: Lead): Promise<void> => {
  // TODO(backend): await fetch("/api/leads", { method: "POST", body: JSON.stringify(lead) })
  try {
    const key = `coralclub.lead.${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(lead));
  } catch {
    /* storage unavailable — ignore, the UI still advances */
  }
};

export const isEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
