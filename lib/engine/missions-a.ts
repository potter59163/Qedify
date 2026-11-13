import { U, choice, draw, fmt, isDp, mis, numeric, pair, r2, sfmt } from "./build";
import { pick } from "./lang";
import type { MissionDef, Tier, Trap } from "./types";

/** Number pools get less "round" as the support tier rises. */
const MASS: Record<Tier, number[]> = {
  0: [200, 400, 500, 800, 1000, 1200, 1500, 2000],
  1: [150, 250, 350, 450, 600, 750, 900, 1250, 1600, 2400],
  2: [130, 270, 340, 560, 720, 860, 1150, 1840],
};
const SPEED: Record<Tier, number[]> = {
  0: [3, 4, 5, 6, 8, 10],
  1: [2.5, 3.5, 4.5, 6.5, 7.5, 9, 12],
  2: [2.4, 3.6, 4.8, 5.5, 7.2, 8.5, 11.5],
};

/** The same wrong value with either sign maps to the same misconception. */
const both = (value: number, m: Trap["m"]): Trap[] => [
  { value, m },
  { value: -value, m },
];

// ───────────────────────── Chapter 1 · Momentum Fundamentals ─────────────────────────

const cargoCheck: MissionDef = {
  id: "cargo-check",
  chapter: 1,
  title: "Cargo Check",
  icon: "box",
  tagline: "p = mv basics",
  skills: ["momentum"],
  baseTime: 150,
  baseXp: 100,
  build(rng, tier, lang) {
    const L = pick(lang);
    const m = rng.pick(MASS[tier]);
    const v = rng.pick(SPEED[tier]);
    const p = r2(m * v);
    return {
      story:
        L("Supply shuttle Kestrel is inbound to the rescue fleet. Flight control needs its momentum before clearing the docking lane.", "ยานขนส่งเสบียง Kestrel กำลังมุ่งหน้าเข้าหากองยานกู้ภัย ศูนย์ควบคุมการบินต้องรู้โมเมนตัมของยานก่อนจะเปิดช่องเทียบท่าให้"),
      givens: [
        { label: L("Shuttle mass", "มวลยานขนส่ง"), value: `${fmt(m)} kg` },
        { label: L("Velocity", "ความเร็ว"), value: `${fmt(v)} m/s →` },
      ],
      scene: { backdrop: "orbit", bodies: [{ art: "rocket", name: "Kestrel", m, v }] },
      meta: { m, v },
      steps: [
        numeric({
          id: "p",
          skill: "momentum",
          assess: "application",
          title: L("MOMENTUM", "โมเมนตัม"),
          prompt: L("What is the shuttle's momentum?", "โมเมนตัมของยานขนส่งมีค่าเท่าไร"),
          label: "p",
          unit: U.p,
          answer: p,
          formula: "p = m × v",
          hints: [
            L("Momentum is 'mass in motion'. Which two quantities in the brief does it depend on?", "โมเมนตัมคือ 'มวลที่กำลังเคลื่อนที่' มันขึ้นกับปริมาณสองตัวใดในข้อมูลภารกิจ"),
            L("p = m × v. Read off the mass in kg and the velocity in m/s.", "p = m × v อ่านค่ามวลเป็น kg และความเร็วเป็น m/s"),
            L(`Set it up: p = ${fmt(m)} × ${fmt(v)}. The unit is kg·m/s.`, `ตั้งสมการ: p = ${fmt(m)} × ${fmt(v)} หน่วยคือ kg·m/s`),
          ],
          scaffold: [
            L(`1▸ Mass: m = ${fmt(m)} kg`, `1▸ มวล: m = ${fmt(m)} kg`),
            L(`2▸ Velocity: v = ${fmt(v)} m/s`, `2▸ ความเร็ว: v = ${fmt(v)} m/s`),
            L("3▸ Multiply: p = m × v", "3▸ คูณกัน: p = m × v"),
            L("4▸ Unit: kg·m/s", "4▸ หน่วย: kg·m/s"),
          ],
          explain: `p = m × v = ${fmt(m)} × ${fmt(v)} = ${fmt(p)} kg·m/s`,
          traps: [
            {
              value: m + v,
              m: mis(
                "added-not-multiplied",
                L("ADDED INSTEAD OF MULTIPLIED", "บวกแทนที่จะคูณ"),
                L(`You added m + v = ${fmt(m + v)}.\n\nMomentum is a product, not a sum:\np = m × v`, `คุณนำ m + v มาบวกกันได้ ${fmt(m + v)}\n\nโมเมนตัมเป็นผลคูณ ไม่ใช่ผลบวก:\np = m × v`),
              ),
            },
            {
              value: m / v,
              m: mis(
                "wrong-operation",
                L("DIVIDED INSTEAD OF MULTIPLIED", "หารแทนที่จะคูณ"),
                L("m ÷ v is not momentum.\n\nMultiply mass by velocity:\np = m × v", "m ÷ v ไม่ใช่โมเมนตัม\n\nให้นำมวลคูณกับความเร็ว:\np = m × v"),
              ),
            },
            {
              value: 0.5 * m * v * v,
              m: mis(
                "momentum-energy-confusion",
                L("THAT'S KINETIC ENERGY", "นั่นคือพลังงานจลน์"),
                L("½mv² is kinetic energy, measured in joules.\n\nMomentum is p = m × v, measured in kg·m/s.", "½mv² คือพลังงานจลน์ มีหน่วยเป็นจูล\n\nโมเมนตัมคือ p = m × v มีหน่วยเป็น kg·m/s"),
              ),
            },
          ],
        }),
      ],
    };
  },
};

