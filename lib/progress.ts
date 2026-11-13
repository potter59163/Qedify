/**
 * Pure functions over the learner state: unlocks, adaptive support tier,
 * scoring, levels, streaks, badges and analytics summaries.
 * Nothing here touches React or storage, so it can be reasoned about (and
 * tested) in isolation.
 */
import { MISSIONS, SKILL_ORDER, missionById, missionText, skillLabel } from "./engine/catalog";
import { pick, type Lang } from "./engine/lang";
import { CONSERVATION_VIOLATIONS, misLabel } from "./engine/misconceptions";
import type { Assess, IconName, MissionDef, Skill, Tier } from "./engine/types";

export interface Profile {
  name: string;
  avatar: string;
  school: string;
  createdAt: number;
}

export interface MissionRecord {
  stars: number;
  clears: number;
  bestMs: number;
  /** When the mission was last cleared or reviewed (spaced review, paper R). */
  last?: number;
  /** Successful retention checks so far; each one lengthens the next interval. */
  reviews?: number;
}

export interface AttemptEvent {
  ts: number;
  mission: string;
  step: string;
  skill: Skill;
  assess: Assess;
  ok: boolean;
  mis?: string;
  /** Decision time for this attempt, in ms. */
  ms: number;
  hints: number;
  tier: Tier;
  /** What the learner submitted, as text (decision path, paper A4.2). */
  answer?: string;
  /** The stall prompt had appeared on this step before the answer. */
  stalled?: boolean;
  /** Submitted during a retention check. */
  review?: boolean;
}

/** One run of the virtual lab, with the order in which the variables were adjusted (paper M4.1). */
export interface LabEvent {
  ts: number;
  m1: number;
  v1: number;
  m2: number;
  v2: number;
  mode: "elastic" | "inelastic";
  path: string[];
}

/** One retention check: a cleared mission replayed later with new numbers and no support. */
export interface ReviewEvent {
  ts: number;
  mission: string;
  /** Days since the mission was last cleared or reviewed. */
  days: number;
  firstTry: number;
  steps: number;
  won: boolean;
}

export type SurveyRole = "student" | "teacher";

export interface SurveyResponse {
  ts: number;
  role: SurveyRole;
  /** Item id → 1 (strongly disagree) … 5 (strongly agree). */
  answers: Record<string, number>;
  comment: string;
}

export interface DayStats {
  xp: number;
  ok: number;
  total: number;
  missions: number;
}

export type StepStatus = "mastered" | "partial" | "review";

export interface StepOutcome {
  id: string;
  title: string;
  skill: Skill;
  assess: Assess;
  wrong: number;
  hints: number;
  ms: number;
  solved: boolean;
  /** Times the stall prompt appeared on this step. */
  stalls?: number;
}

export interface FinishInput {
  missionId: string;
  won: boolean;
  tier: Tier;
  daily: boolean;
  /** Retention check: played later, with new numbers and no support. */
  review?: boolean;
  seed: number;
  ms: number;
  maxHints: number;
  steps: StepOutcome[];
  /** Number of steps in the mission (a lost run stops before the last one). */
  total?: number;
}

export interface MissionResult extends FinishInput {
  ts: number;
  stars: number;
  xp: number;
  accuracy: number;
  wrong: number;
  hintsUsed: number;
  firstClear: boolean;
  dailyBonus: boolean;
  statuses: StepStatus[];
  rubric: { assess: Assess; pass: boolean }[];
  misconceptions: string[];
  newBadges: string[];
  levelBefore: number;
  levelAfter: number;
}

export interface Settings {
  ai: boolean;
  /** Language of the interface and of the AI coach. */
  lang: Lang;
  sound: boolean;
  /** Mission clock: the normal limit, twice as long, or no limit at all (WCAG 2.2.1). */
  timer: "normal" | "double" | "off";
  /** Turns off decorative motion even when the system setting does not ask for it. */
  reduceMotion: boolean;
}

