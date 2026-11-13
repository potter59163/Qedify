import { fmt, sfmt } from "./build";
import { pick, type L, type Lang } from "./lang";
import { MATERIALS } from "./missions-a";
import type { MissionInstance, Step, StepInput } from "./types";

/**
 * What physically happens when a wrong answer is acted on (paper M5.1,
 * "empirical response"). An action step (set an impulse, pick a material) is
 * simulated with the learner's own value. A prediction step is played back as
 * predicted, and the conservation law it breaks is named. The right answer is
 * never stated: every number here follows from the learner's own input.
 */
export interface Consequence {
  kind: "overshoot" | "undershoot" | "reverse" | "impact" | "waste" | "law";
  text: string;
  /** Velocities to play in the simulation panel, one per body. */
  v?: number[];
  merged?: boolean;
  /** Hide the numbers on the arrows when they would give away a later answer. */
  hideValues?: boolean;
  /** Signed physical discrepancy; zero when the answer is right (checked by the verifier). */
  delta: number;
}

interface Ctx {
  meta: Record<string, number>;
  /** Numeric answer (absolute value for unsigned steps). */
  x: number;
  /** Chosen option id. */
  id: string;
  /** Pair inputs. */
  a: number;
  b: number;
  L: L;
}

const ke = (m: number, v: number) => 0.5 * m * v * v;

/** "more / less momentum than before": the wording shared by every conservation check. */
function momentumLaw(L: L, lead: [string, string], after: number, before: number, v: number[], merged: boolean): Consequence {
  const more = after > before;
  return {
    kind: "law",
    delta: after - before,
    v,
    merged,
    text: L(
      `${lead[0]} the system would carry ${sfmt(after)} kg·m/s afterwards, which is ${more ? "more" : "less"} momentum than it had before. No outside force acts, so momentum cannot ${more ? "appear" : "vanish"}.`,
      `${lead[1]} ระบบจะมีโมเมนตัม ${sfmt(after)} kg·m/s หลังเหตุการณ์ ซึ่ง${more ? "มากกว่า" : "น้อยกว่า"}ก่อนเหตุการณ์ เมื่อไม่มีแรงภายนอก โมเมนตัมจะ${more ? "เพิ่มขึ้นเอง" : "หายไปเอง"}ไม่ได้`,
    ),
  };
}

/** A body that should end at rest: still moving, or pushed back. */
function stopping(L: L, lead: [string, string], vEnd: number, who: [string, string], v: number[], merged: boolean): Consequence {
  const still = vEnd > 0;
  return {
    kind: still ? "impact" : "reverse",
    delta: vEnd,
    v,
    merged,
    text: still
      ? L(
          `${lead[0]} ${who[0]} is still moving at ${fmt(vEnd)} m/s on reaching the station. It hits the dock.`,
          `${lead[1]} ${who[1]}ยังเคลื่อนที่ที่ ${fmt(vEnd)} m/s ตอนถึงสถานี จึงชนเข้ากับท่าเทียบ`,
        )
      : L(
          `${lead[0]} ${who[0]} stops and is then pushed back at ${fmt(-vEnd)} m/s, away from the station.`,
          `${lead[1]} ${who[1]}หยุดแล้วถูกดันถอยหลังที่ ${fmt(-vEnd)} m/s ออกห่างจากสถานี`,
        ),
  };
}