const heavyOrFast: MissionDef = {
  id: "heavy-or-fast",
  chapter: 1,
  title: "Heavy or Fast?",
  icon: "scale",
  tagline: "Compare momenta",
  skills: ["momentum"],
  baseTime: 180,
  baseXp: 100,
  build(rng, tier, lang) {
    const L = pick(lang);
    const pools =
      tier === 0
        ? { m1: [4000, 5000, 6000, 8000], v1: [1, 2, 3], m2: [200, 400, 500, 800], v2: [10, 20, 25, 30, 40] }
        : { m1: [3600, 4500, 5200, 7500], v1: [1.5, 2, 2.5], m2: [250, 350, 450, 600], v2: [12, 18, 24, 32] };
    const [m1, v1, m2, v2] = draw(
      () => [rng.pick(pools.m1), rng.pick(pools.v1), rng.pick(pools.m2), rng.pick(pools.v2)],
      ([a, b, c, d]) => Math.abs(a * b - c * d) >= 2000,
      [5000, 2, 400, 30],
    );
    const p1 = r2(m1 * v1);
    const p2 = r2(m2 * v2);
    const freighterWins = p1 > p2;
    const diff = Math.abs(p1 - p2);
    return {
      story:
        L("Two craft are drifting toward the same debris net. The net must be braced for whichever one is harder to stop.", "ยานสองลำกำลังลอยเข้าหาตาข่ายดักเศษซากผืนเดียวกัน ต้องเสริมตาข่ายให้รับลำที่หยุดได้ยากกว่า"),
      givens: [
        { label: L("Freighter Atlas", "ยานบรรทุก Atlas"), value: L(`${fmt(m1)} kg at ${fmt(v1)} m/s`, `${fmt(m1)} kg ที่ ${fmt(v1)} m/s`) },
        { label: L("Probe Dart", "ยานสำรวจ Dart"), value: L(`${fmt(m2)} kg at ${fmt(v2)} m/s`, `${fmt(m2)} kg ที่ ${fmt(v2)} m/s`) },
      ],
      scene: {
        backdrop: "orbit",
        bodies: [
          { art: "satellite", name: "Atlas", m: m1, v: v1 },
          { art: "rocket", name: "Dart", m: m2, v: v2 },
        ],
      },
      meta: { m1, v1, m2, v2 },
      steps: [
        choice({
          id: "which",
          skill: "momentum",
          assess: "analysis",
          title: L("HARDER TO STOP", "ลำไหนหยุดยากกว่า"),
          prompt: L("Which craft has the greater momentum?", "ยานลำใดมีโมเมนตัมมากกว่า"),
          formula: L("p = m × v (for each craft)", "p = m × v (คิดทีละลำ)"),
          hints: [
            L("Being heavy is not enough, and being fast is not enough. What combines the two?", "หนักอย่างเดียวไม่พอ เร็วอย่างเดียวก็ไม่พอ ปริมาณใดรวมทั้งสองอย่างเข้าด้วยกัน"),
            L("Compute p = m × v for the freighter and for the probe, then compare.", "คำนวณ p = m × v ของยานบรรทุกและของยานสำรวจ แล้วนำมาเปรียบเทียบกัน"),
            L(`Freighter: ${fmt(m1)} × ${fmt(v1)}. Probe: ${fmt(m2)} × ${fmt(v2)}. Which product is larger?`, `ยานบรรทุก: ${fmt(m1)} × ${fmt(v1)} ยานสำรวจ: ${fmt(m2)} × ${fmt(v2)} ผลคูณใดมากกว่า`),
          ],
          scaffold: [
            `1▸ p_Atlas = ${fmt(m1)} × ${fmt(v1)}`,
            `2▸ p_Dart = ${fmt(m2)} × ${fmt(v2)}`,
            L("3▸ The larger product is harder to stop", "3▸ ผลคูณที่มากกว่าคือลำที่หยุดยากกว่า"),
          ],
          explain: L(`p_Atlas = ${fmt(p1)} kg·m/s, p_Dart = ${fmt(p2)} kg·m/s → ${freighterWins ? "the freighter" : "the probe"} has more momentum.`, `p_Atlas = ${fmt(p1)} kg·m/s, p_Dart = ${fmt(p2)} kg·m/s → ${freighterWins ? "ยานบรรทุก" : "ยานสำรวจ"}มีโมเมนตัมมากกว่า`),
          options: [
            {
              id: "freighter",
              icon: "satellite",
              label: L("Freighter Atlas", "ยานบรรทุก Atlas"),
              detail: L("heavier, slower", "หนักกว่า ช้ากว่า"),
              correct: freighterWins,
              m: mis(
                "mass-speed-bias",
                L("MASS ISN'T EVERYTHING", "มวลไม่ใช่ทุกอย่าง"),
                L("The freighter is heavier, but momentum also depends on velocity.\n\nCompare p = m × v for both craft.", "ยานบรรทุกหนักกว่าก็จริง แต่โมเมนตัมขึ้นกับความเร็วด้วย\n\nเปรียบเทียบ p = m × v ของทั้งสองลำ"),
              ),
            },
            {
              id: "probe",
              icon: "rocket",
              label: L("Probe Dart", "ยานสำรวจ Dart"),
              detail: L("lighter, faster", "เบากว่า เร็วกว่า"),
              correct: !freighterWins,
              m: mis(
                "mass-speed-bias",
                L("SPEED ISN'T EVERYTHING", "ความเร็วไม่ใช่ทุกอย่าง"),
                L("The probe is faster, but momentum also depends on mass.\n\nCompare p = m × v for both craft.", "ยานสำรวจเร็วกว่าก็จริง แต่โมเมนตัมขึ้นกับมวลด้วย\n\nเปรียบเทียบ p = m × v ของทั้งสองลำ"),
              ),
            },
            {
              id: "equal",
              icon: "equal",
              label: L("They are equal", "เท่ากัน"),
              correct: false,
              why: L("Work out p = m × v for each craft — the two products are different.", "ลองคำนวณ p = m × v ของแต่ละลำ ผลคูณทั้งสองไม่เท่ากัน"),
            },
          ],
        }),
        numeric({
          id: "diff",
          skill: "momentum",
          assess: "application",
          title: L("MOMENTUM GAP", "ส่วนต่างโมเมนตัม"),
          prompt: L("By how much do their momenta differ?", "โมเมนตัมของยานทั้งสองต่างกันเท่าไร"),
          label: "Δp",
          unit: U.p,
          answer: diff,
          formula: L("Δp = p_larger − p_smaller", "Δp = p_มาก − p_น้อย"),
          hints: [
            L("You need both momenta first. Then compare them by subtracting.", "ต้องหาโมเมนตัมของทั้งสองลำก่อน แล้วเปรียบเทียบด้วยการลบ"),
            L("Δp = (larger p) − (smaller p). Keep each p = m × v exact.", "Δp = (p ที่มากกว่า) − (p ที่น้อยกว่า) เก็บค่า p = m × v ของแต่ละลำไว้โดยไม่ปัดเศษ"),
            L(`Set it up: ${fmt(Math.max(p1, p2))} − ${fmt(Math.min(p1, p2))}.`, `ตั้งสมการ: ${fmt(Math.max(p1, p2))} − ${fmt(Math.min(p1, p2))}`),
          ],
          scaffold: [
            `1▸ p_Atlas = ${fmt(m1)} × ${fmt(v1)}`,
            `2▸ p_Dart = ${fmt(m2)} × ${fmt(v2)}`,
            L("3▸ Subtract the smaller from the larger", "3▸ นำค่ามากลบด้วยค่าน้อย"),
          ],
          explain: `Δp = ${fmt(Math.max(p1, p2))} − ${fmt(Math.min(p1, p2))} = ${fmt(diff)} kg·m/s`,
          traps: [
            {
              value: p1 + p2,
              m: mis(
                "wrong-operation",
                L("ADDED THE MOMENTA", "นำโมเมนตัมมาบวกกัน"),
                L("The question asks for the difference.\n\nSubtract the smaller momentum from the larger one.", "โจทย์ถามหาผลต่าง\n\nให้นำโมเมนตัมที่มากกว่าลบด้วยโมเมนตัมที่น้อยกว่า"),
              ),
            },
            {
              value: Math.max(p1, p2),
              m: mis(
                "wrong-operation",
                L("THAT'S ONE CRAFT'S MOMENTUM", "นั่นคือโมเมนตัมของยานลำเดียว"),
                L("You found the larger momentum.\n\nNow subtract the other craft's momentum from it.", "คุณหาโมเมนตัมค่าที่มากกว่าได้แล้ว\n\nต่อไปให้ลบด้วยโมเมนตัมของยานอีกลำ"),
              ),
            },
            {
              value: Math.min(p1, p2),
              m: mis(
                "wrong-operation",
                L("THAT'S ONE CRAFT'S MOMENTUM", "นั่นคือโมเมนตัมของยานลำเดียว"),
                L("You found the smaller momentum.\n\nSubtract it from the larger one to get the gap.", "คุณหาโมเมนตัมค่าที่น้อยกว่าได้แล้ว\n\nนำไปลบออกจากค่าที่มากกว่าเพื่อหาส่วนต่าง"),
              ),
            },
          ],
        }),
      ],
    };
  },
};

