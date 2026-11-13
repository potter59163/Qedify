/**
 * Physics self-check for every mission generator.
 *
 *   npm run verify
 *
 * For each mission × support tier × many seeds it checks that
 *  - the stored answer passes the grader and every trap / sign flip is rejected,
 *  - the answer needs no rounding (≤ 2 decimals),
 *  - the answer satisfies the physics, recomputed here from the raw numbers
 *    with conservation residuals rather than by repeating the generator's formula.
 */
import { MISSIONS, MISSION_TH } from "../lib/engine/catalog";
import { checkStep, solutionInput } from "../lib/engine/check";
import { consequenceOf, hasConsequence } from "../lib/engine/consequence";
import { makeRng } from "../lib/engine/rng";
import type { MissionInstance, NumericStep, Step, Tier } from "../lib/engine/types";

const SEEDS = 400;
/** Three or more English words in a row: a string that was not translated. */
const ENGLISH_RUN = /[A-Za-z]{2,}(?:[ ,]+[A-Za-z]{2,}){2,}/;
const errors: string[] = [];
let checked = 0;

const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));
const ke = (m: number, v: number) => 0.5 * m * v * v;

function num(inst: MissionInstance, id: string): number {
  const s = inst.steps.find((x) => x.id === id);
  if (!s || s.kind !== "numeric") throw new Error(`numeric step "${id}" missing`);
  return s.answer;
}
function has(inst: MissionInstance, id: string) {
  return inst.steps.some((x) => x.id === id);
}
function correctChoice(inst: MissionInstance, id: string): string {
  const s = inst.steps.find((x) => x.id === id);
  if (!s || s.kind !== "choice") throw new Error(`choice step "${id}" missing`);
  return s.options.find((o) => o.correct)!.id;
}

