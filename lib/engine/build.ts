import { MIS, type MisId } from "./misconceptions";
import type {
  ChoiceOption,
  ChoiceStep,
  Misconception,
  NumericStep,
  PairField,
  PairStep,
  StepCommon,
  Trap,
} from "./types";

export const U = {
  p: "kg·m/s",
  J: "N·s",
  F: "N",
  v: "m/s",
  E: "J",
  m: "kg",
  t: "s",
} as const;

/** 12345.5 → "12,345.5" (at most `dp` decimals, trailing zeros trimmed). */
export function fmt(n: number, dp = 2): string {
  const k = 10 ** dp;
  const r = Math.round(n * k) / k;
  const [i, f = ""] = Math.abs(r).toFixed(dp).split(".");
  const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const frac = f.replace(/0+$/, "");
  return (r < 0 ? "-" : "") + int + (frac ? "." + frac : "");
}

/** Signed format: +4.8 / -4.8 / 0. */
export function sfmt(n: number, dp = 2): string {
  return (n > 0 ? "+" : "") + fmt(n, dp);
}

export const r2 = (x: number) => Math.round(x * 100) / 100;

/** True when x has at most `dp` decimals (so the answer needs no rounding). */
export const isDp = (x: number, dp: number) =>
  Math.abs(x * 10 ** dp - Math.round(x * 10 ** dp)) < 1e-6;

export function mis(id: MisId, title: string, body: string): Misconception {
  return { id, skill: MIS[id].skill, title, body };
}

/** Redraw until the candidate satisfies `ok`; fall back to a known-good value. */
export function draw<T>(gen: () => T, ok: (x: T) => boolean, fallback: T): T {
  for (let i = 0; i < 400; i++) {
    const x = gen();
    if (ok(x)) return x;
  }
  return fallback;
}

type NumericSpec = StepCommon & {
  label: string;
  unit: string;
  answer: number;
  signed?: boolean;
  traps?: Trap[];
};

/**
 * Numeric step. Traps that coincide with the right answer (or with its
 * negative, which the checker already reports as a direction error) are
 * dropped so a correct answer can never be flagged as a misconception.
 */
export function numeric(s: NumericSpec): NumericStep {
  const answer = r2(s.answer);
  const signed = !!s.signed;
  const tol = Math.max(Math.abs(answer) * 0.005, 0.011);
  const kept: Trap[] = [];
  for (const t of s.traps ?? []) {
    if (!Number.isFinite(t.value)) continue;
    const v = signed ? t.value : Math.abs(t.value);
    if (Math.abs(v - answer) <= tol * 4) continue;
    if (signed && Math.abs(v + answer) <= tol * 4) continue;
    if (kept.some((k) => Math.abs(k.value - v) <= Math.max(tol, Math.abs(v) * 0.005) * 2)) continue;
    kept.push({ value: v, m: t.m });
  }
  return { ...s, kind: "numeric", answer, tol, signed, traps: kept };
}

export function choice(s: StepCommon & { options: ChoiceOption[] }): ChoiceStep {
  return { ...s, kind: "choice" };
}

type PairSpec = StepCommon & {
  a: PairField;
  b: PairField;
  target: number;
  unit: string;
  traps?: Trap[];
  overA: Misconception;
  overB: Misconception;
};

export function pair(s: PairSpec): PairStep {
  const tol = Math.max(Math.abs(s.target) * 0.005, 0.5);
  const traps = (s.traps ?? []).filter(
    (t) => Number.isFinite(t.value) && Math.abs(t.value - s.target) > tol * 4,
  );
  return { ...s, kind: "pair", tol, traps };
}