const oppositeLanes: MissionDef = {
  id: "opposite-lanes",
  chapter: 1,
  title: "Opposite Lanes",
  icon: "arrows",
  tagline: "Momentum is a vector",
  skills: ["vector", "momentum"],
  baseTime: 200,
  baseXp: 110,
  build(rng, tier, lang) {
    const L = pick(lang);
    const ms = tier === 0 ? [500, 800, 1000, 1200, 1500, 2000] : [450, 650, 900, 1100, 1400, 1800];
    const vs = tier === 0 ? [2, 3, 4, 5, 6, 8] : [2.5, 3.5, 4, 5, 6.5, 7.5];
    const [m1, v1, m2, v2] = draw(
      () => [rng.pick(ms), rng.pick(vs), rng.pick(ms), rng.pick(vs)],
      ([a, b, c, d]) => Math.abs(a * b - c * d) >= 500,
      [1000, 6, 800, 5],
    );
    const pA = r2(m1 * v1);
    const pB = r2(-m2 * v2);
    const total = r2(pA + pB);
    return {
      story:
        L("Two shuttles share one flight corridor and approach head-on. Traffic control tracks the momentum of the whole system.", "ยานขนส่งสองลำใช้เส้นทางบินเดียวกันและกำลังแล่นสวนกัน ศูนย์จราจรต้องติดตามโมเมนตัมของทั้งระบบ"),
      givens: [
        { label: L("Shuttle A", "ยาน A"), value: L(`${fmt(m1)} kg at ${fmt(v1)} m/s →`, `${fmt(m1)} kg ที่ ${fmt(v1)} m/s →`) },
        { label: L("Shuttle B", "ยาน B"), value: L(`${fmt(m2)} kg at ${fmt(v2)} m/s ←`, `${fmt(m2)} kg ที่ ${fmt(v2)} m/s ←`) },
        { label: L("Sign rule", "กติกาเครื่องหมาย"), value: L("→ positive, ← negative", "→ เป็นบวก, ← เป็นลบ") },
      ],
      scene: {
        backdrop: "orbit",
        bodies: [
          { art: "rocket", name: "A", m: m1, v: v1 },
          { art: "saucer", name: "B", m: m2, v: -v2 },
        ],
      },
      meta: { m1, v1, m2, v2 },
      steps: [
        numeric({
          id: "pB",
          skill: "vector",
          assess: "application",
          title: L("LEFTWARD MOMENTUM", "โมเมนตัมทางซ้าย"),
          prompt: L("What is the momentum of shuttle B? Include the sign.", "โมเมนตัมของยาน B มีค่าเท่าไร ใส่เครื่องหมายด้วย"),
          label: "p_B",
          unit: U.p,
          answer: pB,
          signed: true,
          formula: L("p = m × v (v is negative when moving ←)", "p = m × v (v เป็นลบเมื่อเคลื่อนที่ ←)"),
          hints: [
            L("Momentum points the same way as the velocity. Which way is B moving?", "โมเมนตัมชี้ไปทางเดียวกับความเร็ว ยาน B กำลังเคลื่อนที่ไปทางไหน"),
            L("B moves left, so its velocity is negative. p_B = m × (−v).", "ยาน B เคลื่อนที่ไปทางซ้าย ความเร็วจึงเป็นลบ p_B = m × (−v)"),
            L(`Set it up: p_B = ${fmt(m2)} × (−${fmt(v2)}).`, `ตั้งสมการ: p_B = ${fmt(m2)} × (−${fmt(v2)})`),
          ],
          scaffold: [
            L(`1▸ B moves ←, so v_B = −${fmt(v2)} m/s`, `1▸ B เคลื่อนที่ ← ดังนั้น v_B = −${fmt(v2)} m/s`),
            `2▸ p_B = ${fmt(m2)} × v_B`,
            L("3▸ Keep the minus sign", "3▸ อย่าลืมเครื่องหมายลบ"),
          ],
          explain: `p_B = ${fmt(m2)} × (−${fmt(v2)}) = ${fmt(pB)} kg·m/s`,
        }),
        numeric({
          id: "total",
          skill: "vector",
          assess: "application",
          title: L("SYSTEM MOMENTUM", "โมเมนตัมของระบบ"),
          prompt: L("What is the total momentum of the two shuttles? Include the sign.", "โมเมนตัมรวมของยานทั้งสองลำมีค่าเท่าไร ใส่เครื่องหมายด้วย"),
          label: "p_total",
          unit: U.p,
          answer: total,
          signed: true,
          formula: "p_total = p_A + p_B",
          hints: [
            L("Momenta add as vectors. Opposite directions partly cancel.", "โมเมนตัมรวมกันแบบเวกเตอร์ ทิศตรงข้ามกันจะหักล้างกันบางส่วน"),
            L("p_total = p_A + p_B, where p_B is negative.", "p_total = p_A + p_B โดย p_B เป็นลบ"),
            L(`Set it up: ${fmt(pA)} + (${fmt(pB)}).`, `ตั้งสมการ: ${fmt(pA)} + (${fmt(pB)})`),
          ],
          scaffold: [
            L(`1▸ p_A = ${fmt(m1)} × ${fmt(v1)} (positive)`, `1▸ p_A = ${fmt(m1)} × ${fmt(v1)} (เป็นบวก)`),
            L(`2▸ p_B = ${fmt(m2)} × (−${fmt(v2)}) (negative)`, `2▸ p_B = ${fmt(m2)} × (−${fmt(v2)}) (เป็นลบ)`),
            L("3▸ Add them, signs included", "3▸ บวกกันโดยคิดเครื่องหมายด้วย"),
          ],
          explain: `p_total = ${fmt(pA)} + (${fmt(pB)}) = ${sfmt(total)} kg·m/s`,
          traps: [
            ...both(
              pA - pB,
              mis(
                "vector-neglect",
                L("VECTOR NEGLECT", "ลืมทิศของเวกเตอร์"),
                L("You added the two sizes as if both shuttles moved the same way.\n\nB moves left, so its momentum is negative and partly cancels A's.", "คุณบวกขนาดทั้งสองเข้าด้วยกันราวกับยานทั้งสองลำไปทางเดียวกัน\n\nยาน B ไปทางซ้าย โมเมนตัมจึงเป็นลบและหักล้างกับของ A บางส่วน"),
              ),
            ),
            {
              value: pA,
              m: mis(
                "wrong-operation",
                L("ONLY ONE SHUTTLE COUNTED", "นับยานแค่ลำเดียว"),
                L("That is shuttle A alone.\n\nThe system includes both shuttles: add B's (negative) momentum.", "นั่นคือโมเมนตัมของยาน A ลำเดียว\n\nระบบนี้มียานสองลำ ให้บวกโมเมนตัม (ที่เป็นลบ) ของ B เข้าไปด้วย"),
              ),
            },
          ],
        }),
      ],
    };
  },
};