export interface GameState {
  v: 2;
  profile: Profile | null;
  onboarded: boolean;
  xp: number;
  records: Record<string, MissionRecord>;
  mastery: Partial<Record<Skill, { m: number; n: number }>>;
  mis: Record<string, number>;
  events: AttemptEvent[];
  days: Record<string, DayStats>;
  dailyDone: string | null;
  briefings: number[];
  labRuns: number;
  lab: LabEvent[];
  reviews: ReviewEvent[];
  surveys: SurveyResponse[];
  /** Random id that labels an exported data file without naming the learner. */
  pid: string;
  badges: string[];
  settings: Settings;
  lastResult: MissionResult | null;
  insights: { ts: number; items: string[] } | null;
}

export const INITIAL: GameState = {
  v: 2,
  profile: null,
  onboarded: false,
  xp: 0,
  records: {},
  mastery: {},
  mis: {},
  events: [],
  days: {},
  dailyDone: null,
  briefings: [],
  labRuns: 0,
  lab: [],
  reviews: [],
  surveys: [],
  pid: "",
  badges: [],
  settings: { ai: true, lang: "en", sound: true, timer: "normal", reduceMotion: false },
  lastResult: null,
  insights: null,
};

const MAX_EVENTS = 2000;
const MAX_LAB = 300;
const MAX_REVIEWS = 300;

// ───────────────────────── dates ─────────────────────────

export function dayKey(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Monday of the week containing `d`, as a day key. */
export function weekStart(d: Date = new Date()): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export function msUntilMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

export function msUntilWeekEnd(now: Date = new Date()): number {
  return addDays(weekStart(now), 7).getTime() - now.getTime();
}

export function fmtClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

// ───────────────────────── progression ─────────────────────────

export function isCleared(s: GameState, id: string): boolean {
  return !!s.records[id];
}

export function isUnlocked(s: GameState, id: string): boolean {
  const i = MISSIONS.findIndex((m) => m.id === id);
  if (i < 0) return false;
  return i === 0 || isCleared(s, MISSIONS[i - 1].id);
}

/** The first mission that has not been cleared yet (or undefined when all are). */
export function nextMission(s: GameState): MissionDef | undefined {
  return MISSIONS.find((m) => !isCleared(s, m.id));
}

export function chapterProgress(s: GameState, chapter: number) {
  const list = MISSIONS.filter((m) => m.chapter === chapter);
  const done = list.filter((m) => isCleared(s, m.id)).length;
  return { total: list.length, done, unlocked: isUnlocked(s, list[0].id), complete: done === list.length };
}

export function totalStars(s: GameState): number {
  return Object.values(s.records).reduce((a, r) => a + r.stars, 0);
}

export function masteryOf(s: GameState, skill: Skill): number {
  return s.mastery[skill]?.m ?? 0;
}

/**
 * Adaptive support tier (dynamic difficulty adjustment, flow theory):
 * low mastery → more hints, visible vectors, rounder numbers;
 * high mastery → scaffolding fades and the clock tightens.
 */
export function tierFor(s: GameState, def: MissionDef): Tier {
  const avg = def.skills.reduce((a, k) => a + masteryOf(s, k), 0) / def.skills.length;
  const tier: Tier = avg < 0.45 ? 0 : avg < 0.75 ? 1 : 2;
  return def.boss && tier === 0 ? 1 : tier;
}

// ───────────────────────── levels ─────────────────────────

const LEVEL_XP = [0, 150, 400, 750, 1200, 1750, 2400, 3200, 4200, 5500];
const LEVEL_NAME = [
  "Cadet I",
  "Cadet II",
  "Cadet III",
  "Pilot I",
  "Pilot II",
  "Pilot III",
  "Commander I",
  "Commander II",
  "Commander III",
  "Admiral",
];
const LEVEL_NAME_TH = [
  "นักบินฝึกหัด I",
  "นักบินฝึกหัด II",
  "นักบินฝึกหัด III",
  "นักบิน I",
  "นักบิน II",
  "นักบิน III",
  "ผู้บัญชาการ I",
  "ผู้บัญชาการ II",
  "ผู้บัญชาการ III",
  "พลเรือเอก",
];

export function levelInfo(xp: number, lang: Lang = "en") {
  let level = 0;
  while (level + 1 < LEVEL_XP.length && xp >= LEVEL_XP[level + 1]) level++;
  const floor = LEVEL_XP[level];
  const ceil = LEVEL_XP[level + 1] ?? null;
  const names = lang === "th" ? LEVEL_NAME_TH : LEVEL_NAME;
  return {
    level,
    name: names[level],
    nextName: ceil === null ? null : names[level + 1],
    floor,
    ceil,
    pct: ceil === null ? 100 : Math.round(((xp - floor) / (ceil - floor)) * 100),
  };
}

// ───────────────────────── streaks & stats ─────────────────────────

export function streakInfo(s: GameState, now: Date = new Date()) {
  const active = (d: Date) => (s.days[dayKey(d)]?.missions ?? 0) > 0;
  let cur = 0;
  let cursor = active(now) ? now : addDays(now, -1);
  while (active(cursor)) {
    cur++;
    cursor = addDays(cursor, -1);
  }
  const keys = Object.keys(s.days)
    .filter((k) => s.days[k].missions > 0)
    .sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of keys) {
    const [y, m, d] = k.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    run = prev && dayKey(addDays(prev, 1)) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = date;
  }
  const monday = weekStart(now);
  const week = Array.from({ length: 7 }, (_, i) => active(addDays(monday, i)));
  return { current: cur, best: Math.max(best, cur), week };
}

