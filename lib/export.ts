import { Platform, Share } from "react-native";

import { MISSIONS, SKILL_ORDER } from "./engine/catalog";
import {
  avgDecisionSeconds,
  hintRate,
  levelInfo,
  logicConsistency,
  masteryOf,
  overallAccuracy,
  retention,
  solvingStyle,
  stallRate,
  streakInfo,
  totalStars,
  type GameState,
} from "./progress";

/** Bump when the shape of the exported file changes. scripts/aggregate-exports.js reads this format. */
export const EXPORT_VERSION = 1;

/**
 * Everything a researcher or teacher needs from one learner (paper D5:
 * behavioural logs, completion rates, survey answers). The name and school are
 * left out unless the learner chooses to include them.
 */
export function buildExport(s: GameState, includeIdentity: boolean, now: Date = new Date()) {
  const cleared = MISSIONS.filter((m) => s.records[m.id]).length;
  const kept = retention(s);
  return {
    app: "QEDify",
    exportVersion: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    participant: {
      id: s.pid,
      ...(includeIdentity && s.profile ? { name: s.profile.name, school: s.profile.school } : {}),
      createdAt: s.profile ? new Date(s.profile.createdAt).toISOString() : null,
    },
    language: s.settings.lang,
    summary: {
      xp: s.xp,
      level: levelInfo(s.xp).name,
      missionsCleared: cleared,
      missionsTotal: MISSIONS.length,
      completionPct: Math.round((cleared / MISSIONS.length) * 100),
      stars: totalStars(s),
      activeDays: Object.values(s.days).filter((d) => d.missions > 0 || d.total > 0).length,
      bestStreak: streakInfo(s, now).best,
      accuracyPct: overallAccuracy(s),
      hintUsePct: hintRate(s),
      avgDecisionSeconds: avgDecisionSeconds(s),
      solvedDirectlyPct: solvingStyle(s)?.directPct ?? null,
      logicConsistencyPct: logicConsistency(s)?.pct ?? null,
      stallPct: stallRate(s),
      retentionPct: kept?.pct ?? null,
      retentionChecks: kept?.checks ?? 0,
      labRuns: s.labRuns,
    },
    masteryPct: Object.fromEntries(SKILL_ORDER.map((k) => [k, Math.round(masteryOf(s, k) * 100)])),
    misconceptions: s.mis,
    missions: MISSIONS.map((m) => {
      const r = s.records[m.id];
      return { id: m.id, chapter: m.chapter, cleared: !!r, stars: r?.stars ?? 0, clears: r?.clears ?? 0, bestSeconds: r ? Math.round(r.bestMs / 1000) : null };
    }),
    attempts: s.events,
    lab: s.lab,
    reviews: s.reviews,
    surveys: s.surveys,
    days: s.days,
  };
}

const cell = (v: unknown) => {
  const t = v === undefined || v === null ? "" : String(v);
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

/** One row per submitted answer, for spreadsheets and statistics packages. */
export function attemptsCsv(s: GameState): string {
  const head = ["participant", "time", "mission", "step", "skill", "assessment", "correct", "misconception", "decision_ms", "hints", "tier", "answer", "stalled", "retention_check"];
  const rows = s.events.map((e) =>
    [
      s.pid,
      new Date(e.ts).toISOString(),
      e.mission,
      e.step,
      e.skill,
      e.assess,
      e.ok ? 1 : 0,
      e.mis ?? "",
      e.ms,
      e.hints,
      e.tier,
      e.answer ?? "",
      e.stalled ? 1 : 0,
      e.review ? 1 : 0,
    ]
      .map(cell)
      .join(","),
  );
  return [head.join(","), ...rows].join("\n");
}

/** Hand a text file to the learner: a download in the browser, the share sheet on a phone. */
export async function saveFile(name: string, mime: string, text: string): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      // The BOM makes spreadsheet apps read Thai text in a CSV correctly.
      const blob = new Blob([mime === "text/csv" ? "﻿" : "", text], { type: `${mime};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    }
    await Share.share({ title: name, message: text });
    return true;
  } catch {
    return false;
  }
}