/** Independent physics checks, keyed by mission id. Each returns a list of violated statements. */
const PHYSICS: Record<string, (i: MissionInstance) => string[]> = {
  "cargo-check": (i) => (near(num(i, "p") / i.meta.m, i.meta.v) ? [] : ["p/m ≠ v"]),
  "heavy-or-fast": (i) => {
    const { m1, v1, m2, v2 } = i.meta;
    const out: string[] = [];
    const winner = m1 * v1 > m2 * v2 ? "freighter" : "probe";
    if (correctChoice(i, "which") !== winner) out.push("wrong craft marked as larger momentum");
    if (!near(num(i, "diff"), Math.abs(m1 * v1 - m2 * v2))) out.push("difference wrong");
    return out;
  },
  "opposite-lanes": (i) => {
    const { m1, v1, m2, v2 } = i.meta;
    const out: string[] = [];
    if (!(num(i, "pB") < 0) || !near(-num(i, "pB") / m2, v2)) out.push("p_B wrong");
    if (!near(num(i, "total") - num(i, "pB"), m1 * v1)) out.push("total − p_B ≠ p_A");
    return out;
  },
  "tug-assist": (i) => {
    const { m, v, p, findMass } = i.meta;
    return near(findMass ? num(i, "m") * v : m * num(i, "v"), p) ? [] : ["m × v ≠ target momentum"];
  },
  "orbital-rescue": (i) => {
    const { m, vi, vt, fMax, tMax } = i.meta;
    const out: string[] = [];
    const J = num(i, "J");
    if (!near(m * vi + J, m * vt)) out.push("p_i + J ≠ p_f");
    const burn = i.steps.find((s) => s.id === "burn");
    if (!burn || burn.kind !== "pair") return [...out, "burn step missing"];
    if (!near(burn.target, J)) out.push("burn target ≠ required impulse");
    if (burn.target / fMax > tMax + 1e-9) out.push("no feasible burn within limits");
    return out;
  },
  "full-stop": (i) => {
    const { m, v, dt } = i.meta;
    const out: string[] = [];
    if (!near(m * v + num(i, "J"), 0)) out.push("p + J ≠ 0");
    if (!near(num(i, "F") * dt, num(i, "J"))) out.push("F·Δt ≠ J");
    return out;
  },
  "crash-test": (i) => {
    const { m, v, fMax } = i.meta;
    const out: string[] = [];
    const step = i.steps.find((s) => s.id === "material");
    if (!step || step.kind !== "choice") return ["material step missing"];
    const dts = step.options.map((o) => Number(/stops in ([\d.]+) s/.exec(o.detail ?? "")?.[1]));
    const costs = step.options.map((o) => Number(/· (\d+) kg/.exec(o.detail ?? "")?.[1]));
    const safe = step.options.map((_, k) => (m * v) / dts[k] <= fMax + 1e-9);
    const idx = step.options.findIndex((o) => o.correct);
    if (!safe[idx]) out.push("chosen material exceeds the force limit");
    step.options.forEach((_, k) => {
      if (safe[k] && costs[k] < costs[idx]) out.push("a lighter safe material exists");
    });
    if (!near(num(i, "F") * dts[idx], m * v)) out.push("F·Δt ≠ Δp");
    return out;
  },
  "burn-window": (i) => {
    const { m, F, dt, vi } = i.meta;
    const out: string[] = [];
    if (!near(num(i, "J"), F * dt)) out.push("J ≠ F·Δt");
    if (!near(m * (num(i, "vf") - vi), num(i, "J"))) out.push("m·Δv ≠ J");
    return out;
  },
  "the-junction": (i) => {
    const { m1, v1, m2 } = i.meta;
    const out: string[] = [];
    if (has(i, "p") && !near(num(i, "p"), m1 * v1)) out.push("p_before wrong");
    if (!near((m1 + m2) * num(i, "vf"), m1 * v1)) out.push("momentum not conserved");
    return out;
  },
  recoil: (i) => {
    const { m1, m2, v2 } = i.meta;
    const out: string[] = [];
    if (correctChoice(i, "system") !== "zero") out.push("system momentum should be zero");
    if (!near(m1 * num(i, "v1") + m2 * v2, 0)) out.push("momentum not conserved");
    return out;
  },
  "head-on": (i) => {
    const { m1, v1, m2, v2 } = i.meta;
    const out: string[] = [];
    if (has(i, "p") && !near(num(i, "p"), m1 * v1 + m2 * v2)) out.push("p_before wrong");
    if (!near((m1 + m2) * num(i, "vf"), m1 * v1 + m2 * v2)) out.push("momentum not conserved");
    return out;
  },
  "mass-ejection": (i) => {
    const { M, mf, u } = i.meta;
    const out: string[] = [];
    if (correctChoice(i, "direction") !== "away") out.push("propellant must be vented away from the target");
    if (!near((M - mf) * num(i, "v") - mf * u, 0)) out.push("momentum not conserved");
    return out;
  },
  "bounce-or-stick": (i) => {
    const { m1, v1, m2, v1f, v2f } = i.meta;
    const out: string[] = [];
    if (!near(m1 * v1, m1 * v1f + m2 * v2f)) out.push("given data violates momentum conservation");
    if (!near(num(i, "keB"), ke(m1, v1))) out.push("KE_before wrong");
    if (!near(num(i, "keA"), ke(m1, v1f) + ke(m2, v2f))) out.push("KE_after wrong");
    if (num(i, "keA") > num(i, "keB") + 1e-6) out.push("KE increased");
    const elastic = near(num(i, "keA"), num(i, "keB"));
    if (correctChoice(i, "type") !== (elastic ? "elastic" : "inelastic")) out.push("verdict inconsistent with KE");
    return out;
  },
  "elastic-transfer": (i) => {
    const { m1, v1, m2 } = i.meta;
    const a = num(i, "v1f");
    const b = num(i, "v2f");
    const out: string[] = [];
    if (!near(m1 * v1, m1 * a + m2 * b)) out.push("momentum not conserved");
    if (!near(ke(m1, v1), ke(m1, a) + ke(m2, b))) out.push("kinetic energy not conserved");
    return out;
  },
  "energy-audit": (i) => {
    const { m1, v1, m2 } = i.meta;
    const vf = num(i, "vf");
    const out: string[] = [];
    if (!near((m1 + m2) * vf, m1 * v1)) out.push("momentum not conserved");
    if (!near(num(i, "lost"), ke(m1, v1) - ke(m1 + m2, vf))) out.push("ΔKE wrong");
    if (!(num(i, "lost") > 0)) out.push("ΔKE must be positive");
    if (correctChoice(i, "where") !== "heat") out.push("energy destination wrong");
    return out;
  },
  "clamp-or-bumper": (i) => {
    const { m1, v1, m2, limit, goal } = i.meta;
    const out: string[] = [];
    const stick = (m1 * v1) / (m1 + m2);
    // Elastic target speed from the two conservation laws: v2' = 2·v_cm.
    const bounce = 2 * stick;
    const drone = v1 - (m2 * bounce) / m1;
    if (!near(ke(m1, v1), ke(m1, drone) + ke(m2, bounce))) out.push("elastic branch does not conserve KE");
    const meets = (mode: "clamp" | "bumper") =>
      goal === 0 ? mode === "clamp" : goal === 1 ? (mode === "clamp" ? stick : bounce) >= limit : (mode === "clamp" ? stick : bounce) <= limit;
    const pick = correctChoice(i, "type") as "clamp" | "bumper";
    if (!meets(pick)) out.push("chosen mode fails the mission goal");
    if (meets(pick === "clamp" ? "bumper" : "clamp")) out.push("the other mode also meets the goal");
    if (!near(num(i, "v"), pick === "clamp" ? stick : bounce)) out.push("target speed wrong");
    return out;
  },
  "crisis-protocol": (i) => {
    const { m1, v0, F, dt, m2 } = i.meta;
    const v1 = num(i, "v1");
    const vf = num(i, "vf");
    const out: string[] = [];
    if (!near(m1 * (v1 - v0), -F * dt)) out.push("retro-burn: m·Δv ≠ −F·Δt");
    if (!near((m1 + m2) * vf, m1 * v1)) out.push("clamping: momentum not conserved");
    if (!near((m1 + m2) * vf + num(i, "jStop"), 0)) out.push("final brake: p + J ≠ 0");
    if (!near(num(i, "lost"), ke(m1, v1) - ke(m1 + m2, vf))) out.push("ΔKE wrong");
    return out;
  },
};