export function accuracyOf(days: DayStats[]): number | null {
  const ok = days.reduce((a, d) => a + d.ok, 0);
  const total = days.reduce((a, d) => a + d.total, 0);
  return total ? Math.round((ok / total) * 100) : null;
}

export function overallAccuracy(s: GameState): number | null {
  return accuracyOf(Object.values(s.days));
}

/** Accuracy for each of the last 7 days (oldest first) plus the change vs the 7 days before. */
export function weeklyAccuracy(s: GameState, now: Date = new Date(), lang: Lang = "en") {
  const span = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => s.days[dayKey(addDays(now, -(to - i)))]).filter(Boolean) as DayStats[];
  const days = lang === "th" ? ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const bars = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(now, i - 6);
    const st = s.days[dayKey(d)];
    return {
      label: i === 6 ? (lang === "th" ? "วันนี้" : "Today") : days[d.getDay()],
      acc: st && st.total ? Math.round((st.ok / st.total) * 100) : null,
    };
  });
  const cur = accuracyOf(span(0, 6));
  const prev = accuracyOf(span(7, 13));
  return { bars, current: cur, trend: cur !== null && prev !== null ? cur - prev : null };
}

export function weekXp(s: GameState, now: Date = new Date()): number {
  const monday = weekStart(now);
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += s.days[dayKey(addDays(monday, i))]?.xp ?? 0;
  return sum;
}

/** How the learner tends to solve: straight from the formula, or by trial and error. */
export function solvingStyle(s: GameState) {
  const byStep = new Map<string, AttemptEvent[]>();
  for (const e of s.events) {
    // Attempts on the same step within the same hour count as one solving episode.
    const k = `${e.mission}:${e.step}:${Math.floor(e.ts / 3_600_000)}`;
    byStep.set(k, [...(byStep.get(k) ?? []), e]);
  }
  let direct = 0;
  let trial = 0;
  for (const list of byStep.values()) {
    if (list.length === 1 && list[0].ok) direct++;
    else if (list.length >= 3 || list.some((e) => !e.ok && e.ms < 6000)) trial++;
  }
  const n = direct + trial;
  return n < 3 ? null : { directPct: Math.round((direct / n) * 100), samples: n };
}

export function hintRate(s: GameState): number | null {
  const ok = s.events.filter((e) => e.ok);
  return ok.length ? Math.round((ok.filter((e) => e.hints > 0).length / ok.length) * 100) : null;
}

export function avgDecisionSeconds(s: GameState): number | null {
  return s.events.length ? Math.round(s.events.reduce((a, e) => a + e.ms, 0) / s.events.length / 1000) : null;
}

