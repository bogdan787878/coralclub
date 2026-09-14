"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  asArray,
  isStepAnswered,
  resolveOptions,
  titleOf,
  visibleSteps,
  type Answers,
} from "@/lib/quiz";
import { QuizResult } from "./QuizResult";
import styles from "./QuizFlow.module.css";

// the background cycles through the malachite palette (tokens.css) as you
// move through the quiz — same brand scale used for --color-text/--color-action
const MALACHITE = [
  "var(--color-malachite-100)",
  "var(--color-malachite-90)",
  "var(--color-malachite-70)",
];

export function QuizFlow() {
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);

  const steps = useMemo(() => visibleSteps(answers), [answers]);
  const clamped = Math.min(index, steps.length - 1);
  const step = steps[clamped];

  const questionSteps = steps.filter(
    (s) => s.kind === "single" || s.kind === "multi",
  );
  const qNumber = questionSteps.indexOf(step) + 1;
  const progress =
    step.kind === "result"
      ? 1
      : Math.max(0, qNumber) / (questionSteps.length + 1);

  const go = (delta: number) =>
    setIndex((i) => Math.max(0, Math.min(steps.length - 1, i + delta)));

  const setAnswer = (id: string, value: string | string[]) =>
    setAnswers((a) => ({ ...a, [id]: value }));

  const pickSingle = (id: string, value: string) => setAnswer(id, value);

  const toggleMulti = (id: string, value: string, max?: number) => {
    const current = asArray(answers[id]);
    const has = current.includes(value);
    if (!has && max && current.length >= max) return;
    setAnswer(
      id,
      has ? current.filter((v) => v !== value) : [...current, value],
    );
  };

  const isLong = step.kind === "result" || step.kind === "multi";

  const footerLabel = step.kind === "intro" ? step.cta : "Next";
  const footerDisabled =
    step.kind === "multi"
      ? !isStepAnswered(step, answers)
      : step.kind === "single"
        ? !answers[step.id]
        : false;

  return (
    <div
      className={styles.root}
      style={
        {
          backgroundColor: MALACHITE[clamped % MALACHITE.length],
          "--q-bg": MALACHITE[clamped % MALACHITE.length],
        } as React.CSSProperties
      }
    >
      <header className={styles.bar}>
        <div className={styles.track} aria-hidden="true">
          <span
            className={styles.fill}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <div className={styles.barRow}>
          <Link href="/" className={styles.ghost}>
            ← Home
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
              <h2 className={styles.title}>{titleOf(step, answers)}</h2>
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
                          {opt.hint && (
                            <span className={styles.optionHint}>{opt.hint}</span>
                          )}
                        </span>
                        <span className={styles.tick} aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {step.kind === "result" && <QuizResult answers={answers} />}
        </div>
      </main>

      {step.kind !== "result" && (
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            {step.kind !== "intro" && (
              <button
                type="button"
                className={styles.back}
                aria-label="Back"
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
              onClick={() => go(1)}
            >
              {footerLabel}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