/** Elastic strike on a target at rest: the learner's target speed fixes the striker by momentum, then energy is checked. */
function elasticLaw(L: L, m1: number, v1: number, m2: number, x: number): Consequence {
  // A target that does not move also keeps the energy books balanced, so it needs its own wording.
  if (Math.abs(x) < 1e-9) {
    return {
      kind: "undershoot",
      delta: -(2 * m1 * v1) / (m1 + m2),
      v: [v1, 0],
      text: L(
        "A target that stays at rest takes no momentum, so the striker would carry on at full speed as if nothing had been hit. The bumper does push the target away.",
        "ถ้าเป้าอยู่นิ่ง เป้าก็ไม่ได้รับโมเมนตัมเลย ตัวชนจะเคลื่อนที่ต่อด้วยความเร็วเดิมราวกับไม่ได้ชนอะไร แต่ในความเป็นจริงกันชนจะดันเป้าออกไป",
      ),
    };
  }
  const striker = (m1 * v1 - m2 * x) / m1;
  const delta = ke(m1, striker) + ke(m2, x) - ke(m1, v1);
  return {
    kind: "law",
    delta,
    v: [striker, x],
    text: L(
      `If the target left at ${fmt(x)} m/s, momentum conservation would put the striker at ${sfmt(striker)} m/s, and the pair would have ${delta > 0 ? "more" : "less"} kinetic energy than before. A perfectly elastic bumper returns exactly what it stored.`,
      `ถ้าเป้าออกไปที่ ${fmt(x)} m/s กฎอนุรักษ์โมเมนตัมจะทำให้ตัวชนมีความเร็ว ${sfmt(striker)} m/s และทั้งคู่จะมีพลังงานจลน์${delta > 0 ? "มากกว่า" : "น้อยกว่า"}ก่อนชน กันชนแบบยืดหยุ่นสมบูรณ์คืนพลังงานเท่าที่เก็บไว้พอดี`,
    ),
  };
}