export function topMisconceptions(s: GameState, n = 3, lang: Lang = "en") {
  return Object.entries(s.mis)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, count]) => ({ id, label: misLabel(id, lang), count }));
}

/** Rule-based insights shown when the AI coach is off or unreachable. */
export function localInsights(s: GameState, lang: Lang = "en"): { text: string; good: boolean }[] {
  const L = pick(lang);
  const out: { text: string; good: boolean }[] = [];
  for (const m of topMisconceptions(s, 2, lang)) out.push({ text: `${m.label} ×${m.count}`, good: false });
  const mastered = SKILL_ORDER.filter((k) => masteryOf(s, k) >= 0.75);
  for (const k of mastered.slice(0, 2)) {
    out.push({ text: L(`${skillLabel(k, lang)} ✓ mastered`, `${skillLabel(k, lang)} ✓ ชำนาญแล้ว`), good: true });
  }
  const weak = SKILL_ORDER.filter((k) => (s.mastery[k]?.n ?? 0) > 0 && masteryOf(s, k) < 0.45).sort(
    (a, b) => masteryOf(s, a) - masteryOf(s, b),
  )[0];
  if (weak) {
    const practice = MISSIONS.find((m) => m.skills[0] === weak && isUnlocked(s, m.id));
    if (practice) {
      const title = missionText(practice, lang).title;
      out.push({
        text: L(
          `Practice "${title}" to strengthen ${skillLabel(weak, lang).toLowerCase()}`,
          `ฝึกภารกิจ "${title}" เพื่อเสริมเรื่อง${skillLabel(weak, lang)}`,
        ),
        good: false,
      });
    }
  }
  return out;
}

/** Steps where a conservation law decides the answer. */
const LAW_SKILLS: readonly Skill[] = ["conservation", "collision-type", "energy"];

/**
 * Logic consistency (paper A4.2): of all answers given on conservation-law
 * steps, the share that did not break a conservation law. An arithmetic slip
 * still counts as consistent; treating momentum or energy wrongly does not.
 */
export function logicConsistency(s: GameState): { pct: number; samples: number } | null {
  const answers = s.events.filter((e) => LAW_SKILLS.includes(e.skill));
  if (answers.length < 5) return null;
  const broken = answers.filter((e) => e.mis && CONSERVATION_VIOLATIONS.includes(e.mis)).length;
  return { pct: Math.round((1 - broken / answers.length) * 100), samples: answers.length };
}

/** How often the stall prompt was needed, as a share of solved steps. */
export function stallRate(s: GameState): number | null {
  const ok = s.events.filter((e) => e.ok);
  return ok.length ? Math.round((ok.filter((e) => e.stalled).length / ok.length) * 100) : null;
}

// ───────────────────────── retention (spaced review) ─────────────────────────

/** Days to wait before the next retention check, by number of successful checks so far. */
const REVIEW_GAPS = [1, 3, 7, 14, 30];
const DAY_MS = 86_400_000;

/** Cleared missions whose retention check is due, most overdue first. */
export function dueReviews(s: GameState, now: Date = new Date()): { def: MissionDef; days: number }[] {
  const out: { def: MissionDef; days: number; over: number }[] = [];
  for (const def of MISSIONS) {
    const rec = s.records[def.id];
    if (!rec?.last) continue;
    const gap = REVIEW_GAPS[Math.min(rec.reviews ?? 0, REVIEW_GAPS.length - 1)];
    const days = (now.getTime() - rec.last) / DAY_MS;
    if (days >= gap) out.push({ def, days: Math.floor(days), over: days - gap });
  }
  return out.sort((a, b) => b.over - a.over).map(({ def, days }) => ({ def, days }));
}