const tugAssist: MissionDef = {
  id: "tug-assist",
  chapter: 1,
  title: "Tug Assist",
  icon: "target",
  tagline: "Hit a momentum target",
  skills: ["momentum"],
  baseTime: 180,
  baseXp: 110,
  build(rng, tier, lang) {
    const L = pick(lang);
    const m = rng.pick([250, 400, 500, 750, 800, 1200, 1500]);
    const v = rng.pick(tier === 0 ? [2, 3, 4, 5, 6, 8] : [2.5, 3.2, 4.5, 6.4, 7.5]);
    const p = r2(m * v);
    const findMass = tier > 0 && rng.chance(0.5);
    const common = {
      skill: "momentum" as const,
      assess: "application" as const,
      unit: findMass ? U.m : U.v,
    };
    const wrong = (title: string, body: string) => mis("wrong-operation", title, body);
    return {
      story: findMass
        ? L("A cargo pod must arrive at the capture net with an exact momentum — any more and the net tears. Its release speed is fixed, so the load must be trimmed.", "แคปซูลสินค้าต้องไปถึงตาข่ายรับด้วยโมเมนตัมที่พอดี ถ้ามากกว่านี้ตาข่ายจะขาด อัตราเร็วตอนปล่อยถูกกำหนดไว้แล้ว จึงต้องปรับน้ำหนักบรรทุก")
        : L("A stranded pod must arrive at the capture net with an exact momentum — any more and the net tears. Set the tug's release speed.", "แคปซูลที่ติดค้างต้องไปถึงตาข่ายรับด้วยโมเมนตัมที่พอดี ถ้ามากกว่านี้ตาข่ายจะขาด จงตั้งอัตราเร็วที่ยานลากจะปล่อยแคปซูล"),
      givens: findMass
        ? [
            { label: L("Required momentum", "โมเมนตัมที่ต้องการ"), value: `${fmt(p)} kg·m/s` },
            { label: L("Release speed", "อัตราเร็วตอนปล่อย"), value: `${fmt(v)} m/s →` },
          ]
        : [
            { label: L("Required momentum", "โมเมนตัมที่ต้องการ"), value: `${fmt(p)} kg·m/s` },
            { label: L("Pod mass", "มวลแคปซูล"), value: `${fmt(m)} kg` },
          ],
      scene: { backdrop: "orbit", bodies: [{ art: "satellite", name: L("Pod", "แคปซูล"), m, v }] },
      meta: { m, v, p, findMass: findMass ? 1 : 0 },
      steps: [
        findMass
          ? numeric({
              ...common,
              id: "m",
              title: L("LOAD TRIM", "ปรับน้ำหนักบรรทุก"),
              prompt: L("What total mass must the pod have?", "แคปซูลต้องมีมวลรวมเท่าไร"),
              label: "m",
              answer: m,
              formula: "p = m × v → m = p ÷ v",
              hints: [
                L("You know p and v. Rearrange p = m × v for the unknown.", "รู้ค่า p และ v แล้ว ให้จัดรูป p = m × v เพื่อหาตัวที่ยังไม่รู้"),
                L("m = p ÷ v. Check the units: (kg·m/s) ÷ (m/s) = kg.", "m = p ÷ v ตรวจหน่วย: (kg·m/s) ÷ (m/s) = kg"),
                L(`Set it up: m = ${fmt(p)} ÷ ${fmt(v)}.`, `ตั้งสมการ: m = ${fmt(p)} ÷ ${fmt(v)}`),
              ],
              scaffold: [`1▸ p = ${fmt(p)} kg·m/s`, `2▸ v = ${fmt(v)} m/s`, L("3▸ Rearrange: m = p ÷ v", "3▸ จัดรูป: m = p ÷ v")],
              explain: `m = p ÷ v = ${fmt(p)} ÷ ${fmt(v)} = ${fmt(m)} kg`,
              traps: [
                { value: p * v, m: wrong(L("MULTIPLIED INSTEAD OF DIVIDED", "คูณแทนที่จะหาร"), L("p × v does not give a mass.\n\nRearrange p = m × v:\nm = p ÷ v", "p × v ไม่ได้ให้ค่ามวล\n\nจัดรูป p = m × v:\nm = p ÷ v")) },
                { value: v / p, m: wrong(L("INVERTED RATIO", "อัตราส่วนกลับหัว"), L("You divided the wrong way round.\n\nm = p ÷ v", "คุณหารกลับข้างกัน\n\nm = p ÷ v")) },
              ],
            })
          : numeric({
              ...common,
              id: "v",
              title: L("RELEASE SPEED", "อัตราเร็วตอนปล่อย"),
              prompt: L("What velocity must the pod have?", "แคปซูลต้องมีความเร็วเท่าไร"),
              label: "v",
              answer: v,
              formula: "p = m × v → v = p ÷ m",
              hints: [
                L("You know p and m. Rearrange p = m × v for the unknown.", "รู้ค่า p และ m แล้ว ให้จัดรูป p = m × v เพื่อหาตัวที่ยังไม่รู้"),
                L("v = p ÷ m. Check the units: (kg·m/s) ÷ kg = m/s.", "v = p ÷ m ตรวจหน่วย: (kg·m/s) ÷ kg = m/s"),
                L(`Set it up: v = ${fmt(p)} ÷ ${fmt(m)}.`, `ตั้งสมการ: v = ${fmt(p)} ÷ ${fmt(m)}`),
              ],
              scaffold: [`1▸ p = ${fmt(p)} kg·m/s`, `2▸ m = ${fmt(m)} kg`, L("3▸ Rearrange: v = p ÷ m", "3▸ จัดรูป: v = p ÷ m")],
              explain: `v = p ÷ m = ${fmt(p)} ÷ ${fmt(m)} = ${fmt(v)} m/s`,
              traps: [
                { value: p * m, m: wrong(L("MULTIPLIED INSTEAD OF DIVIDED", "คูณแทนที่จะหาร"), L("p × m does not give a velocity.\n\nRearrange p = m × v:\nv = p ÷ m", "p × m ไม่ได้ให้ค่าความเร็ว\n\nจัดรูป p = m × v:\nv = p ÷ m")) },
                { value: m / p, m: wrong(L("INVERTED RATIO", "อัตราส่วนกลับหัว"), L("You divided the wrong way round.\n\nv = p ÷ m", "คุณหารกลับข้างกัน\n\nv = p ÷ m")) },
              ],
            }),
      ],
    };
  },
};

// ───────────────────────── Chapter 2 · Impulse & Force ─────────────────────────