const HANDLERS: Record<string, (c: Ctx) => Consequence | null> = {
  "cargo-check:p": ({ meta: { m, v }, x, L }) => {
    const after = v - x / m;
    return after > 0
      ? {
          kind: "overshoot",
          delta: x - m * v,
          v: [after],
          text: L(
            `The docking clamps are set for ${fmt(x)} kg·m/s. That is not enough to stop the shuttle: it is still moving at ${fmt(after)} m/s and scrapes through the lane.`,
            `ตัวล็อกเทียบท่าถูกตั้งไว้รับ ${fmt(x)} kg·m/s ซึ่งไม่พอจะหยุดยาน ยานยังเคลื่อนที่ต่อที่ ${fmt(after)} m/s และครูดผ่านช่องเทียบท่าไป`,
          ),
        }
      : {
          kind: "reverse",
          delta: x - m * v,
          v: [after],
          text: L(
            `The docking clamps are set for ${fmt(x)} kg·m/s. That is more than the shuttle carries: it is thrown back at ${fmt(-after)} m/s.`,
            `ตัวล็อกเทียบท่าถูกตั้งไว้รับ ${fmt(x)} kg·m/s ซึ่งมากกว่าที่ยานมี ยานจึงถูกดันกลับที่ ${fmt(-after)} m/s`,
          ),
        };
  },

  "heavy-or-fast:which": ({ id, L }) => ({
    kind: "impact",
    delta: 1,
    text:
      id === "equal"
        ? L(
            "The net is braced evenly for both craft. One of them carries more momentum than its side can hold and tears through.",
            "ตาข่ายถูกเสริมเท่ากันทั้งสองฝั่ง ยานลำหนึ่งมีโมเมนตัมมากกว่าที่ฝั่งนั้นรับได้ จึงทะลุตาข่ายไป",
          )
        : L(
            `The net is braced for the ${id === "freighter" ? "freighter" : "probe"}. The other craft carries more momentum and tears through the weaker side.`,
            `ตาข่ายถูกเสริมไว้รับ${id === "freighter" ? "ยานบรรทุก" : "ยานสำรวจ"} แต่ยานอีกลำมีโมเมนตัมมากกว่าและทะลุฝั่งที่อ่อนกว่าไป`,
          ),
  }),

  "tug-assist:v": ({ meta: { m, p }, x, L }) => arrival(L, m * x, p, [L(`Released at ${fmt(x)} m/s`, `เมื่อปล่อยที่ ${fmt(x)} m/s`)], [x]),
  "tug-assist:m": ({ meta: { v, p }, x, L }) => arrival(L, x * v, p, [L(`Loaded to ${fmt(x)} kg`, `เมื่อบรรทุกจนมีมวล ${fmt(x)} kg`)], [v]),

  "orbital-rescue:J": ({ meta: { m, vi, vt }, x, L }) =>
    intercept(L, L(`An impulse of ${fmt(x)} N·s`, `การดล ${fmt(x)} N·s`), vi + x / m, vt),

  "orbital-rescue:burn": ({ meta: { m, vi, vt, fMax, tMax }, a, b, L }) => {
    const delivered = Math.min(a, fMax) * Math.min(b, tMax);
    const lead =
      a > fMax
        ? L(`The thrusters cut out above ${fmt(fMax)} N, so the burn delivers ${fmt(delivered)} N·s. That`, `เครื่องยนต์ตัดการทำงานเมื่อเกิน ${fmt(fMax)} N การจุดครั้งนี้จึงให้การดล ${fmt(delivered)} N·s`)
        : b > tMax
          ? L(`The fuel runs out after ${fmt(tMax)} s, so the burn delivers ${fmt(delivered)} N·s. That`, `เชื้อเพลิงหมดหลัง ${fmt(tMax)} s การจุดครั้งนี้จึงให้การดล ${fmt(delivered)} N·s`)
          : L(`The burn delivers ${fmt(delivered)} N·s. That`, `การจุดครั้งนี้ให้การดล ${fmt(delivered)} N·s`);
    return intercept(L, lead, vi + delivered / m, vt);
  },

  "full-stop:J": ({ meta: { m, v }, x, L }) =>
    stopping(L, [`With an impulse of ${sfmt(x)} N·s`, `เมื่อใช้การดล ${sfmt(x)} N·s`], v + x / m, ["the ship", "ยาน"], [v + x / m], false),
  "full-stop:F": ({ meta: { m, v, dt }, x, L }) =>
    stopping(L, [`With ${sfmt(x)} N for ${fmt(dt)} s`, `เมื่อใช้แรง ${sfmt(x)} N นาน ${fmt(dt)} s`], v + (x * dt) / m, ["the ship", "ยาน"], [v + (x * dt) / m], false),

  "crash-test:material": ({ meta: { m, v, fMax, k }, id, L }) => {
    const i = MATERIALS.findIndex((mat) => mat.id === id);
    if (i < 0 || i === k) return null;
    const mat = MATERIALS[i];
    const force = (m * v) / mat.dt;
    return i < k
      ? {
          kind: "impact",
          delta: i - k,
          v: [0],
          text: L(
            `The lander stops in ${mat.dt} s, so the hull takes ${fmt(force)} N, above its ${fmt(fMax)} N limit. The frame buckles on impact.`,
            `ยานหยุดใน ${mat.dt} s ตัวยานจึงรับแรง ${fmt(force)} N ซึ่งเกินขีดจำกัด ${fmt(fMax)} N โครงยานยุบตอนกระแทก`,
          ),
        }
      : {
          kind: "waste",
          delta: i - k,
          v: [0],
          text: L(
            `The lander stops safely, but ${mat.cost - MATERIALS[k].cost} kg of supplies had to be left behind to carry the heavier buffer.`,
            `ยานหยุดได้อย่างปลอดภัย แต่ต้องทิ้งเสบียง ${mat.cost - MATERIALS[k].cost} kg ไว้ข้างหลังเพื่อแบกวัสดุกันกระแทกที่หนักกว่า`,
          ),
        };
  },

  "burn-window:vf": ({ meta: { m, F, dt, vi }, x, L }) => impulseLaw(L, m * (x - vi), F * dt, x, [x], ["the probe", "ยานสำรวจ"]),

  "the-junction:vf": ({ meta: { m1, v1, m2 }, x, L }) =>
    momentumLaw(L, [`If the pods left together at ${fmt(x)} m/s,`, `ถ้าแคปซูลทั้งสองออกไปด้วยกันที่ ${fmt(x)} m/s`], (m1 + m2) * x, m1 * v1, [x, x], true),
  "head-on:vf": ({ meta: { m1, v1, m2, v2 }, x, L }) =>
    momentumLaw(L, [`If the docked pair drifted at ${sfmt(x)} m/s,`, `ถ้ายานที่ต่อกันแล้วลอยไปที่ ${sfmt(x)} m/s`], (m1 + m2) * x, m1 * v1 + m2 * v2, [x, x], true),
  "energy-audit:vf": ({ meta: { m1, v1, m2 }, x, L }) =>
    momentumLaw(L, [`If the docked pair moved at ${fmt(x)} m/s,`, `ถ้ายานที่ต่อกันแล้วเคลื่อนที่ที่ ${fmt(x)} m/s`], (m1 + m2) * x, m1 * v1, [x, x], true),

  "recoil:v1": ({ meta: { m1, m2, v2 }, x, L }) => {
    const total = m1 * x + m2 * v2;
    return {
      kind: "law",
      delta: total,
      v: [x, v2],
      text: L(
        `With the astronaut at ${sfmt(x)} m/s the pair would have a total momentum of ${sfmt(total)} kg·m/s. They started at rest, so the total must stay zero.`,
        `ถ้านักบินอวกาศมีความเร็ว ${sfmt(x)} m/s ทั้งคู่จะมีโมเมนตัมรวม ${sfmt(total)} kg·m/s แต่ทั้งคู่เริ่มจากอยู่นิ่ง โมเมนตัมรวมจึงต้องเป็นศูนย์`,
      ),
    };
  },

  "mass-ejection:direction": ({ meta: { dir }, id, L }) =>
    id === "toward"
      ? {
          kind: "reverse",
          delta: 1,
          v: [-dir],
          hideValues: true,
          text: L(
            "The gas leaves toward the crew, so the ship is pushed the other way and drifts away from them.",
            "แก๊สพุ่งไปทางลูกเรือ ยานจึงถูกดันไปอีกทางและลอยห่างออกจากพวกเขา",
          ),
        }
      : id === "wait"
        ? {
            kind: "undershoot",
            delta: 1,
            v: [0],
            text: L(
              "Nothing is vented, so nothing pushes the ship. It stays where it is while the crew waits.",
              "ไม่มีการพ่นแก๊ส จึงไม่มีอะไรดันยาน ยานอยู่ที่เดิมในขณะที่ลูกเรือยังรออยู่",
            ),
          }
        : null,

  "mass-ejection:v": ({ meta: { M, mf, u, dir }, x, L }) => {
    const ship = (M - mf) * x;
    const delta = ship - mf * u;
    return {
      kind: "law",
      delta,
      v: [dir * x],
      text: L(
        `At ${fmt(x)} m/s the ship would carry ${fmt(ship)} kg·m/s, which is ${delta > 0 ? "more" : "less"} than the gas took the other way. The two momenta must be equal and opposite.`,
        `ที่ ${fmt(x)} m/s ยานจะมีโมเมนตัม ${fmt(ship)} kg·m/s ซึ่ง${delta > 0 ? "มากกว่า" : "น้อยกว่า"}ที่แก๊สพาไปอีกทาง โมเมนตัมทั้งสองต้องมีขนาดเท่ากันและทิศตรงข้ามกัน`,
      ),
    };
  },

  "elastic-transfer:v2f": ({ meta: { m1, v1, m2 }, x, L }) => elasticLaw(L, m1, v1, m2, x),
  "elastic-transfer:v1f": ({ meta: { m1, v1, m2 }, x, L }) => {
    const target = (2 * m1 * v1) / (m1 + m2);
    return momentumLaw(L, [`With the drone at ${sfmt(x)} m/s,`, `ถ้าโดรนมีความเร็ว ${sfmt(x)} m/s`], m1 * x + m2 * target, m1 * v1, [x, target], false);
  },

  "clamp-or-bumper:type": ({ meta: { m1, v1, m2, goal }, id, L }) => {
    const stick = (m1 * v1) / (m1 + m2);
    const bounce = 2 * stick;
    const needClamp = goal !== 1;
    if ((id === "clamp") === needClamp) return null;
    if (id === "clamp") {
      return {
        kind: "undershoot",
        delta: 1,
        v: [stick, stick],
        merged: true,
        text: L(
          `Locked together, tug and target leave at ${fmt(stick)} m/s. That is too slow for the mission goal.`,
          `เมื่อล็อกติดกัน ยานลากกับเป้าหมายออกไปที่ ${fmt(stick)} m/s ซึ่งช้าเกินไปสำหรับเป้าหมายภารกิจ`,
        ),
      };
    }
    return {
      kind: "impact",
      delta: 1,
      v: [((m1 - m2) * v1) / (m1 + m2), bounce],
      text:
        goal === 0
          ? L(
              `The target bounces away at ${fmt(bounce)} m/s and the tug is left behind. Nothing is attached.`,
              `เป้าหมายกระดอนออกไปที่ ${fmt(bounce)} m/s และยานลากถูกทิ้งไว้ข้างหลัง ไม่มีอะไรติดกันเลย`,
            )
          : L(
              `The target is knocked away at ${fmt(bounce)} m/s, faster than it can survive.`,
              `เป้าหมายถูกชนกระเด็นไปที่ ${fmt(bounce)} m/s ซึ่งเร็วเกินกว่าที่มันจะทนได้`,
            ),
    };
  },

  "clamp-or-bumper:v": ({ meta: { m1, v1, m2, goal }, x, L }) =>
    goal !== 1
      ? momentumLaw(L, [`If the locked pair moved at ${fmt(x)} m/s,`, `ถ้าทั้งคู่ที่ล็อกติดกันเคลื่อนที่ที่ ${fmt(x)} m/s`], (m1 + m2) * x, m1 * v1, [x, x], true)
      : elasticLaw(L, m1, v1, m2, x),

  "crisis-protocol:v1": ({ meta: { m1, v0, F, dt }, x, L }) => impulseLaw(L, m1 * (x - v0), -F * dt, x, [x, 0], ["the shuttle", "กระสวย"]),
  "crisis-protocol:vf": ({ meta: { m1, v0, F, dt, m2 }, x, L }) =>
    momentumLaw(L, [`If the clamped pair moved at ${fmt(x)} m/s,`, `ถ้าทั้งคู่ที่ล็อกติดกันเคลื่อนที่ที่ ${fmt(x)} m/s`], (m1 + m2) * x, m1 * (v0 - (F * dt) / m1), [x, x], true),
  "crisis-protocol:jStop": ({ meta: { m1, v0, F, dt, m2 }, x, L }) => {
    const pair = (m1 * (v0 - (F * dt) / m1)) / (m1 + m2);
    const end = pair + x / (m1 + m2);
    return stopping(L, [`With an impulse of ${sfmt(x)} N·s`, `เมื่อใช้การดล ${sfmt(x)} N·s`], end, ["the joined pair", "ทั้งคู่"], [end, end], true);
  },
};