/** Retention (paper R): first-try accuracy in retention checks, which are played days later without support. */
export function retention(s: GameState): { pct: number; checks: number; avgDays: number } | null {
  if (!s.reviews.length) return null;
  const steps = s.reviews.reduce((a, r) => a + r.steps, 0);
  const first = s.reviews.reduce((a, r) => a + r.firstTry, 0);
  const days = s.reviews.reduce((a, r) => a + r.days, 0);
  return {
    pct: steps ? Math.round((first / steps) * 100) : 0,
    checks: s.reviews.length,
    avgDays: Math.round((days / s.reviews.length) * 10) / 10,
  };
}

// ───────────────────────── badges ─────────────────────────

export interface BadgeDef {
  id: string;
  icon: IconName;
  label: string;
  how: string;
  th: { label: string; how: string };
  earned: (s: GameState) => boolean;
}

const threeStar = (s: GameState) => Object.values(s.records).filter((r) => r.stars === 3).length;

export const BADGES: BadgeDef[] = [
  { id: "first-impulse", icon: "bolt", label: "First Impulse", how: "Clear any Chapter 2 mission", th: { label: "การดลครั้งแรก", how: "ผ่านภารกิจใดก็ได้ในบทที่ 2" }, earned: (s) => MISSIONS.some((m) => m.chapter === 2 && isCleared(s, m.id)) },
  { id: "orbital-pro", icon: "rocket", label: "Orbital Pro", how: "3 stars on Orbital Rescue", th: { label: "มือโปรวงโคจร", how: "ได้ 3 ดาวในภารกิจกู้ภัยในวงโคจร" }, earned: (s) => s.records["orbital-rescue"]?.stars === 3 },
  { id: "sharpshooter", icon: "target", label: "Sharpshooter", how: "3 stars on three missions", th: { label: "แม่นเป้า", how: "ได้ 3 ดาวในสามภารกิจ" }, earned: (s) => threeStar(s) >= 3 },
  { id: "streak-7", icon: "flame", label: "7 Day Streak", how: "Play seven days in a row", th: { label: "ต่อเนื่อง 7 วัน", how: "เล่นติดต่อกันเจ็ดวัน" }, earned: (s) => streakInfo(s).best >= 7 },
  { id: "long-memory", icon: "hourglass", label: "Long Memory", how: "Pass three retention checks", th: { label: "ความจำยาว", how: "ผ่านการทบทวนความจำสามครั้ง" }, earned: (s) => s.reviews.filter((r) => r.won && r.firstTry === r.steps).length >= 3 },
  { id: "crisis-expert", icon: "skull", label: "Crisis Expert", how: "Clear the boss mission", th: { label: "ผู้เชี่ยวชาญภาวะวิกฤต", how: "ผ่านภารกิจบอส" }, earned: (s) => isCleared(s, "crisis-protocol") },
  { id: "space-master", icon: "sparkles", label: "Space Master", how: "Clear every mission", th: { label: "เจ้าแห่งอวกาศ", how: "ผ่านครบทุกภารกิจ" }, earned: (s) => MISSIONS.every((m) => isCleared(s, m.id)) },
  { id: "physics-god", icon: "flask", label: "Physics God", how: "3 stars on every mission", th: { label: "เทพฟิสิกส์", how: "ได้ 3 ดาวทุกภารกิจ" }, earned: (s) => threeStar(s) === MISSIONS.length },
  { id: "champion", icon: "crown", label: "Champion", how: "Reach #1 in the squad", th: { label: "แชมเปียน", how: "ขึ้นอันดับ 1 ของทีม" }, earned: (s) => leaderboard(s, "all")[0]?.isYou === true },
];

/** Label and unlock rule of a badge in the given language. */
export const badgeText = (b: BadgeDef, lang: Lang): { label: string; how: string } => (lang === "th" ? b.th : b);

// ───────────────────────── leaderboard ─────────────────────────

/**
 * There is no online backend yet, so the squad is a fixed set of simulated
 * cadets. The player's own row is always real. The UI labels this clearly.
 */