const orbitalRescue: MissionDef = {
  id: "orbital-rescue",
  chapter: 2,
  title: "Orbital Rescue",
  icon: "rocket",
  tagline: "J = FΔt, your way",
  skills: ["impulse"],
  baseTime: 210,
  baseXp: 140,
  build(rng, _tier, lang) {
    const L = pick(lang);
    const [m, vi, dv, fMax, tMax] = draw(
      () => [
        rng.pick([1000, 1500, 2000, 2500]),
        rng.pick([3, 4, 5, 6]),
        rng.pick([4, 6, 8, 10]),
        rng.pick([4000, 5000, 8000, 10000]),
        rng.pick([5, 6, 8, 10]),
      ],
      ([a, , c, f, t]) => a * c <= f * t && a * c >= 0.3 * f * t && isDp((a * c) / f, 2),
      [2000, 5, 10, 5000, 8],
    );
    const vt = vi + dv;
    const J = m * dv;
    return {
      story:
        L("A crew is stranded near the relay station. Rescue-1 must speed up to intercept them — but the thrusters and the fuel both have limits.", "ลูกเรือติดอยู่ใกล้สถานีถ่ายทอดสัญญาณ ยาน Rescue-1 ต้องเร่งความเร็วเพื่อไปรับ แต่ทั้งแรงขับและเชื้อเพลิงมีขีดจำกัด"),
      givens: [
        { label: L("Spacecraft mass", "มวลยาน"), value: `${fmt(m)} kg` },
        { label: L("Current velocity", "ความเร็วปัจจุบัน"), value: `${fmt(vi)} m/s →` },
        { label: L("Intercept velocity", "ความเร็วที่ต้องทำให้ได้"), value: `${fmt(vt)} m/s →` },
        { label: L("Max thrust", "แรงขับสูงสุด"), value: `${fmt(fMax)} N` },
        { label: L("Fuel lasts", "เชื้อเพลิงใช้ได้นาน"), value: `${fmt(tMax)} s` },
      ],
      scene: {
        backdrop: "orbit",
        bodies: [{ art: "rocket", name: "Rescue-1", m, v: vi }],
        after: { v: [vt], merged: false },
      },
      meta: { m, vi, vt, fMax, tMax },
      steps: [
        numeric({
          id: "J",
          skill: "impulse",
          assess: "application",
          title: L("REQUIRED IMPULSE", "การดลที่ต้องใช้"),
          prompt: L("What impulse must the thrusters deliver?", "เครื่องยนต์ต้องให้การดลเท่าไร"),
          label: "J",
          unit: U.J,
          answer: J,
          formula: "J = Δp = m × (v_final − v_initial)",
          hints: [
            L("Impulse equals the CHANGE in momentum, not the momentum itself.", "การดลเท่ากับโมเมนตัมที่ 'เปลี่ยนไป' ไม่ใช่ตัวโมเมนตัมเอง"),
            L("J = m × Δv. First find how much the velocity must change.", "J = m × Δv หาก่อนว่าความเร็วต้องเปลี่ยนไปเท่าไร"),
            L(`Set it up: J = ${fmt(m)} × (${fmt(vt)} − ${fmt(vi)}).`, `ตั้งสมการ: J = ${fmt(m)} × (${fmt(vt)} − ${fmt(vi)})`),
          ],
          scaffold: [
            `1▸ Δv = ${fmt(vt)} − ${fmt(vi)}`,
            `2▸ J = m × Δv = ${fmt(m)} × Δv`,
            L("3▸ Unit: N·s (same as kg·m/s)", "3▸ หน่วย: N·s (เท่ากับ kg·m/s)"),
          ],
          explain: `J = m × Δv = ${fmt(m)} × ${fmt(dv)} = ${fmt(J)} N·s`,
          traps: [
            {
              value: m * vi,
              m: mis(
                "impulse-momentum-confusion",
                L("MOMENTUM ≠ IMPULSE", "โมเมนตัม ≠ การดล"),
                L("m × v_now is the momentum the ship already has.\n\nImpulse is the change:\nJ = m × (v_final − v_initial)", "m × v_ตอนนี้ คือโมเมนตัมที่ยานมีอยู่แล้ว\n\nการดลคือส่วนที่เปลี่ยนไป:\nJ = m × (v_final − v_initial)"),
              ),
            },
            {
              value: m * vt,
              m: mis(
                "impulse-momentum-confusion",
                L("THAT'S THE FINAL MOMENTUM", "นั่นคือโมเมนตัมสุดท้าย"),
                L("m × v_final is where the ship ends up.\n\nSubtract the momentum it already has:\nJ = m × (v_final − v_initial)", "m × v_final คือโมเมนตัมตอนจบ\n\nต้องลบโมเมนตัมที่ยานมีอยู่แล้วออก:\nJ = m × (v_final − v_initial)"),
              ),
            },
          ],
        }),
        pair({
          id: "burn",
          skill: "impulse",
          assess: "application",
          title: L("PLAN THE BURN", "วางแผนจุดเครื่องยนต์"),
          prompt: L("Choose a thrust and a burn time that deliver exactly that impulse.", "เลือกแรงขับและเวลาจุดเครื่องยนต์ที่ให้การดลเท่านั้นพอดี"),
          formula: "J = F × Δt",
          a: { label: L("FORCE", "แรง"), unit: U.F, max: fMax },
          b: { label: L("TIME", "เวลา"), unit: U.t, max: tMax },
          target: J,
          unit: U.J,
          hints: [
            L("Impulse is force applied over time: J = F × Δt. Many (F, Δt) pairs give the same impulse.", "การดลคือแรงที่กระทำตลอดช่วงเวลา: J = F × Δt มีคู่ (F, Δt) หลายคู่ที่ให้การดลเท่ากัน"),
            L("Pick a thrust within the limit, then solve Δt = J ÷ F. Check that it fits the fuel window.", "เลือกแรงขับที่ไม่เกินขีดจำกัด แล้วหา Δt = J ÷ F ตรวจว่าไม่เกินเวลาของเชื้อเพลิง"),
            L(`Try the strongest thrust: Δt = ${fmt(J)} ÷ ${fmt(fMax)}. Does it fit within ${fmt(tMax)} s?`, `ลองใช้แรงขับสูงสุด: Δt = ${fmt(J)} ÷ ${fmt(fMax)} อยู่ภายใน ${fmt(tMax)} s หรือไม่`),
          ],
          scaffold: [
            L(`1▸ Target: J = ${fmt(J)} N·s`, `1▸ เป้าหมาย: J = ${fmt(J)} N·s`),
            L("2▸ Formula: J = F × Δt", "2▸ สูตร: J = F × Δt"),
            L(`3▸ Choose F ≤ ${fmt(fMax)} N, then Δt = J ÷ F`, `3▸ เลือก F ≤ ${fmt(fMax)} N แล้วหา Δt = J ÷ F`),
            L(`4▸ Check: Δt ≤ ${fmt(tMax)} s?`, `4▸ ตรวจ: Δt ≤ ${fmt(tMax)} s หรือไม่`),
          ],
          explain: L(`Any pair with F × Δt = ${fmt(J)} N·s works, e.g. ${fmt(fMax)} N for ${fmt(J / fMax)} s.`, `คู่ใดก็ได้ที่ F × Δt = ${fmt(J)} N·s เช่น ${fmt(fMax)} N นาน ${fmt(J / fMax)} s`),
          traps: [
            {
              value: m * vi,
              m: mis(
                "impulse-momentum-confusion",
                L("MOMENTUM ≠ IMPULSE", "โมเมนตัม ≠ การดล"),
                L(`F × Δt matched the ship's current momentum (${fmt(m * vi)} kg·m/s).\n\nThe burn must supply the CHANGE in momentum.`, `F × Δt ไปเท่ากับโมเมนตัมปัจจุบันของยาน (${fmt(m * vi)} kg·m/s)\n\nการจุดเครื่องยนต์ต้องให้โมเมนตัมส่วนที่ 'เปลี่ยนไป'`),
              ),
            },
          ],
          overA: mis(
            "resource-limit",
            L("THRUSTER OVERLOAD", "เครื่องยนต์รับไม่ไหว"),
            L(`The engines cannot exceed ${fmt(fMax)} N.\n\nUse a smaller force for a longer time — impulse depends on F × Δt.`, `เครื่องยนต์ให้แรงได้ไม่เกิน ${fmt(fMax)} N\n\nใช้แรงน้อยลงแต่นานขึ้น เพราะการดลขึ้นกับ F × Δt`),
          ),
          overB: mis(
            "resource-limit",
            L("OUT OF FUEL", "เชื้อเพลิงหมด"),
            L(`The fuel only lasts ${fmt(tMax)} s.\n\nUse a larger force for a shorter time — impulse depends on F × Δt.`, `เชื้อเพลิงใช้ได้เพียง ${fmt(tMax)} s\n\nใช้แรงมากขึ้นในเวลาสั้นลง เพราะการดลขึ้นกับ F × Δt`),
          ),
        }),
      ],
    };
  },
};