/** A pod that must arrive with an exact momentum. */
function arrival(L: L, got: number, need: number, lead: string[], v: number[]): Consequence {
  const more = got > need;
  return {
    kind: more ? "impact" : "undershoot",
    delta: got - need,
    v,
    text: more
      ? L(
          `${lead[0]} the pod arrives with ${fmt(got)} kg·m/s, more than the net can take. The net tears.`,
          `${lead[0]} แคปซูลไปถึงด้วยโมเมนตัม ${fmt(got)} kg·m/s ซึ่งมากกว่าที่ตาข่ายรับได้ ตาข่ายจึงขาด`,
        )
      : L(
          `${lead[0]} the pod arrives with only ${fmt(got)} kg·m/s, too little to trip the capture latch. It bounces off and drifts away.`,
          `${lead[0]} แคปซูลไปถึงด้วยโมเมนตัมเพียง ${fmt(got)} kg·m/s ซึ่งน้อยเกินกว่าจะทำให้สลักจับทำงาน แคปซูลจึงกระดอนออกและลอยห่างไป`,
        ),
  };
}

/** A ship that must reach an exact intercept velocity. */
function intercept(L: L, lead: string, reached: number, need: number): Consequence {
  const slow = reached < need;
  return {
    kind: slow ? "undershoot" : "overshoot",
    delta: reached - need,
    v: [reached],
    text: slow
      ? L(
          `${lead} takes Rescue-1 to only ${fmt(reached)} m/s. It is too slow to intercept, and the crew drifts out of range.`,
          `${lead} ทำให้ Rescue-1 มีความเร็วเพียง ${fmt(reached)} m/s ช้าเกินกว่าจะไปถึง ลูกเรือจึงลอยพ้นระยะไป`,
        )
      : L(
          `${lead} takes Rescue-1 to ${fmt(reached)} m/s. It overshoots and flies past the crew.`,
          `${lead} ทำให้ Rescue-1 มีความเร็ว ${fmt(reached)} m/s เร็วเกินไปจนพุ่งเลยลูกเรือ`,
        ),
  };
}