function checkNumeric(s: NumericStep, where: string) {
  if (!Number.isFinite(s.answer)) errors.push(`${where}: answer is not finite`);
  if (Math.abs(s.answer * 100 - Math.round(s.answer * 100)) > 1e-6) errors.push(`${where}: answer ${s.answer} needs rounding`);
  if (!s.signed && s.answer < 0) errors.push(`${where}: unsigned step has a negative answer`);
  if (s.signed && s.answer !== 0 && checkStep(s, { kind: "numeric", value: -s.answer }).ok) {
    errors.push(`${where}: sign-flipped answer accepted`);
  }
  for (const t of s.traps) {
    const r = checkStep(s, { kind: "numeric", value: t.value });
    if (r.ok) errors.push(`${where}: trap ${t.value} (${t.m.title}) accepted as correct`);
    else if (!r.m) errors.push(`${where}: trap ${t.value} (${t.m.title}) not recognised`);
  }
}

function checkStepShape(s: Step, where: string) {
  if (!checkStep(s, solutionInput(s)).ok) errors.push(`${where}: canonical solution rejected`);
  if (s.hints.length !== 3) errors.push(`${where}: expected 3 hints`);
  if (s.kind === "numeric") checkNumeric(s, where);
  if (s.kind === "choice") {
    if (s.options.filter((o) => o.correct).length !== 1) errors.push(`${where}: needs exactly one correct option`);
    if (new Set(s.options.map((o) => o.id)).size !== s.options.length) errors.push(`${where}: duplicate option ids`);
    for (const o of s.options) {
      if (!o.correct && !o.m && !o.why) errors.push(`${where}: wrong option "${o.id}" has no feedback`);
    }
  }
  if (s.kind === "pair") {
    const b = s.target / s.a.max;
    if (b > s.b.max + 1e-9) errors.push(`${where}: target unreachable within limits`);
    for (const t of s.traps) {
      // A trap product is only meaningful if it is reachable and distinct from the target.
      if (Math.abs(t.value - s.target) <= s.tol) errors.push(`${where}: trap equals target`);
    }
  }
}

for (const def of MISSIONS) {
  const physics = PHYSICS[def.id];
  if (!physics) {
    errors.push(`${def.id}: no physics check registered`);
    continue;
  }
  for (const tier of [0, 1, 2] as Tier[]) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const inst = def.build(makeRng(seed * 7919 + tier), tier);
      const where = `${def.id} [tier ${tier}, seed ${seed}]`;
      checked++;
      if (inst.steps.length === 0) errors.push(`${where}: no steps`);
      if (new Set(inst.steps.map((s) => s.id)).size !== inst.steps.length) errors.push(`${where}: duplicate step ids`);
      inst.steps.forEach((s) => checkStepShape(s, `${where} step "${s.id}"`));
      try {
        for (const e of physics(inst)) errors.push(`${where}: ${e}`);
      } catch (e) {
        errors.push(`${where}: ${(e as Error).message}`);
      }
      const bodies = inst.scene.bodies.length;
      if (inst.scene.after && inst.scene.after.v.length !== bodies) errors.push(`${where}: scene.after length mismatch`);
    }
  }
}

// ───────────────────────── consequences of wrong answers ─────────────────────────
// The simulated outcome of an answer must agree with the grader: no physical
// discrepancy for the right answer, and a described one for a wrong answer.

let simulated = 0;

