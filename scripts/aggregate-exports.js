/**
 * Combine the data files exported by learners (Settings → Export my learning
 * data → Full data) into tables for the evaluation in the paper (D5).
 *
 *   node scripts/aggregate-exports.js <folder with .json exports> [output folder]
 *
 * Writes:
 *   participants.csv  one row per learner: completion, accuracy, hints, decision
 *                     time, logic consistency, retention, lab runs, survey means
 *   likert.csv        one row per survey item: n, mean, SD, share of 4–5 answers
 *   misconceptions.csv  how often each misconception was detected, and by how many learners
 * and prints the headline numbers.
 */
const fs = require("fs");
const path = require("path");

const [, , inDir, outDir = inDir] = process.argv;
if (!inDir || !fs.existsSync(inDir)) {
  console.error("Usage: node scripts/aggregate-exports.js <folder with .json exports> [output folder]");
  process.exit(1);
}

const exportsRead = [];
for (const name of fs.readdirSync(inDir).filter((f) => f.endsWith(".json")).sort()) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(inDir, name), "utf8"));
    if (data && data.app === "QEDify" && data.exportVersion === 1) exportsRead.push({ name, data });
    else console.warn(`skipped ${name}: not a QEDify export (version 1)`);
  } catch {
    console.warn(`skipped ${name}: not valid JSON`);
  }
}
if (!exportsRead.length) {
  console.error("No QEDify export files found.");
  process.exit(1);
}

// A learner who exported twice counts once: keep the latest file per participant id.
const latest = new Map();
for (const e of exportsRead) {
  const id = e.data.participant?.id || e.name;
  const prev = latest.get(id);
  if (!prev || String(e.data.exportedAt) > String(prev.data.exportedAt)) latest.set(id, e);
}
const people = [...latest.values()].map((e) => e.data);

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const sd = (xs) => {
  if (xs.length < 2) return null;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
};
const fix = (x, dp = 2) => (x === null || x === undefined || Number.isNaN(x) ? "" : Number(x).toFixed(dp));
const cell = (v) => {
  const t = v === undefined || v === null ? "" : String(v);
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
const csv = (rows) => rows.map((r) => r.map(cell).join(",")).join("\n") + "\n";

/** Latest survey answer of each role for one learner. */
function surveyOf(p, role) {
  const mine = (p.surveys || []).filter((s) => s.role === role).sort((a, b) => a.ts - b.ts);
  return mine[mine.length - 1] || null;
}

const groupMean = (answers, prefix) => mean(Object.entries(answers).filter(([k]) => k.startsWith(prefix)).map(([, v]) => v));

// ── participants.csv ──
const head = [
  "participant", "language", "missions_cleared", "completion_pct", "stars", "active_days", "attempts", "accuracy_pct", "hint_use_pct",
  "avg_decision_s", "solved_directly_pct", "logic_consistency_pct", "stall_pct", "retention_pct", "retention_checks", "lab_runs",
  "student_engagement", "student_usability", "student_learning", "teacher_curriculum", "teacher_assessment", "teacher_adoption",
];
const rows = [head];
for (const p of people) {
  const s = p.summary || {};
  const st = surveyOf(p, "student");
  const te = surveyOf(p, "teacher");
  rows.push([
    p.participant?.id, p.language, s.missionsCleared, s.completionPct, s.stars, s.activeDays, (p.attempts || []).length, s.accuracyPct, s.hintUsePct,
    s.avgDecisionSeconds, s.solvedDirectlyPct, s.logicConsistencyPct, s.stallPct, s.retentionPct, s.retentionChecks, s.labRuns,
    st ? fix(groupMean(st.answers, "E")) : "", st ? fix(groupMean(st.answers, "U")) : "", st ? fix(groupMean(st.answers, "L")) : "",
    te ? fix(groupMean(te.answers, "C")) : "", te ? fix(groupMean(te.answers, "A")) : "", te ? fix(groupMean(te.answers, "D")) : "",
  ]);
}
fs.writeFileSync(path.join(outDir, "participants.csv"), csv(rows));

// ── likert.csv ──
const items = new Map();
for (const p of people) {
  for (const role of ["student", "teacher"]) {
    const s = surveyOf(p, role);
    if (!s) continue;
    for (const [id, v] of Object.entries(s.answers)) {
      const key = `${role}:${id}`;
      items.set(key, [...(items.get(key) || []), Number(v)]);
    }
  }
}
const likert = [["role", "item", "n", "mean", "sd", "agree_pct"]];
for (const [key, xs] of [...items.entries()].sort()) {
  const [role, id] = key.split(":");
  likert.push([role, id, xs.length, fix(mean(xs)), fix(sd(xs)), fix((100 * xs.filter((x) => x >= 4).length) / xs.length, 1)]);
}
fs.writeFileSync(path.join(outDir, "likert.csv"), csv(likert));

// ── misconceptions.csv ──
const mis = new Map();
for (const p of people) {
  for (const [id, n] of Object.entries(p.misconceptions || {})) {
    const cur = mis.get(id) || { times: 0, learners: 0 };
    mis.set(id, { times: cur.times + n, learners: cur.learners + (n > 0 ? 1 : 0) });
  }
}
const misRows = [["misconception", "times_detected", "learners"]];
for (const [id, v] of [...mis.entries()].sort((a, b) => b[1].times - a[1].times)) misRows.push([id, v.times, v.learners]);
fs.writeFileSync(path.join(outDir, "misconceptions.csv"), csv(misRows));

// ── headline numbers ──
const col = (key) => people.map((p) => p.summary?.[key]).filter((x) => typeof x === "number");
const line = (label, xs, unit = "") => console.log(`  ${label.padEnd(28)} ${xs.length ? `${fix(mean(xs), 1)}${unit} (SD ${fix(sd(xs), 1) || "n/a"}, n = ${xs.length})` : "no data"}`);

console.log(`\nQEDify evaluation summary: ${people.length} learner(s), ${exportsRead.length} file(s) read\n`);
line("Completion", col("completionPct"), "%");
line("Accuracy", col("accuracyPct"), "%");
line("Solved with hints", col("hintUsePct"), "%");
line("Average decision time", col("avgDecisionSeconds"), " s");
line("Logic consistency", col("logicConsistencyPct"), "%");
line("Retention (first try)", col("retentionPct"), "%");
console.log("");
for (const [role, groups] of [["student", { Engagement: "E", Usability: "U", "Perceived learning": "L" }], ["teacher", { "Curriculum alignment": "C", "Assessment capability": "A", Adoptability: "D" }]]) {
  const answered = people.map((p) => surveyOf(p, role)).filter(Boolean);
  console.log(`  ${role} survey: ${answered.length} response(s)`);
  for (const [label, prefix] of Object.entries(groups)) {
    line(`  ${label}`, answered.map((s) => groupMean(s.answers, prefix)).filter((x) => x !== null), " / 5");
  }
}
console.log(`\nWrote participants.csv, likert.csv and misconceptions.csv to ${path.resolve(outDir)}\n`);