const SQUAD = [
  { name: "Pudis", avatar: "a3", xp: 3520, chapter: 4, acc: 96 },
  { name: "ippee", avatar: "a2", xp: 2840, chapter: 4, acc: 93 },
  { name: "Namo K.", avatar: "a1", xp: 2110, chapter: 3, acc: 90 },
  { name: "Arisa T.", avatar: "a4", xp: 1980, chapter: 3, acc: 94 },
  { name: "Beam W.", avatar: "a2", xp: 1740, chapter: 2, acc: 89 },
  { name: "Krit M.", avatar: "a1", xp: 1120, chapter: 2, acc: 82 },
  { name: "Fah P.", avatar: "a3", xp: 980, chapter: 1, acc: 91 },
  { name: "Mint S.", avatar: "a4", xp: 620, chapter: 1, acc: 85 },
  { name: "Ton J.", avatar: "a1", xp: 310, chapter: 1, acc: 78 },
];

export interface RankRow {
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  chapter: number;
  acc: number | null;
  isYou: boolean;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function currentChapter(s: GameState): number {
  return (nextMission(s) ?? MISSIONS[MISSIONS.length - 1]).chapter;
}

export function leaderboard(s: GameState, scope: "all" | "week", now: Date = new Date()): RankRow[] {
  const wk = dayKey(weekStart(now));
  const rows = SQUAD.map((c) => ({
    name: c.name,
    avatar: c.avatar,
    xp: scope === "all" ? c.xp : 60 + (hash(c.name + wk) % 520),
    chapter: c.chapter,
    acc: c.acc as number | null,
    isYou: false,
  }));
  rows.push({
    name: s.profile?.name ?? "You",
    avatar: s.profile?.avatar ?? "a1",
    xp: scope === "all" ? s.xp : weekXp(s, now),
    chapter: currentChapter(s),
    acc: overallAccuracy(s),
    isYou: true,
  });
  rows.sort((a, b) => b.xp - a.xp || (a.isYou ? 1 : -1));
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

// ───────────────────────── scoring ─────────────────────────

function quality(o: StepOutcome): number {
  if (!o.solved) return 0;
  if (o.wrong === 0) return o.hints === 0 ? 1 : 0.7;
  return o.wrong === 1 ? 0.5 : 0.3;
}

function statusOf(o: StepOutcome): StepStatus {
  const q = quality(o);
  return q === 1 ? "mastered" : q >= 0.5 ? "partial" : "review";
}

export function starsFor(wrong: number, hints: number): number {
  if (wrong === 0 && hints === 0) return 3;
  if (wrong <= 1 || (wrong <= 2 && hints === 0)) return 2;
  return 1;
}

/**
 * Fold a finished (won or lost) mission into the state: mastery per skill,
 * XP, records, daily bonus, badges, and the result card shown afterwards.
 */
export function applyFinish(s: GameState, input: FinishInput, now: Date = new Date()): GameState {
  const def = missionById(input.missionId);
  if (!def) return s;
  const today = dayKey(now);

  const mastery = { ...s.mastery };
  for (const o of input.steps) {
    const cur = mastery[o.skill] ?? { m: 0, n: 0 };
    mastery[o.skill] = { m: cur.m + 0.4 * (quality(o) - cur.m), n: cur.n + 1 };
  }

  const wrong = input.steps.reduce((a, o) => a + o.wrong, 0);
  const hintsUsed = input.steps.reduce((a, o) => a + o.hints, 0);
  const day = s.days[today] ?? { xp: 0, ok: 0, total: 0, missions: 0 };

  // A retention check is scored on first-try answers: nothing was there to lean on.
  const prevRec = s.records[def.id];
  const retained = input.won && input.steps.every((o) => o.solved && o.wrong <= 1);
  const review: ReviewEvent | null =
    input.review && prevRec
      ? {
          ts: now.getTime(),
          mission: def.id,
          days: prevRec.last ? Math.floor((now.getTime() - prevRec.last) / DAY_MS) : 0,
          firstTry: input.steps.filter((o) => o.solved && o.wrong === 0).length,
          steps: input.total ?? input.steps.length,
          won: input.won,
        }
      : null;
  const reviews = review ? [...s.reviews, review].slice(-MAX_REVIEWS) : s.reviews;

  if (!input.won) {
    return {
      ...s,
      mastery,
      days: { ...s.days, [today]: day },
      reviews,
      // A failed check comes back at the shortest interval.
      records: review && prevRec ? { ...s.records, [def.id]: { ...prevRec, last: now.getTime(), reviews: 0 } } : s.records,
    };
  }

  const stars = starsFor(wrong, hintsUsed);
  const firstClear = !s.records[def.id];
  const dailyBonus = input.daily && s.dailyDone !== today;
  let xp = def.baseXp * [0.5, 0.75, 1][stars - 1] * (1 + 0.1 * input.tier);
  if (!firstClear) xp *= 0.3;
  if (dailyBonus) xp *= 1.5;
  xp = Math.max(5, Math.round(xp / 5) * 5);

  const prev = s.records[def.id];
  const records = {
    ...s.records,
    [def.id]: {
      stars: Math.max(prev?.stars ?? 0, stars),
      clears: (prev?.clears ?? 0) + 1,
      bestMs: prev ? Math.min(prev.bestMs, input.ms) : input.ms,
      last: now.getTime(),
      reviews: input.review ? (retained ? (prev?.reviews ?? 0) + 1 : 0) : (prev?.reviews ?? 0),
    },
  };

  const assessed: Assess[] = ["application", "analysis", "decision"];
  const rubric = assessed
    .filter((a) => input.steps.some((o) => o.assess === a))
    .map((a) => ({
      assess: a,
      // Paper rubric: correct within two attempts.
      pass: input.steps.filter((o) => o.assess === a).every((o) => o.solved && o.wrong <= 1),
    }));

  const next: GameState = {
    ...s,
    mastery,
    records,
    reviews,
    xp: s.xp + xp,
    dailyDone: dailyBonus ? today : s.dailyDone,
    days: { ...s.days, [today]: { ...day, xp: day.xp + xp, missions: day.missions + 1 } },
  };
  const newBadges = BADGES.filter((b) => !s.badges.includes(b.id) && b.earned(next)).map((b) => b.id);
  const misconceptions = [
    ...new Set(
      s.events
        .filter((e) => e.mission === def.id && e.mis && now.getTime() - e.ts <= input.ms + 5000)
        .map((e) => e.mis as string),
    ),
  ];

  const result: MissionResult = {
    ...input,
    ts: now.getTime(),
    stars,
    xp,
    accuracy: Math.round((100 * input.steps.length) / (input.steps.length + wrong)),
    wrong,
    hintsUsed,
    firstClear,
    dailyBonus,
    statuses: input.steps.map(statusOf),
    rubric,
    misconceptions,
    newBadges,
    levelBefore: levelInfo(s.xp).level,
    levelAfter: levelInfo(next.xp).level,
  };
  return { ...next, badges: [...s.badges, ...newBadges], lastResult: result };
}

export function applyAttempt(s: GameState, e: AttemptEvent): GameState {
  const today = dayKey(new Date(e.ts));
  const day = s.days[today] ?? { xp: 0, ok: 0, total: 0, missions: 0 };
  return {
    ...s,
    events: [...s.events, e].slice(-MAX_EVENTS),
    mis: e.mis ? { ...s.mis, [e.mis]: (s.mis[e.mis] ?? 0) + 1 } : s.mis,
    days: { ...s.days, [today]: { ...day, total: day.total + 1, ok: day.ok + (e.ok ? 1 : 0) } },
  };
}

export function applyLab(s: GameState, e: LabEvent): GameState {
  return { ...s, labRuns: s.labRuns + 1, lab: [...s.lab, e].slice(-MAX_LAB) };
}

export function applySurvey(s: GameState, r: SurveyResponse): GameState {
  return { ...s, surveys: [...s.surveys, r].slice(-50) };
}

/** Today's challenge: one of the unlocked missions, picked from the date. */
export function dailyMission(s: GameState, now: Date = new Date()): MissionDef {
  const pool = MISSIONS.filter((m) => isUnlocked(s, m.id) && !m.boss);
  return pool[hash(dayKey(now)) % pool.length] ?? MISSIONS[0];
}