/** A predicted velocity after a burn, checked against the impulse the burn really delivers. */
function impulseLaw(L: L, needed: number, delivered: number, x: number, v: number[], who: [string, string]): Consequence {
  return {
    kind: "law",
    delta: needed - delivered,
    v,
    text: L(
      `Bringing ${who[0]} to ${sfmt(x)} m/s would take an impulse of ${sfmt(needed)} N·s. The burn delivers ${sfmt(delivered)} N·s, so that is not where it ends up.`,
      `การทำให้${who[1]}มีความเร็ว ${sfmt(x)} m/s ต้องใช้การดล ${sfmt(needed)} N·s แต่เครื่องยนต์ให้การดล ${sfmt(delivered)} N·s ความเร็วสุดท้ายจึงไม่ใช่ค่านี้`,
    ),
  };
}

/** True when a step has a simulated consequence at all. */
export function hasConsequence(missionId: string, stepId: string): boolean {
  return `${missionId}:${stepId}` in HANDLERS;
}

/** The simulated outcome of this answer, or null when the step is a read-out with nothing to act on. */
export function consequenceOf(
  missionId: string,
  inst: MissionInstance,
  step: Step,
  input: StepInput,
  lang: Lang = "en",
): Consequence | null {
  const handler = HANDLERS[`${missionId}:${step.id}`];
  if (!handler) return null;
  const value = input.kind === "numeric" ? input.value : NaN;
  const x = step.kind === "numeric" && !step.signed ? Math.abs(value) : value;
  if (input.kind === "numeric" && !Number.isFinite(x)) return null;
  if (input.kind === "pair" && !(input.a > 0 && input.b > 0)) return null;
  // The right option has no consequence to show.
  if (step.kind === "choice" && input.kind === "choice" && step.options.find((o) => o.id === input.id)?.correct) return null;
  const result = handler({
    meta: inst.meta,
    x,
    id: input.kind === "choice" ? input.id : "",
    a: input.kind === "pair" ? input.a : NaN,
    b: input.kind === "pair" ? input.b : NaN,
    L: pick(lang),
  });
  if (!result || !result.v) return result;
  // Keep the playback readable when the answer is wildly off.
  return { ...result, v: result.v.map((n) => Math.round(n * 100) / 100) };
}