const fullStop: MissionDef = {
  id: "full-stop",
  chapter: 2,
  title: "Full Stop",
  icon: "stop",
  tagline: "Impulse to stop a ship",
  skills: ["impulse", "vector"],
  baseTime: 210,
  baseXp: 140,
  build(rng, _tier, lang) {
    const L = pick(lang);
    const [m, v, dt] = draw(
      () => [
        rng.pick([1000, 1500, 2000, 2500, 3000, 4000]),
        rng.pick([4, 5, 6, 8, 10, 12]),
        rng.pick([2, 4, 5, 8, 10]),
      ],
      ([a, b, c]) => isDp((a * b) / c, 1),
      [2000, 10, 5],
    );
    const J = -m * v;
    const F = r2(J / dt);
    return {
      story:
        L("A ship is closing on the station too fast. Its retro-thrusters must bring it to rest before contact.", "ยานลำหนึ่งกำลังพุ่งเข้าหาสถานีเร็วเกินไป เครื่องยนต์ถอยหลังต้องทำให้ยานหยุดนิ่งก่อนจะแตะสถานี"),
      givens: [
        { label: L("Ship mass", "มวลยาน"), value: `${fmt(m)} kg` },
        { label: L("Velocity", "ความเร็ว"), value: `${fmt(v)} m/s →` },
        { label: L("Must stop within", "ต้องหยุดภายใน"), value: `${fmt(dt)} s` },
        { label: L("Sign rule", "กติกาเครื่องหมาย"), value: L("→ positive, ← negative", "→ เป็นบวก, ← เป็นลบ") },
      ],
      scene: {
        backdrop: "dock",
        bodies: [{ art: "rocket", name: L("Ship", "ยาน"), m, v }],
        after: { v: [0], merged: false },
      },
      meta: { m, v, dt },
      steps: [
        numeric({
          id: "J",
          skill: "impulse",
          assess: "application",
          title: L("STOPPING IMPULSE", "การดลเพื่อหยุดยาน"),
          prompt: L("What impulse brings the ship to rest? Include the sign.", "ต้องใช้การดลเท่าไรจึงจะทำให้ยานหยุดนิ่ง ใส่เครื่องหมายด้วย"),
          label: "J",
          unit: U.J,
          answer: J,
          signed: true,
          formula: "J = Δp = p_final − p_initial",
          hints: [
            L("Stopping means the final momentum is zero. Impulse is final minus initial.", "หยุดนิ่งหมายถึงโมเมนตัมสุดท้ายเป็นศูนย์ การดลคือค่าสุดท้ายลบค่าเริ่มต้น"),
            L("J = 0 − m × v. The impulse must point against the motion.", "J = 0 − m × v การดลต้องมีทิศสวนกับการเคลื่อนที่"),
            L(`Set it up: J = 0 − ${fmt(m)} × ${fmt(v)}.`, `ตั้งสมการ: J = 0 − ${fmt(m)} × ${fmt(v)}`),
          ],
          scaffold: [
            `1▸ p_initial = ${fmt(m)} × ${fmt(v)}`,
            L("2▸ p_final = 0 (at rest)", "2▸ p_final = 0 (หยุดนิ่ง)"),
            "3▸ J = p_final − p_initial",
          ],
          explain: L(`J = 0 − ${fmt(m)} × ${fmt(v)} = ${fmt(J)} N·s (the minus sign: it acts ←)`, `J = 0 − ${fmt(m)} × ${fmt(v)} = ${fmt(J)} N·s (เครื่องหมายลบ: กระทำไปทาง ←)`),
          traps: both(
            (m * v) / dt,
            mis(
              "force-impulse-confusion",
              L("THAT'S THE FORCE, NOT THE IMPULSE", "นั่นคือแรง ไม่ใช่การดล"),
              L("You already divided by the time.\n\nImpulse is the change in momentum:\nJ = p_final − p_initial\n\nThe force comes next.", "คุณหารด้วยเวลาไปแล้ว\n\nการดลคือโมเมนตัมที่เปลี่ยนไป:\nJ = p_final − p_initial\n\nส่วนแรงเป็นขั้นถัดไป"),
            ),
          ),
        }),
        numeric({
          id: "F",
          skill: "impulse",
          assess: "application",
          title: L("RETRO-THRUST", "แรงขับถอยหลัง"),
          prompt: L("What average force do the retro-thrusters need? Include the sign.", "เครื่องยนต์ถอยหลังต้องให้แรงเฉลี่ยเท่าไร ใส่เครื่องหมายด้วย"),
          label: "F",
          unit: U.F,
          answer: F,
          signed: true,
          formula: "J = F × Δt → F = J ÷ Δt",
          hints: [
            L("The same impulse can come from a big force briefly or a small force for longer.", "การดลเท่าเดิมได้ทั้งจากแรงมากในเวลาสั้น หรือแรงน้อยในเวลานาน"),
            L("F = J ÷ Δt. Use the impulse you just found, sign included.", "F = J ÷ Δt ใช้การดลที่เพิ่งหาได้ พร้อมเครื่องหมาย"),
            L(`Set it up: F = ${fmt(J)} ÷ ${fmt(dt)}.`, `ตั้งสมการ: F = ${fmt(J)} ÷ ${fmt(dt)}`),
          ],
          scaffold: [`1▸ J = ${fmt(J)} N·s`, `2▸ Δt = ${fmt(dt)} s`, "3▸ F = J ÷ Δt"],
          explain: `F = J ÷ Δt = ${fmt(J)} ÷ ${fmt(dt)} = ${fmt(F)} N`,
          traps: [
            ...both(
              m * v * dt,
              mis(
                "force-impulse-confusion",
                L("MULTIPLIED BY TIME", "คูณด้วยเวลา"),
                L("J = F × Δt, so to get the force you divide:\nF = J ÷ Δt", "J = F × Δt ดังนั้นการหาแรงต้องหาร:\nF = J ÷ Δt"),
              ),
            ),
            ...both(
              m * v,
              mis(
                "force-impulse-confusion",
                L("THAT'S STILL THE IMPULSE", "นั่นยังเป็นการดลอยู่"),
                L("Impulse and force are different quantities.\n\nDivide the impulse by the stopping time:\nF = J ÷ Δt", "การดลกับแรงเป็นปริมาณคนละตัว\n\nนำการดลหารด้วยเวลาที่ใช้หยุด:\nF = J ÷ Δt"),
              ),
            ),
          ],
        }),
      ],
    };
  },
};

export const MATERIALS = [
  { id: "plate", icon: "shield", label: "Titanium plate", th: "แผ่นไทเทเนียม", dt: 0.05, cost: 5 },
  { id: "rubber", icon: "disc", label: "Rubber bumper", th: "กันชนยาง", dt: 0.2, cost: 20 },
  { id: "foam", icon: "foam", label: "Crush foam", th: "โฟมซับแรง", dt: 0.5, cost: 40 },
  { id: "airbag", icon: "balloon", label: "Airbag", th: "ถุงลมนิรภัย", dt: 1, cost: 80 },
] as const;

