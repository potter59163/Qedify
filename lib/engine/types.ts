import type { Lang } from "./lang";
import type { Rng } from "./rng";

/** Skills tracked by the learner model. They map onto the four subtopics (L1) of the paper. */
export type Skill =
  | "momentum" // p = mv
  | "vector" // direction / sign of momentum
  | "impulse" // J = FΔt = Δp
  | "force-time" // longer collision time → smaller force
  | "conservation" // p_before = p_after
  | "collision-type" // elastic vs inelastic decisions
  | "energy"; // kinetic energy analysis

/** Assessment dimensions from the paper's rubric (L4). */
export type Assess = "application" | "analysis" | "decision";

/** Support level: 0 = guided, 1 = standard, 2 = expert (scaffolding faded). */
export type Tier = 0 | 1 | 2;

export interface Misconception {
  id: string;
  skill: Skill;
  title: string;
  body: string;
}

export interface Given {
  label: string;
  value: string;
}

/** Line icons available to missions and options (drawn in components/icon.tsx). */
export type IconName =
  | "home" | "book" | "trophy" | "user" | "bolt" | "flame" | "star" | "heart" | "lock" | "check" | "x"
  | "bulb" | "clock" | "flask" | "gear" | "skull" | "target" | "scale" | "arrows" | "box" | "stop"
  | "battery" | "magnet" | "search" | "wind" | "spring" | "shield" | "disc" | "foam" | "balloon"
  | "thermo" | "void" | "arrow-left" | "arrow-right" | "hourglass" | "zero" | "question" | "equal"
  | "robot" | "chart" | "medal" | "crown" | "refresh" | "warning" | "sparkles" | "rocket" | "satellite"
  | "pod" | "astronaut" | "burst" | "ban" | "globe" | "clipboard" | "play" | "chevron-right"
  | "chevron-down" | "chevron-up" | "link" | "info" | "trash" | "flag" | "school";

/** Illustrated objects that can appear in the simulation (drawn in components/art.tsx). */
export type ArtName =
  | "rocket" | "satellite" | "saucer" | "pod" | "astronaut" | "toolkit" | "module" | "canister" | "telescope";

/** A body on the 1-D track. Velocity is signed: + is rightward. */
export interface Body {
  art: ArtName;
  name: string;
  m: number;
  v: number;
}

export interface Scene {
  backdrop: "orbit" | "dock" | "pad";
  bodies: Body[];
  /** Velocities after the event, played when the mission is solved. */
  after?: { v: number[]; merged: boolean };
}

export interface StepCommon {
  id: string;
  skill: Skill;
  assess: Assess;
  title: string;
  prompt: string;
  formula: string;
  /** Three levels: concept recall → strategy → set-up. Never the final number. */
  hints: string[];
  scaffold: string[];
  /** Worked solution, shown after the step is solved or the mission is lost. */
  explain: string;
}

export interface Trap {
  value: number;
  m: Misconception;
}

export interface NumericStep extends StepCommon {
  kind: "numeric";
  label: string;
  unit: string;
  answer: number;
  tol: number;
  /** When true the sign carries meaning (+ right, − left). */
  signed: boolean;
  traps: Trap[];
}

export interface ChoiceOption {
  id: string;
  label: string;
  detail?: string;
  icon?: IconName;
  correct: boolean;
  /** Feedback when this (wrong) option is chosen. */
  why?: string;
  m?: Misconception;
}

export interface ChoiceStep extends StepCommon {
  kind: "choice";
  options: ChoiceOption[];
}

export interface PairField {
  label: string;
  unit: string;
  max: number;
}

/** Open-ended design step: pick two values whose product hits a target. */
export interface PairStep extends StepCommon {
  kind: "pair";
  a: PairField;
  b: PairField;
  target: number;
  unit: string;
  tol: number;
  traps: Trap[];
  overA: Misconception;
  overB: Misconception;
}

export type Step = NumericStep | ChoiceStep | PairStep;

export type StepInput =
  | { kind: "numeric"; value: number }
  | { kind: "choice"; id: string }
  | { kind: "pair"; a: number; b: number };

export interface CheckResult {
  ok: boolean;
  near?: boolean;
  m?: Misconception;
  title: string;
  body: string;
}

export interface MissionInstance {
  story: string;
  givens: Given[];
  scene: Scene;
  steps: Step[];
  /** Raw numbers behind the mission, used by the verifier and the AI coach. */
  meta: Record<string, number>;
}

export interface MissionDef {
  id: string;
  chapter: 1 | 2 | 3 | 4;
  title: string;
  icon: IconName;
  tagline: string;
  skills: Skill[];
  /** Seconds allowed at the standard tier. */
  baseTime: number;
  baseXp: number;
  boss?: boolean;
  /** `lang` picks the language of every string in the instance; the numbers do not depend on it. */
  build: (rng: Rng, tier: Tier, lang?: Lang) => MissionInstance;
}