for (const def of MISSIONS) {
  for (const tier of [0, 1, 2] as Tier[]) {
    for (let seed = 1; seed <= 120; seed++) {
      const inst = def.build(makeRng(seed * 15485863 + tier), tier);
      for (const s of inst.steps) {
        if (!hasConsequence(def.id, s.id)) continue;
        const where = `${def.id} [tier ${tier}, seed ${seed}] step "${s.id}" consequence`;
        const right = consequenceOf(def.id, inst, s, solutionInput(s));
        const scale = s.kind === "numeric" ? Math.max(1, Math.abs(s.answer)) : s.kind === "pair" ? Math.max(1, s.target) : 1;
        if (right && Math.abs(right.delta) > 1e-6 * scale * 1e4) errors.push(`${where}: right answer leaves a discrepancy of ${right.delta}`);
        const wrongInputs =
          s.kind === "numeric"
            ? [s.answer * 1.37 + 1, s.answer * 0.4 - 1].map((value) => ({ kind: "numeric" as const, value }))
            : s.kind === "choice"
              ? s.options.filter((o) => !o.correct).map((o) => ({ kind: "choice" as const, id: o.id }))
              : [{ kind: "pair" as const, a: s.a.max, b: (s.target / s.a.max) * 0.5 }];
        for (const input of wrongInputs) {
          if (checkStep(s, input).ok) continue;
          const c = consequenceOf(def.id, inst, s, input);
          simulated++;
          if (!c) errors.push(`${where}: no outcome for a wrong answer`);
          else {
            if (c.delta === 0 || !Number.isFinite(c.delta)) errors.push(`${where}: wrong answer shows no discrepancy`);
            if (c.text.length < 20) errors.push(`${where}: outcome has no description`);
            if (c.v && c.v.length !== inst.scene.bodies.length) errors.push(`${where}: outcome has ${c.v.length} velocities`);
            if (c.v && c.v.some((n) => !Number.isFinite(n))) errors.push(`${where}: outcome velocity is not a number`);
            const th = consequenceOf(def.id, def.build(makeRng(seed * 15485863 + tier), tier, "th"), s, input, "th");
            const left = th && ENGLISH_RUN.exec(th.text);
            if (left) errors.push(`${def.id}: untranslated outcome "${left[0]}"`);
          }
        }
      }
    }
  }
}

// ───────────────────────── Thai translation ─────────────────────────
// The Thai instance must carry the same numbers as the English one, and no
// learner-facing string may be left as an English sentence.

function texts(inst: MissionInstance): string[] {
  const out = [inst.story];
  for (const g of inst.givens) out.push(g.label, g.value);
  for (const s of inst.steps) {
    out.push(s.title, s.prompt, s.explain, ...s.hints, ...s.scaffold);
    if (s.kind === "numeric") for (const t of s.traps) out.push(t.m.title, t.m.body);
    if (s.kind === "choice") {
      for (const o of s.options) out.push(o.label, o.detail ?? "", o.why ?? "", o.m?.title ?? "", o.m?.body ?? "");
    }
    if (s.kind === "pair") {
      out.push(s.a.label, s.b.label, s.overA.title, s.overA.body, s.overB.title, s.overB.body);
      for (const t of s.traps) out.push(t.m.title, t.m.body);
    }
  }
  return out;
}

let translated = 0;

for (const def of MISSIONS) {
  if (!MISSION_TH[def.id]) errors.push(`${def.id}: no Thai title`);
  for (const tier of [0, 1, 2] as Tier[]) {
    for (let seed = 1; seed <= 40; seed++) {
      const en = def.build(makeRng(seed * 104729 + tier), tier, "en");
      const th = def.build(makeRng(seed * 104729 + tier), tier, "th");
      const where = `${def.id} [tier ${tier}, seed ${seed}] (th)`;
      if (JSON.stringify(en.meta) !== JSON.stringify(th.meta)) errors.push(`${where}: numbers differ between languages`);
      if (JSON.stringify(en.scene.after) !== JSON.stringify(th.scene.after)) errors.push(`${where}: outcome differs between languages`);
      en.steps.forEach((s, i) => {
        const t = th.steps[i];
        if (!t || t.id !== s.id || t.kind !== s.kind) return errors.push(`${where}: step ${i} differs between languages`);
        if (s.kind === "numeric" && t.kind === "numeric" && s.answer !== t.answer) errors.push(`${where}: answer of "${s.id}" differs`);
        if (!checkStep(t, solutionInput(t), "th").ok) errors.push(`${where}: canonical solution rejected`);
      });
      for (const text of texts(th)) {
        const m = ENGLISH_RUN.exec(text);
        if (m) errors.push(`${def.id}: untranslated text "${m[0]}" in "${text.slice(0, 50).replace(/\n/g, " ")}"`);
        translated++;
      }
    }
  }
}

const unique = [...new Set(errors)];
console.log(
  `${MISSIONS.length} missions · ${checked} generated instances checked · ${simulated} wrong-answer outcomes simulated · ${translated} Thai strings checked`,
);
if (unique.length) {
  console.log(`\n${unique.length} problem(s):`);
  for (const e of unique.slice(0, 60)) console.log("  ✗ " + e);
  process.exit(1);
}
console.log("All answers satisfy the physics. ✓");
