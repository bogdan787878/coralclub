"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  asArray,
  buildLead,
  isEmail,
  isStepAnswered,
  resolveOptions,
  submitLead,
  visibleSteps,
  type Answers,
  type Step,
} from "@/lib/quiz";
import { QuizResult } from "./QuizResult";
import styles from "./QuizFlow.module.css";

const toneClass: Record<Step["tone"], string> = {
  navy: styles.toneNavy,
  blue: styles.toneBlue,
  peach: styles.tonePeach,
  green: styles.toneGreen,
};

export function QuizFlow() {
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [contact, setContact] = useState({ name: "", email: "", phone: "", consent: false });
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const steps = useMemo(() => visibleSteps(answers), [answers]);
  const clamped = Math.min(index, steps.length - 1);
  const step = steps[clamped];

  // question steps only (drop intro + result) for the "x of y" counter
  const questionSteps = steps.filter((s) => s.kind === "single" || s.kind === "multi" || s.kind === "contact");
  const qNumber = questionSteps.indexOf(step) + 1;
  const progress = step.kind === "result" ? 1 : Math.max(0, qNumber) / (questionSteps.length + 1);

  const go = (delta: number) => setIndex((i) => Math.max(0, Math.min(steps.length - 1, i + delta)));

  const setAnswer = (id: string, value: string | string[]) =>
    setAnswers((a) => ({ ...a, [id]: value }));

  // forward nav is the pinned "Далее" button — selecting only records the answer
  const pickSingle = (id: string, value: string) => setAnswer(id, value);

  const toggleMulti = (id: string, value: string, max?: number) => {
    const current = asArray(answers[id]);
    const has = current.includes(value);
    if (!has && max && current.length >= max) return;
    setAnswer(id, has ? current.filter((v) => v !== value) : [...current, value]);
  };

  const contactValid =
    contact.name.trim().length > 1 && isEmail(contact.email) && contact.consent;

  const submitContact = async () => {
    setTouched(true);
    if (!contactValid || submitting) return;
    setSubmitting(true);
    await submitLead(buildLead(answers, contact));
    setSubmitting(false);
    go(1);
  };

  const isLong =
    step.kind === "result" || step.kind === "contact" || step.kind === "multi";

  // footer: one persistent primary + a round back button
  const footerLabel =
    step.kind === "intro"
      ? step.cta
      : step.kind === "contact"
        ? submitting
          ? "Отправляем…"
          : "Получить протокол"
        : "Далее";

  const footerDisabled =
    step.kind === "contact"
      ? submitting
      : step.kind === "multi"
        ? !isStepAnswered(step, answers)
        : step.kind === "single"
          ? !answers[step.id]
          : false;

  const footerAction = () => {
    if (step.kind === "contact") return void submitContact();
    go(1);
  };

  return (
    <div className={`${styles.root} ${toneClass[step.tone]}`}>
      <header className={styles.bar}>
        <div className={styles.track} aria-hidden="true">
          <span className={styles.fill} style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <div className={styles.barRow}>
          <Link href="/" className={styles.ghost}>
            ← На главную
          </Link>
          {qNumber > 0 && step.kind !== "result" && (
            <span className={styles.counter}>
              {qNumber} / {questionSteps.length}
            </span>
          )}
        </div>
      </header>

      <main className={`${styles.stage} ${isLong ? styles.stageTop : ""}`}>
        <div className={styles.inner} key={step.id}>
          {step.kind === "intro" && (
            <div className={styles.intro}>
              <p className={styles.kicker}>{step.kicker}</p>
              <h1 className={styles.title}>{step.title}</h1>
              <p className={styles.lead}>{step.body}</p>
            </div>
          )}

          {(step.kind === "single" || step.kind === "multi") && (
            <>
              <h2 className={styles.title}>{step.title}</h2>
              {step.help && <p className={styles.help}>{step.help}</p>}

              <ul className={styles.options} role="list">
                {resolveOptions(step, answers).map((opt) => {
                  const selected =
                    step.kind === "multi"
                      ? asArray(answers[step.id]).includes(opt.value)
                      : answers[step.id] === opt.value;
                  return (
                    <li key={opt.value}>
                      <button
                        type="button"
                        className={`${styles.option} ${selected ? styles.optionOn : ""}`}
                        aria-pressed={selected}
                        onClick={() =>
                          step.kind === "multi"
                            ? toggleMulti(step.id, opt.value, step.max)
                            : pickSingle(step.id, opt.value)
                        }
                      >
                        <span className={styles.optionMain}>
                          <span className={styles.optionLabel}>{opt.label}</span>
                          {opt.hint && <span className={styles.optionHint}>{opt.hint}</span>}
                        </span>
                        <span className={styles.tick} aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {step.kind === "contact" && (
            <>
              <h2 className={styles.title}>{step.title}</h2>
              <p className={styles.help}>{step.help}</p>

              <div className={styles.form}>
                <label className={styles.field}>
                  <span>Имя</span>
                  <input
                    className={styles.input}
                    value={contact.name}
                    autoComplete="name"
                    onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                  />
                </label>
                <label className={styles.field}>
                  <span>Email</span>
                  <input
                    className={styles.input}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={contact.email}
                    onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                  />
                  {touched && !isEmail(contact.email) && (
                    <span className={styles.error}>Проверь адрес почты</span>
                  )}
                </label>
                <label className={styles.field}>
                  <span>
                    Телефон <em className={styles.optional}>— по желанию</em>
                  </span>
                  <input
                    className={styles.input}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={contact.phone}
                    onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                  />
                </label>

                <label className={styles.consent}>
                  <input
                    type="checkbox"
                    checked={contact.consent}
                    onChange={(e) => setContact((c) => ({ ...c, consent: e.target.checked }))}
                  />
                  <span>Согласен на обработку данных и связь по протоколу</span>
                </label>
                {touched && !contact.consent && (
                  <span className={styles.error}>Без согласия не сможем прислать разбор</span>
                )}
              </div>
            </>
          )}

          {step.kind === "result" && (
            <QuizResult answers={answers} name={contact.name} email={contact.email} />
          )}
        </div>
      </main>

      {step.kind !== "result" && (
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            {step.kind !== "intro" && (
              <button
                type="button"
                className={styles.back}
                aria-label="Назад"
                onClick={() => go(-1)}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M15 6l-6 6 6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            <button
              type="button"
              className={styles.next}
              disabled={footerDisabled}
              onClick={footerAction}
            >
              {footerLabel}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