const crashTest: MissionDef = {
  id: "crash-test",
  chapter: 2,
  title: "Crash Test",
  icon: "flask",
  tagline: "More time, less force",
  skills: ["force-time", "impulse"],
  baseTime: 240,
  baseXp: 150,
  build(rng, _tier, lang) {
    const L = pick(lang);
    const m = rng.pick([400, 500, 800, 1000, 1200]);
    const v = rng.pick([4, 5, 6, 8, 10]);
    const p = m * v;
    const k = rng.pick([1, 2, 3]);
    const fMax = k === 1 ? 10 * p : k === 2 ? 3 * p : 1.5 * p;
    const best = MATERIALS[k];
    const force = (dt: number) => r2(p / dt);
    return {
      story:
        L("A supply lander will hit the docking buffer and must be brought to rest. Pick the lightest buffer material that keeps the impact force within the hull limit.", "ยานลงจอดขนเสบียงจะชนแผ่นกันกระแทกของท่าเทียบและต้องหยุดนิ่ง จงเลือกวัสดุกันกระแทกที่เบาที่สุดที่ทำให้แรงกระแทกไม่เกินขีดจำกัดของตัวยาน"),
      givens: [
        { label: L("Lander mass", "มวลยานลงจอด"), value: `${fmt(m)} kg` },
        { label: L("Impact speed", "อัตราเร็วตอนชน"), value: `${fmt(v)} m/s` },
        { label: L("Hull force limit", "แรงสูงสุดที่ตัวยานรับได้"), value: `${fmt(fMax)} N` },
        { label: L("Goal", "เป้าหมาย"), value: L("lightest safe material", "วัสดุที่ปลอดภัยและเบาที่สุด") },
      ],
      scene: {
        backdrop: "pad",
        bodies: [{ art: "satellite", name: L("Lander", "ยานลงจอด"), m, v }],
        after: { v: [0], merged: false },
      },
      meta: { m, v, fMax, k },
      steps: [
        choice({
          id: "material",
          skill: "force-time",
          assess: "analysis",
          title: L("BUFFER MATERIAL", "วัสดุกันกระแทก"),
          prompt: L("Which material should line the docking buffer?", "ควรใช้วัสดุใดบุแผ่นกันกระแทกของท่าเทียบ"),
          formula: "F = Δp ÷ Δt",
          hints: [
            L("Every material removes the same momentum. What changes is how long the stop takes.", "วัสดุทุกชนิดลดโมเมนตัมลงเท่ากัน สิ่งที่ต่างคือเวลาที่ใช้ในการหยุด"),
            L("F = Δp ÷ Δt. A longer collision time means a smaller force. Find the force for each material.", "F = Δp ÷ Δt ช่วงเวลาที่ชนนานขึ้นทำให้แรงน้อยลง ลองหาแรงของวัสดุแต่ละชนิด"),
            L(`Δp = ${fmt(m)} × ${fmt(v)}. Divide by each Δt and keep the lightest one under ${fmt(fMax)} N.`, `Δp = ${fmt(m)} × ${fmt(v)} นำไปหารด้วย Δt ของแต่ละชนิด แล้วเลือกชนิดที่เบาที่สุดที่แรงไม่เกิน ${fmt(fMax)} N`),
          ],
          scaffold: [
            `1▸ Δp = m × v = ${fmt(p)} kg·m/s`,
            L("2▸ For each material: F = Δp ÷ Δt", "2▸ วัสดุแต่ละชนิด: F = Δp ÷ Δt"),
            L(`3▸ Reject any with F > ${fmt(fMax)} N`, `3▸ ตัดชนิดที่ F > ${fmt(fMax)} N ออก`),
            L("4▸ Of the safe ones, take the lightest", "4▸ ในกลุ่มที่ปลอดภัย เลือกชนิดที่เบาที่สุด"),
          ],
          explain: L(`${best.label}: F = ${fmt(p)} ÷ ${best.dt} = ${fmt(force(best.dt))} N ≤ ${fmt(fMax)} N, and every lighter option exceeds the limit.`, `${best.th}: F = ${fmt(p)} ÷ ${best.dt} = ${fmt(force(best.dt))} N ≤ ${fmt(fMax)} N และวัสดุที่เบากว่านี้ทุกชนิดเกินขีดจำกัด`),
          options: MATERIALS.map((mat, i) => ({
            id: mat.id,
            icon: mat.icon,
            label: L(mat.label, mat.th),
            detail: L(`stops in ${mat.dt} s · ${mat.cost} kg`, `หยุดใน ${mat.dt} s · ${mat.cost} kg`),
            correct: i === k,
            m:
              i < k
                ? mis(
                    "time-force-tradeoff",
                    L("IMPACT FORCE TOO HIGH", "แรงกระแทกสูงเกินไป"),
                    L(`With the ${mat.label.toLowerCase()} the lander stops in ${mat.dt} s:\nF = ${fmt(p)} ÷ ${mat.dt} = ${fmt(force(mat.dt))} N\n\nThat exceeds the ${fmt(fMax)} N limit. A longer collision time lowers the force.`, `เมื่อใช้${mat.th} ยานจะหยุดใน ${mat.dt} s:\nF = ${fmt(p)} ÷ ${mat.dt} = ${fmt(force(mat.dt))} N\n\nเกินขีดจำกัด ${fmt(fMax)} N ช่วงเวลาที่ชนนานขึ้นจะทำให้แรงลดลง`),
                  )
                : i > k
                  ? mis(
                      "over-engineered",
                      L("SAFE, BUT TOO HEAVY", "ปลอดภัย แต่หนักเกินไป"),
                      L(`The ${mat.label.toLowerCase()} keeps the force at ${fmt(force(mat.dt))} N — safe, but it costs ${mat.cost} kg of payload.\n\nA lighter material also stays under ${fmt(fMax)} N.`, `${mat.th}ทำให้แรงเหลือ ${fmt(force(mat.dt))} N ซึ่งปลอดภัย แต่ต้องเสียน้ำหนักบรรทุกไป ${mat.cost} kg\n\nมีวัสดุที่เบากว่าและแรงยังไม่เกิน ${fmt(fMax)} N`),
                    )
                  : undefined,
          })),
        }),
        numeric({
          id: "F",
          skill: "impulse",
          assess: "application",
          title: L("IMPACT FORCE", "แรงกระแทก"),
          prompt: L(`With the ${best.label.toLowerCase()} (${best.dt} s), what is the average impact force?`, `เมื่อใช้${best.th} (${best.dt} s) แรงกระแทกเฉลี่ยมีค่าเท่าไร`),
          label: "F",
          unit: U.F,
          answer: force(best.dt),
          formula: "F = Δp ÷ Δt",
          hints: [
            L("The lander loses all of its momentum during the stop.", "ยานลงจอดสูญเสียโมเมนตัมทั้งหมดระหว่างการหยุด"),
            L("F = Δp ÷ Δt, with Δp = m × v.", "F = Δp ÷ Δt โดย Δp = m × v"),
            L(`Set it up: F = (${fmt(m)} × ${fmt(v)}) ÷ ${best.dt}.`, `ตั้งสมการ: F = (${fmt(m)} × ${fmt(v)}) ÷ ${best.dt}`),
          ],
          scaffold: [`1▸ Δp = ${fmt(m)} × ${fmt(v)}`, `2▸ Δt = ${best.dt} s`, "3▸ F = Δp ÷ Δt"],
          explain: `F = ${fmt(p)} ÷ ${best.dt} = ${fmt(force(best.dt))} N`,
          traps: [
            {
              value: p * best.dt,
              m: mis(
                "force-impulse-confusion",
                L("MULTIPLIED BY TIME", "คูณด้วยเวลา"),
                L("Δp × Δt is not a force.\n\nSpread the momentum change over the stopping time:\nF = Δp ÷ Δt", "Δp × Δt ไม่ใช่แรง\n\nให้กระจายโมเมนตัมที่เปลี่ยนไปตลอดช่วงเวลาที่ใช้หยุด:\nF = Δp ÷ Δt"),
              ),
            },
            {
              value: p,
              m: mis(
                "force-impulse-confusion",
                L("THAT'S THE MOMENTUM CHANGE", "นั่นคือโมเมนตัมที่เปลี่ยนไป"),
                L("m × v is the impulse the buffer must absorb.\n\nDivide by the stopping time to get the force.", "m × v คือการดลที่แผ่นกันกระแทกต้องรับ\n\nหารด้วยเวลาที่ใช้หยุดจึงจะได้แรง"),
              ),
            },
          ],
        }),
      ],
    };
  },
};

