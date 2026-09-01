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

  const pickSingle = (id: string, value: string) => {
    setAnswer(id, value);
    // let the selected state paint before advancing
    window.setTimeout(() => setIndex((i) => Math.min(steps.length - 1, i + 1)), 160);
  };

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

  const canAdvance =
    step.kind === "multi" ? isStepAnswered(step, answers) : true;

  return (
    <div className={`${styles.root} ${toneClass[step.tone]}`}>
      <header className={styles.bar}>
        <div className={styles.track} aria-hidden="true">
          <span className={styles.fill} style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <div className={styles.barRow}>
          {step.kind !== "intro" && step.kind !== "result" ? (
            <button type="button" className={styles.ghost} onClick={() => go(-1)}>
              ← Назад
            </button>
          ) : (
            <Link href="/" className={styles.ghost}>
              ← На главную
            </Link>
          )}
          {qNumber > 0 && step.kind !== "result" && (
            <span className={styles.counter}>
              {qNumber} / {questionSteps.length}
            </span>
          )}
        </div>
      </header>

      <main
        className={`${styles.stage} ${
          step.kind === "result" || step.kind === "contact" ? styles.stageTop : ""
        }`}
      >
        <div className={styles.inner} key={step.id}>
          {step.kind === "intro" && (
            <div className={styles.intro}>
              <p className={styles.kicker}>{step.kicker}</p>
              <h1 className={styles.title}>{step.title}</h1>
              <p className={styles.lead}>{step.body}</p>
              <button type="button" className={styles.primary} onClick={() => go(1)}>
                {step.cta}
              </button>
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

              {step.kind === "multi" && (
                <button
                  type="button"
                  className={styles.primary}
                  disabled={!canAdvance}
                  onClick={() => go(1)}
                >
                  Далее
                </button>
              )}
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

              <button
                type="button"
                className={styles.primary}
                disabled={submitting}
                onClick={submitContact}
              >
                {submitting ? "Отправляем…" : "Получить протокол"}
              </button>
            </>
          )}

          {step.kind === "result" && (
            <QuizResult answers={answers} name={contact.name} email={contact.email} />
          )}
        </div>
      </main>
    </div>
  );
}