const burnWindow: MissionDef = {
  id: "burn-window",
  chapter: 2,
  title: "Burn Window",
  icon: "flame",
  tagline: "Impulse changes velocity",
  skills: ["impulse", "vector"],
  baseTime: 210,
  baseXp: 150,
  build(rng, tier, lang) {
    const L = pick(lang);
    const retro = tier > 0 && rng.chance(0.5);
    const sign = retro ? -1 : 1;
    const [m, F, dt, vi] = draw(
      () => [
        rng.pick([500, 1000, 2000]),
        rng.pick([1000, 2000, 4000, 5000]),
        rng.pick([2, 3, 4, 5, 6]),
        rng.pick([4, 6, 8, 10, 12]),
      ],
      ([a, f, t, u]) => {
        const vf = u + (sign * f * t) / a;
        return isDp(vf, 1) && (tier === 2 ? Math.abs(vf) >= 1 : vf >= 1);
      },
      [1000, 2000, 3, 8],
    );
    const J = sign * F * dt;
    const vf = r2(vi + J / m);
    return {
      story: retro
        ? L("A probe is overshooting its rendezvous. It fires its engine against the direction of travel for a short burn.", "ยานสำรวจกำลังจะเลยจุดนัดพบ จึงจุดเครื่องยนต์สวนทิศการเคลื่อนที่ในช่วงสั้น ๆ")
        : L("A probe is falling behind its rendezvous. It fires its engine along the direction of travel for a short burn.", "ยานสำรวจกำลังตามจุดนัดพบไม่ทัน จึงจุดเครื่องยนต์ตามทิศการเคลื่อนที่ในช่วงสั้น ๆ"),
      givens: [
        { label: L("Probe mass", "มวลยานสำรวจ"), value: `${fmt(m)} kg` },
        { label: L("Velocity before", "ความเร็วก่อนจุดเครื่องยนต์"), value: `${fmt(vi)} m/s →` },
        { label: L("Thrust", "แรงขับ"), value: `${fmt(F)} N ${retro ? "←" : "→"}` },
        { label: L("Burn time", "เวลาจุดเครื่องยนต์"), value: `${fmt(dt)} s` },
        { label: L("Sign rule", "กติกาเครื่องหมาย"), value: L("→ positive, ← negative", "→ เป็นบวก, ← เป็นลบ") },
      ],
      scene: {
        backdrop: "orbit",
        bodies: [{ art: "satellite", name: L("Probe", "ยานสำรวจ"), m, v: vi }],
        after: { v: [vf], merged: false },
      },
      meta: { m, F: sign * F, dt, vi },
      steps: [
        numeric({
          id: "J",
          skill: "impulse",
          assess: "application",
          title: L("BURN IMPULSE", "การดลจากเครื่องยนต์"),
          prompt: L("What impulse does the burn deliver? Include the sign.", "การจุดเครื่องยนต์ครั้งนี้ให้การดลเท่าไร ใส่เครื่องหมายด้วย"),
          label: "J",
          unit: U.J,
          answer: J,
          signed: true,
          formula: "J = F × Δt",
          hints: [
            L("Impulse is force multiplied by the time it acts. Its direction is the force's direction.", "การดลคือแรงคูณกับเวลาที่แรงกระทำ ทิศของการดลคือทิศของแรง"),
            L(`J = F × Δt. The thrust points ${retro ? "left, so F is negative" : "right, so F is positive"}.`, `J = F × Δt แรงขับชี้ไปทาง${retro ? "ซ้าย F จึงเป็นลบ" : "ขวา F จึงเป็นบวก"}`),
            L(`Set it up: J = ${retro ? "−" : ""}${fmt(F)} × ${fmt(dt)}.`, `ตั้งสมการ: J = ${retro ? "−" : ""}${fmt(F)} × ${fmt(dt)}`),
          ],
          scaffold: [
            `1▸ F = ${retro ? "−" : "+"}${fmt(F)} N`,
            `2▸ Δt = ${fmt(dt)} s`,
            "3▸ J = F × Δt",
          ],
          explain: `J = ${fmt(sign * F)} × ${fmt(dt)} = ${fmt(J)} N·s`,
          traps: both(
            F / dt,
            mis(
              "force-impulse-confusion",
              L("DIVIDED INSTEAD OF MULTIPLIED", "หารแทนที่จะคูณ"),
              L("Impulse is force × time:\nJ = F × Δt", "การดลคือแรง × เวลา:\nJ = F × Δt"),
            ),
          ),
        }),
        numeric({
          id: "vf",
          skill: "impulse",
          assess: "application",
          title: L("NEW VELOCITY", "ความเร็วใหม่"),
          prompt: L("What is the probe's velocity after the burn? Include the sign.", "หลังจุดเครื่องยนต์ ยานสำรวจมีความเร็วเท่าไร ใส่เครื่องหมายด้วย"),
          label: "v_f",
          unit: U.v,
          answer: vf,
          signed: true,
          formula: "J = m × (v_f − v_i) → v_f = v_i + J ÷ m",
          hints: [
            L("Impulse changes momentum, and momentum is mass × velocity.", "การดลทำให้โมเมนตัมเปลี่ยน และโมเมนตัมคือมวล × ความเร็ว"),
            L("Δv = J ÷ m. Then add the change to the velocity the probe already had.", "Δv = J ÷ m แล้วนำส่วนที่เปลี่ยนไปบวกกับความเร็วเดิมของยาน"),
            L(`Set it up: v_f = ${fmt(vi)} + (${fmt(J)} ÷ ${fmt(m)}).`, `ตั้งสมการ: v_f = ${fmt(vi)} + (${fmt(J)} ÷ ${fmt(m)})`),
          ],
          scaffold: [
            `1▸ Δv = J ÷ m = ${fmt(J)} ÷ ${fmt(m)}`,
            `2▸ v_f = v_i + Δv = ${fmt(vi)} + Δv`,
            L("3▸ Keep the signs", "3▸ คงเครื่องหมายไว้"),
          ],
          explain: `v_f = ${fmt(vi)} + (${fmt(J)} ÷ ${fmt(m)}) = ${fmt(vf)} m/s`,
          traps: [
            ...both(
              J / m,
              mis(
                "forgot-initial-velocity",
                L("THAT'S ONLY THE CHANGE", "นั่นเป็นแค่ส่วนที่เปลี่ยนไป"),
                L("J ÷ m is Δv, the change in velocity.\n\nAdd it to what the probe already had:\nv_f = v_i + J ÷ m", "J ÷ m คือ Δv หรือความเร็วที่เปลี่ยนไป\n\nนำไปบวกกับความเร็วเดิมของยาน:\nv_f = v_i + J ÷ m"),
              ),
            ),
            {
              value: vi + J,
              m: mis(
                "impulse-momentum-confusion",
                L("FORGOT TO DIVIDE BY MASS", "ลืมหารด้วยมวล"),
                L("Impulse changes momentum, not velocity directly.\n\nΔv = J ÷ m", "การดลเปลี่ยนโมเมนตัม ไม่ได้เปลี่ยนความเร็วโดยตรง\n\nΔv = J ÷ m"),
              ),
            },
            ...(retro
              ? [
                  {
                    value: vi + Math.abs(J) / m,
                    m: mis(
                      "vector-neglect",
                      L("RETRO-BURN OPPOSES MOTION", "แรงขับถอยหลังสวนทางการเคลื่อนที่"),
                      L("The thrust points left, so the impulse is negative and the probe slows down.", "แรงขับชี้ไปทางซ้าย การดลจึงเป็นลบและยานสำรวจช้าลง"),
                    ),
                  },
                ]
              : []),
          ],
        }),
      ],
    };
  },
};

export const MISSIONS_A: MissionDef[] = [
  cargoCheck,
  heavyOrFast,
  oppositeLanes,
  tugAssist,
  orbitalRescue,
  fullStop,
  crashTest,
  burnWindow,
];
