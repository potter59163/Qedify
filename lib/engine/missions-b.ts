import { U, choice, draw, fmt, isDp, mis, numeric, r2, sfmt } from "./build";
import { pick } from "./lang";
import type { MissionDef, Step, Trap } from "./types";

const both = (value: number, m: Trap["m"]): Trap[] => [
  { value, m },
  { value: -value, m },
];

const ke = (m: number, v: number) => 0.5 * m * v * v;

/** Mass pairs whose elastic results come out to at most two decimals for many speeds. */
const ELASTIC_PAIRS: [number, number][] = [
  [1000, 1000],
  [1500, 500],
  [500, 1500],
  [2000, 1000],
  [1000, 2000],
  [3000, 1000],
  [1500, 1000],
  [1000, 1500],
  [2500, 1500],
];

// ───────────────────────── Chapter 3 · Conservation Laws ─────────────────────────

const theJunction: MissionDef = {
  id: "the-junction",
  chapter: 3,
  title: "The Junction",
  icon: "pod",
  tagline: "Couple and move together",
  skills: ["conservation"],
  baseTime: 200,
  baseXp: 180,
  build(rng, tier, lang) {
    const L = pick(lang);
    const ms = [500, 1000, 1500, 2000, 2500, 3000];
    const [m1, m2, v1] = draw(
      () => [rng.pick(ms), rng.pick(ms), rng.pick([2, 3, 4, 5, 6, 8, 9, 10, 12])],
      ([a, b, c]) => isDp((a * c) / (a + b), 2),
      [1500, 1000, 8],
    );
    const p = m1 * v1;
    const M = m1 + m2;
    const vf = r2(p / M);
    const steps: Step[] = [];
    if (tier === 0) {
      steps.push(
        numeric({
          id: "p",
          skill: "conservation",
          assess: "application",
          title: L("MOMENTUM BEFORE", "โมเมนตัมก่อนชน"),
          prompt: L("What is the total momentum of the two pods before they couple?", "ก่อนเชื่อมต่อกัน โมเมนตัมรวมของแคปซูลทั้งสองมีค่าเท่าไร"),
          label: "p_before",
          unit: U.p,
          answer: p,
          formula: "p_before = m1 × v1 + m2 × v2",
          hints: [
            L("Add the momentum of every body in the system. One of them is not moving.", "นำโมเมนตัมของวัตถุทุกชิ้นในระบบมาบวกกัน มีชิ้นหนึ่งที่ไม่ได้เคลื่อนที่"),
            L("Pod B is at rest, so it contributes zero. p_before = m1 × v1.", "แคปซูล B อยู่นิ่ง จึงมีโมเมนตัมเป็นศูนย์ p_before = m1 × v1"),
            L(`Set it up: p_before = ${fmt(m1)} × ${fmt(v1)} + ${fmt(m2)} × 0.`, `ตั้งสมการ: p_before = ${fmt(m1)} × ${fmt(v1)} + ${fmt(m2)} × 0`),
          ],
          scaffold: [`1▸ p_A = ${fmt(m1)} × ${fmt(v1)}`, L("2▸ p_B = 0 (at rest)", "2▸ p_B = 0 (อยู่นิ่ง)"), "3▸ p_before = p_A + p_B"],
          explain: `p_before = ${fmt(m1)} × ${fmt(v1)} + 0 = ${fmt(p)} kg·m/s`,
          traps: [
            {
              value: M * v1,
              m: mis(
                "system-momentum",
                L("POD B ISN'T MOVING YET", "แคปซูล B ยังไม่เคลื่อนที่"),
                L("Before coupling only pod A moves.\n\nPod B is at rest, so it adds no momentum.", "ก่อนเชื่อมต่อ มีแต่แคปซูล A ที่เคลื่อนที่\n\nแคปซูล B อยู่นิ่ง จึงไม่มีโมเมนตัมมาเพิ่ม"),
              ),
            },
          ],
        }),
      );
    }
    steps.push(
      numeric({
        id: "vf",
        skill: "conservation",
        assess: "application",
        title: L("COUPLED SPEED", "อัตราเร็วหลังเชื่อมต่อ"),
        prompt: L("The pods lock together. What is their common velocity afterwards?", "แคปซูลทั้งสองล็อกติดกัน หลังจากนั้นมีความเร็วร่วมกันเท่าไร"),
        label: "v_f",
        unit: U.v,
        answer: vf,
        formula: "m1 × v1 + m2 × v2 = (m1 + m2) × v_f",
        hints: [
          L("No outside force acts along the rail, so the total momentum is the same before and after.", "ไม่มีแรงภายนอกกระทำตามแนวราง โมเมนตัมรวมก่อนและหลังจึงเท่ากัน"),
          L("After coupling, one combined body of mass m1 + m2 carries all the momentum: v_f = p_total ÷ (m1 + m2).", "หลังเชื่อมต่อ วัตถุรวมมวล m1 + m2 เป็นผู้ถือโมเมนตัมทั้งหมด: v_f = p_total ÷ (m1 + m2)"),
          L(`Set it up: v_f = ${fmt(p)} ÷ (${fmt(m1)} + ${fmt(m2)}).`, `ตั้งสมการ: v_f = ${fmt(p)} ÷ (${fmt(m1)} + ${fmt(m2)})`),
        ],
        scaffold: [
          `1▸ p_before = ${fmt(m1)} × ${fmt(v1)} = ${fmt(p)}`,
          L("2▸ Momentum is conserved: p_before = p_after", "2▸ โมเมนตัมอนุรักษ์: p_before = p_after"),
          "3▸ p_after = (m1 + m2) × v_f",
          `4▸ v_f = ${fmt(p)} ÷ ${fmt(M)}`,
        ],
        explain: `v_f = ${fmt(p)} ÷ ${fmt(M)} = ${fmt(vf)} m/s`,
        traps: [
          {
            value: p / m2,
            m: mis(
              "wrong-denominator",
              L("WRONG DENOMINATOR", "ตัวหารผิด"),
              L("You divided by one pod's mass.\n\nAfter coupling both pods move together:\nv_f = p_total ÷ (m1 + m2)", "คุณหารด้วยมวลของแคปซูลเพียงชิ้นเดียว\n\nหลังเชื่อมต่อ ทั้งสองชิ้นเคลื่อนที่ไปด้วยกัน:\nv_f = p_total ÷ (m1 + m2)"),
            ),
          },
          {
            value: v1,
            m: mis(
              "system-momentum",
              L("SPEED CAN'T STAY THE SAME", "อัตราเร็วจะเท่าเดิมไม่ได้"),
              L("The moving pod now drags extra mass.\n\nSame momentum, more mass → the speed must drop.", "แคปซูลที่เคลื่อนที่ต้องลากมวลเพิ่มไปด้วย\n\nโมเมนตัมเท่าเดิม มวลมากขึ้น → อัตราเร็วต้องลดลง"),
            ),
          },
          {
            value: (2 * m1 * v1) / M,
            m: mis(
              "wrong-collision-formula",
              L("WRONG COLLISION FORMULA", "ใช้สูตรการชนผิดแบบ"),
              L("That is the elastic (bounce-apart) result.\n\nThese pods stick together — a perfectly inelastic collision:\nv_f = p_total ÷ (m1 + m2)", "นั่นคือผลของการชนแบบยืดหยุ่น (ชนแล้วแยกกัน)\n\nแคปซูลคู่นี้ติดกัน เป็นการชนแบบไม่ยืดหยุ่นสมบูรณ์:\nv_f = p_total ÷ (m1 + m2)"),
            ),
          },
          {
            value: v1 / 2,
            m: mis(
              "wrong-denominator",
              L("NOT A SIMPLE AVERAGE", "ไม่ใช่ค่าเฉลี่ยธรรมดา"),
              L("Averaging the speeds only works when the masses are equal.\n\nUse v_f = p_total ÷ (m1 + m2).", "การเฉลี่ยอัตราเร็วใช้ได้เฉพาะเมื่อมวลเท่ากัน\n\nใช้ v_f = p_total ÷ (m1 + m2)"),
            ),
          },
        ],
      }),
    );
    return {
      story:
        L("At the orbital rail junction a moving cargo pod must couple with a parked one. The clamps lock on contact, so both leave together.", "ที่ชุมทางรางโคจร แคปซูลสินค้าที่กำลังเคลื่อนที่ต้องเชื่อมต่อกับแคปซูลที่จอดอยู่ ตัวล็อกจะล็อกทันทีที่สัมผัสกัน ทั้งสองจึงเคลื่อนที่ออกไปด้วยกัน"),
      givens: [
        { label: L("Pod A", "แคปซูล A"), value: L(`${fmt(m1)} kg at ${fmt(v1)} m/s →`, `${fmt(m1)} kg ที่ ${fmt(v1)} m/s →`) },
        { label: L("Pod B", "แคปซูล B"), value: L(`${fmt(m2)} kg at rest`, `${fmt(m2)} kg อยู่นิ่ง`) },
        { label: L("Collision", "การชน"), value: L("pods lock together", "แคปซูลล็อกติดกัน") },
      ],
      scene: {
        backdrop: "dock",
        bodies: [
          { art: "pod", name: "A", m: m1, v: v1 },
          { art: "pod", name: "B", m: m2, v: 0 },
        ],
        after: { v: [vf, vf], merged: true },
      },
      meta: { m1, v1, m2, v2: 0 },
      steps,
    };
  },
};

const recoil: MissionDef = {
  id: "recoil",
  chapter: 3,
  title: "Recoil",
  icon: "astronaut",
  tagline: "Push off, drift back",
  skills: ["conservation", "vector"],
  baseTime: 200,
  baseXp: 180,
  build(rng, _tier, lang) {
    const L = pick(lang);
    const [m1, m2, v2] = draw(
      () => [rng.pick([80, 100, 120, 150, 160]), rng.pick([4, 5, 8, 10, 12, 15, 20]), rng.pick([4, 5, 6, 8, 10, 12])],
      ([a, b, c]) => isDp((b * c) / a, 2),
      [100, 10, 8],
    );
    const pTool = m2 * v2;
    const v1 = r2(-pTool / m1);
    return {
      story:
        L("An astronaut floats motionless beside the hull, out of reach of the handrail. Their only option: throw the toolkit away from the ship.", "นักบินอวกาศลอยนิ่งอยู่ข้างตัวยาน เอื้อมไม่ถึงราวจับ ทางเดียวที่เหลือคือขว้างกล่องเครื่องมือออกไปจากยาน"),
      givens: [
        { label: L("Astronaut", "นักบินอวกาศ"), value: L(`${fmt(m1)} kg at rest`, `${fmt(m1)} kg อยู่นิ่ง`) },
        { label: L("Toolkit", "กล่องเครื่องมือ"), value: L(`${fmt(m2)} kg, thrown at ${fmt(v2)} m/s →`, `${fmt(m2)} kg ขว้างออกไปที่ ${fmt(v2)} m/s →`) },
        { label: L("Sign rule", "กติกาเครื่องหมาย"), value: L("→ positive, ← negative", "→ เป็นบวก, ← เป็นลบ") },
      ],
      scene: {
        backdrop: "orbit",
        bodies: [
          { art: "astronaut", name: L("Astronaut", "นักบินอวกาศ"), m: m1, v: 0 },
          { art: "toolkit", name: L("Toolkit", "กล่องเครื่องมือ"), m: m2, v: 0 },
        ],
        after: { v: [v1, v2], merged: false },
      },
      meta: { m1, m2, v2 },
      steps: [
        choice({
          id: "system",
          skill: "conservation",
          assess: "analysis",
          title: L("SYSTEM CHECK", "ตรวจระบบ"),
          prompt: L("Right after the throw, what is the total momentum of astronaut + toolkit?", "ทันทีหลังขว้าง โมเมนตัมรวมของนักบินอวกาศ + กล่องเครื่องมือมีค่าเท่าไร"),
          formula: "p_before = p_after",
          hints: [
            L("What was the total momentum before the throw, when both were at rest?", "ก่อนขว้าง ตอนที่ทั้งคู่อยู่นิ่ง โมเมนตัมรวมมีค่าเท่าไร"),
            L("No outside force acts on the pair, so the total cannot change.", "ไม่มีแรงภายนอกกระทำต่อทั้งคู่ โมเมนตัมรวมจึงเปลี่ยนไม่ได้"),
            L("Before: 0. After: the same. The toolkit's momentum must be balanced by the astronaut's.", "ก่อน: 0 หลัง: เท่าเดิม โมเมนตัมของกล่องเครื่องมือต้องถูกหักล้างด้วยโมเมนตัมของนักบินอวกาศ"),
          ],
          scaffold: [L("1▸ Before: both at rest → p = 0", "1▸ ก่อน: ทั้งคู่อยู่นิ่ง → p = 0"), L("2▸ No external force on the pair", "2▸ ไม่มีแรงภายนอกกระทำต่อทั้งคู่"), L("3▸ After: p_total is still 0", "3▸ หลัง: p_total ยังเป็น 0")],
          explain: L("Both started at rest, so the total momentum stays zero: the two momenta are equal and opposite.", "ทั้งคู่เริ่มจากอยู่นิ่ง โมเมนตัมรวมจึงยังเป็นศูนย์: โมเมนตัมทั้งสองมีขนาดเท่ากันและทิศตรงข้ามกัน"),
          options: [
            { id: "zero", icon: "zero", label: L("Zero", "ศูนย์"), detail: L("the two momenta cancel", "โมเมนตัมทั้งสองหักล้างกัน"), correct: true },
            {
              id: "tool",
              icon: "box",
              label: `${fmt(pTool)} kg·m/s →`,
              detail: L("the toolkit's momentum", "โมเมนตัมของกล่องเครื่องมือ"),
              correct: false,
              m: mis(
                "system-momentum",
                L("THE SYSTEM STARTED AT REST", "ระบบเริ่มจากอยู่นิ่ง"),
                L("That is the toolkit alone.\n\nNo outside force acts on astronaut + toolkit, so their total stays what it was before the throw: zero.", "นั่นคือโมเมนตัมของกล่องเครื่องมืออย่างเดียว\n\nไม่มีแรงภายนอกกระทำต่อนักบินอวกาศ + กล่องเครื่องมือ โมเมนตัมรวมจึงเท่ากับก่อนขว้าง คือศูนย์"),
              ),
            },
            {
              id: "depends",
              icon: "question",
              label: L("It depends on the throw", "ขึ้นอยู่กับแรงที่ขว้าง"),
              detail: L("harder throw, more total", "ขว้างแรงขึ้น โมเมนตัมรวมมากขึ้น"),
              correct: false,
              m: mis(
                "system-momentum",
                L("THE TOTAL NEVER CHANGES", "โมเมนตัมรวมไม่เคยเปลี่ยน"),
                L("A harder throw gives both more momentum — in opposite directions.\n\nThe total stays exactly zero.", "ขว้างแรงขึ้น ทั้งคู่ได้โมเมนตัมมากขึ้น แต่ในทิศตรงข้ามกัน\n\nโมเมนตัมรวมยังเป็นศูนย์พอดี"),
              ),
            },
          ],
        }),
        numeric({
          id: "v1",
          skill: "conservation",
          assess: "application",
          title: L("RECOIL VELOCITY", "ความเร็วถอยหลัง"),
          prompt: L("What is the astronaut's velocity after the throw? Include the sign.", "หลังขว้าง นักบินอวกาศมีความเร็วเท่าไร ใส่เครื่องหมายด้วย"),
          label: "v_astronaut",
          unit: U.v,
          answer: v1,
          signed: true,
          formula: "0 = m1 × v1 + m2 × v2",
          hints: [
            L("The astronaut must carry momentum equal and opposite to the toolkit's.", "นักบินอวกาศต้องมีโมเมนตัมขนาดเท่ากับของกล่องเครื่องมือ แต่ทิศตรงข้าม"),
            L("m1 × v1 = −(m2 × v2). Solve for v1 — it will be negative (leftward).", "m1 × v1 = −(m2 × v2) แก้หา v1 ซึ่งจะเป็นลบ (ไปทางซ้าย)"),
            L(`Set it up: v1 = −(${fmt(m2)} × ${fmt(v2)}) ÷ ${fmt(m1)}.`, `ตั้งสมการ: v1 = −(${fmt(m2)} × ${fmt(v2)}) ÷ ${fmt(m1)}`),
          ],
          scaffold: [
            `1▸ p_toolkit = ${fmt(m2)} × ${fmt(v2)}`,
            "2▸ p_astronaut = −p_toolkit",
            `3▸ v1 = p_astronaut ÷ ${fmt(m1)}`,
          ],
          explain: L(`v1 = −(${fmt(m2)} × ${fmt(v2)}) ÷ ${fmt(m1)} = ${fmt(v1)} m/s (drifting ←)`, `v1 = −(${fmt(m2)} × ${fmt(v2)}) ÷ ${fmt(m1)} = ${fmt(v1)} m/s (ลอยไปทาง ←)`),
          traps: [
            ...both(
              v2,
              mis(
                "wrong-denominator",
                L("NOT THE SAME SPEED", "อัตราเร็วไม่เท่ากัน"),
                L("The two get equal and opposite MOMENTUM, not velocity.\n\nThe astronaut is much heavier, so moves much slower.", "ทั้งคู่ได้ 'โมเมนตัม' ขนาดเท่ากันทิศตรงข้าม ไม่ใช่ความเร็วเท่ากัน\n\nนักบินอวกาศหนักกว่ามาก จึงเคลื่อนที่ช้ากว่ามาก"),
              ),
            ),
            ...both(
              pTool,
              mis(
                "wrong-denominator",
                L("THAT'S THE MOMENTUM", "นั่นคือโมเมนตัม"),
                L("You found the size of the astronaut's momentum.\n\nDivide by the astronaut's mass to get the velocity.", "คุณหาขนาดโมเมนตัมของนักบินอวกาศได้แล้ว\n\nหารด้วยมวลของนักบินอวกาศจึงจะได้ความเร็ว"),
              ),
            ),
            ...both(
              (m1 * v2) / m2,
              mis(
                "wrong-denominator",
                L("INVERTED MASS RATIO", "อัตราส่วนมวลกลับหัว"),
                L("The masses are the wrong way round.\n\nv1 = −(m2 × v2) ÷ m1", "ใส่มวลสลับที่กัน\n\nv1 = −(m2 × v2) ÷ m1"),
              ),
            ),
          ],
        }),
      ],
    };
  },
};

const headOn: MissionDef = {
  id: "head-on",
  chapter: 3,
  title: "Head-On Docking",
  icon: "burst",
  tagline: "Conservation with direction",
  skills: ["conservation", "vector"],
  baseTime: 220,
  baseXp: 190,
  build(rng, tier, lang) {
    const L = pick(lang);
    const ms = [500, 1000, 1500, 2000, 2500];
    const vs = [2, 3, 4, 5, 6, 8, 10];
    const [m1, v1, m2, v2] = draw(
      () => [rng.pick(ms), rng.pick(vs), rng.pick(ms), rng.pick(vs)],
      ([a, b, c, d]) => {
        const vf = (a * b - c * d) / (a + c);
        return isDp(vf, 2) && Math.abs(vf) >= 0.2;
      },
      [2000, 6, 1000, 3],
    );
    const pt = m1 * v1 - m2 * v2;
    const M = m1 + m2;
    const vf = r2(pt / M);
    const steps: Step[] = [];
    if (tier === 0) {
      steps.push(
        numeric({
          id: "p",
          skill: "vector",
          assess: "application",
          title: L("MOMENTUM BEFORE", "โมเมนตัมก่อนชน"),
          prompt: L("What is the total momentum before docking? Include the sign.", "ก่อนเทียบท่า โมเมนตัมรวมมีค่าเท่าไร ใส่เครื่องหมายด้วย"),
          label: "p_before",
          unit: U.p,
          answer: pt,
          signed: true,
          formula: "p_before = m1 × v1 + m2 × v2",
          hints: [
            L("The two craft move in opposite directions, so their momenta have opposite signs.", "ยานสองลำเคลื่อนที่สวนทางกัน โมเมนตัมจึงมีเครื่องหมายตรงข้ามกัน"),
            L("Craft B moves left: its velocity is negative.", "ยาน B เคลื่อนที่ไปทางซ้าย ความเร็วจึงเป็นลบ"),
            L(`Set it up: ${fmt(m1)} × ${fmt(v1)} + ${fmt(m2)} × (−${fmt(v2)}).`, `ตั้งสมการ: ${fmt(m1)} × ${fmt(v1)} + ${fmt(m2)} × (−${fmt(v2)})`),
          ],
          scaffold: [
            L(`1▸ p_A = ${fmt(m1)} × ${fmt(v1)} (positive)`, `1▸ p_A = ${fmt(m1)} × ${fmt(v1)} (เป็นบวก)`),
            L(`2▸ p_B = ${fmt(m2)} × (−${fmt(v2)}) (negative)`, `2▸ p_B = ${fmt(m2)} × (−${fmt(v2)}) (เป็นลบ)`),
            L("3▸ Add them", "3▸ บวกเข้าด้วยกัน"),
          ],
          explain: `p_before = ${fmt(m1 * v1)} − ${fmt(m2 * v2)} = ${sfmt(pt)} kg·m/s`,
          traps: both(
            m1 * v1 + m2 * v2,
            mis(
              "vector-neglect",
              L("VECTOR NEGLECT", "ลืมทิศของเวกเตอร์"),
              L("You added the sizes as if both craft moved the same way.\n\nB moves left, so its momentum is negative.", "คุณบวกขนาดเข้าด้วยกันราวกับยานทั้งสองลำไปทางเดียวกัน\n\nยาน B ไปทางซ้าย โมเมนตัมจึงเป็นลบ"),
            ),
          ),
        }),
      );
    }
    steps.push(
      numeric({
        id: "vf",
        skill: "conservation",
        assess: "application",
        title: L("DOCKED VELOCITY", "ความเร็วหลังเทียบท่า"),
        prompt: L("The craft lock together. What is their common velocity? Include the sign.", "ยานทั้งสองล็อกติดกัน ความเร็วร่วมมีค่าเท่าไร ใส่เครื่องหมายด้วย"),
        label: "v_f",
        unit: U.v,
        answer: vf,
        signed: true,
        formula: "m1 × v1 + m2 × v2 = (m1 + m2) × v_f",
        hints: [
          L("Total momentum before equals total momentum after. Direction matters.", "โมเมนตัมรวมก่อนชนเท่ากับโมเมนตัมรวมหลังชน และทิศทางมีความสำคัญ"),
          L("p_total = m1 × v1 − m2 × v2 (B moves left). Then v_f = p_total ÷ (m1 + m2).", "p_total = m1 × v1 − m2 × v2 (B ไปทางซ้าย) แล้ว v_f = p_total ÷ (m1 + m2)"),
          L(`Set it up: v_f = (${fmt(m1 * v1)} − ${fmt(m2 * v2)}) ÷ ${fmt(M)}.`, `ตั้งสมการ: v_f = (${fmt(m1 * v1)} − ${fmt(m2 * v2)}) ÷ ${fmt(M)}`),
        ],
        scaffold: [
          `1▸ p_A = +${fmt(m1 * v1)}, p_B = −${fmt(m2 * v2)}`,
          "2▸ p_total = p_A + p_B",
          `3▸ v_f = p_total ÷ ${fmt(M)}`,
          L("4▸ The sign of v_f tells the direction", "4▸ เครื่องหมายของ v_f บอกทิศทาง"),
        ],
        explain: `v_f = (${fmt(m1 * v1)} − ${fmt(m2 * v2)}) ÷ ${fmt(M)} = ${sfmt(vf)} m/s`,
        traps: [
          ...both(
            (m1 * v1 + m2 * v2) / M,
            mis(
              "vector-neglect",
              L("VECTOR NEGLECT", "ลืมทิศของเวกเตอร์"),
              L("You added the two momenta as if both craft moved the same way.\n\nB moves left: subtract its momentum.", "คุณบวกโมเมนตัมทั้งสองราวกับยานไปทางเดียวกัน\n\nยาน B ไปทางซ้าย ต้องลบโมเมนตัมของ B ออก"),
            ),
          ),
          ...both(
            pt,
            mis(
              "wrong-denominator",
              L("THAT'S THE TOTAL MOMENTUM", "นั่นคือโมเมนตัมรวม"),
              L("Good — now divide by the combined mass to get the velocity.\n\nv_f = p_total ÷ (m1 + m2)", "มาถูกทางแล้ว ต่อไปหารด้วยมวลรวมเพื่อหาความเร็ว\n\nv_f = p_total ÷ (m1 + m2)"),
            ),
          ),
          ...both(
            pt / m1,
            mis(
              "wrong-denominator",
              L("WRONG DENOMINATOR", "ตัวหารผิด"),
              L("After docking both craft move together.\n\nDivide by (m1 + m2), not by one mass.", "หลังเทียบท่า ยานทั้งสองเคลื่อนที่ไปด้วยกัน\n\nให้หารด้วย (m1 + m2) ไม่ใช่มวลของลำเดียว"),
            ),
          ),
        ],
      }),
    );
    return {
      story:
        L("Two rescue craft approach each other from opposite sides and must dock nose to nose. Mission control needs to know which way the joined pair will drift.", "ยานกู้ภัยสองลำเข้าหากันจากคนละฝั่งและต้องเทียบท่าแบบหัวชนหัว ศูนย์ควบคุมต้องรู้ว่าหลังต่อกันแล้วทั้งคู่จะลอยไปทางไหน"),
      givens: [
        { label: L("Craft A", "ยาน A"), value: L(`${fmt(m1)} kg at ${fmt(v1)} m/s →`, `${fmt(m1)} kg ที่ ${fmt(v1)} m/s →`) },
        { label: L("Craft B", "ยาน B"), value: L(`${fmt(m2)} kg at ${fmt(v2)} m/s ←`, `${fmt(m2)} kg ที่ ${fmt(v2)} m/s ←`) },
        { label: L("Sign rule", "กติกาเครื่องหมาย"), value: L("→ positive, ← negative", "→ เป็นบวก, ← เป็นลบ") },
      ],
      scene: {
        backdrop: "dock",
        bodies: [
          { art: "rocket", name: "A", m: m1, v: v1 },
          { art: "saucer", name: "B", m: m2, v: -v2 },
        ],
        after: { v: [vf, vf], merged: true },
      },
      meta: { m1, v1, m2, v2: -v2 },
      steps,
    };
  },
};

const massEjection: MissionDef = {
  id: "mass-ejection",
  chapter: 3,
  title: "Mass Ejection",
  icon: "wind",
  tagline: "Throw mass to move",
  skills: ["conservation", "vector"],
  baseTime: 220,
  baseXp: 190,
  build(rng, tier, lang) {
    const L = pick(lang);
    const [M, mf, u] = draw(
      () => [rng.pick([1100, 1200, 2100, 2200, 2500, 3000]), rng.pick([100, 200, 500]), rng.pick([20, 30, 40, 50, 60, 100])],
      ([a, b, c]) => isDp((b * c) / (a - b), 2),
      [1100, 100, 50],
    );
    const targetRight = tier === 0 || rng.chance(0.5);
    const toward = targetRight ? "→" : "←";
    const away = targetRight ? "←" : "→";
    const ship = M - mf;
    const v = r2((mf * u) / ship);
    return {
      story: L(`The main engine is dead and the ship hangs motionless. The stranded crew is to the ${targetRight ? "RIGHT" : "LEFT"}. The only way to move is to vent propellant.`, `เครื่องยนต์หลักดับและยานลอยนิ่งอยู่กับที่ ลูกเรือที่ติดค้างอยู่ทาง${targetRight ? "ขวา" : "ซ้าย"} ทางเดียวที่จะเคลื่อนที่ได้คือพ่นเชื้อเพลิงออกไป`),
      givens: [
        { label: L("Ship + propellant", "ยาน + เชื้อเพลิง"), value: L(`${fmt(M)} kg at rest`, `${fmt(M)} kg อยู่นิ่ง`) },
        { label: L("Propellant vented", "เชื้อเพลิงที่พ่นออก"), value: L(`${fmt(mf)} kg at ${fmt(u)} m/s`, `${fmt(mf)} kg ที่ ${fmt(u)} m/s`) },
        { label: L("Crew location", "ตำแหน่งลูกเรือ"), value: L(`${toward} ${targetRight ? "right" : "left"}`, `${toward} ${targetRight ? "ขวา" : "ซ้าย"}`) },
      ],
      scene: {
        backdrop: "orbit",
        bodies: [{ art: "rocket", name: L("Ship", "ยาน"), m: M, v: 0 }],
        after: { v: [targetRight ? v : -v], merged: false },
      },
      meta: { M, mf, u, dir: targetRight ? 1 : -1 },
      steps: [
        choice({
          id: "direction",
          skill: "vector",
          assess: "decision",
          title: L("VENT DIRECTION", "ทิศที่พ่น"),
          prompt: L("Which way should the propellant be vented?", "ควรพ่นเชื้อเพลิงออกไปทางใด"),
          formula: "0 = m_ship × v_ship + m_gas × v_gas",
          hints: [
            L("The ship starts at rest, so the total momentum must stay zero.", "ยานเริ่มจากอยู่นิ่ง โมเมนตัมรวมจึงต้องเป็นศูนย์ต่อไป"),
            L("Whatever momentum the gas carries one way, the ship gets the same amount the other way.", "แก๊สพาโมเมนตัมไปทางหนึ่งเท่าไร ยานก็ได้โมเมนตัมเท่านั้นในทางตรงข้าม"),
            L(`To move ${toward}, the gas must carry momentum ${away}.`, `ถ้าจะไปทาง ${toward} แก๊สต้องพาโมเมนตัมไปทาง ${away}`),
          ],
          scaffold: [L("1▸ Total momentum = 0 before and after", "1▸ โมเมนตัมรวม = 0 ทั้งก่อนและหลัง"), L("2▸ Ship and gas get opposite momenta", "2▸ ยานกับแก๊สได้โมเมนตัมทิศตรงข้ามกัน"), L("3▸ Vent opposite to where you want to go", "3▸ พ่นไปทางตรงข้ามกับทิศที่ต้องการไป")],
          explain: L(`Vent ${away}: the gas takes momentum ${away}, so the ship gains equal momentum ${toward}.`, `พ่นไปทาง ${away}: แก๊สพาโมเมนตัมไปทาง ${away} ยานจึงได้โมเมนตัมขนาดเท่ากันไปทาง ${toward}`),
          options: [
            {
              id: "away",
              icon: away === "←" ? "arrow-left" : "arrow-right",
              label: L(`Vent ${away === "←" ? "left" : "right"}`, `พ่นไปทาง${away === "←" ? "ซ้าย" : "ขวา"}`),
              detail: L("away from the crew", "ออกห่างจากลูกเรือ"),
              correct: true,
            },
            {
              id: "toward",
              icon: toward === "←" ? "arrow-left" : "arrow-right",
              label: L(`Vent ${toward === "←" ? "left" : "right"}`, `พ่นไปทาง${toward === "←" ? "ซ้าย" : "ขวา"}`),
              detail: L("toward the crew", "เข้าหาลูกเรือ"),
              correct: false,
              m: mis(
                "vector-neglect",
                L("WRONG WAY", "ผิดทาง"),
                L("Gas vented toward the crew pushes the ship AWAY from them.\n\nMomentum is conserved: throw mass opposite to where you want to go.", "แก๊สที่พ่นเข้าหาลูกเรือจะดันยานให้ 'ออกห่าง' จากพวกเขา\n\nโมเมนตัมอนุรักษ์: ต้องโยนมวลไปทางตรงข้ามกับทิศที่ต้องการไป"),
              ),
            },
            {
              id: "wait",
              icon: "hourglass",
              label: L("Don't vent — drift", "ไม่พ่น ปล่อยให้ลอยไป"),
              detail: L("save the propellant", "ประหยัดเชื้อเพลิง"),
              correct: false,
              m: mis(
                "system-momentum",
                L("NOTHING WILL HAPPEN", "จะไม่มีอะไรเกิดขึ้น"),
                L("The ship is at rest with zero momentum and no force acts on it.\n\nIt stays put until it throws some mass away.", "ยานอยู่นิ่ง มีโมเมนตัมเป็นศูนย์ และไม่มีแรงใดกระทำ\n\nยานจะอยู่ที่เดิมจนกว่าจะโยนมวลบางส่วนออกไป"),
              ),
            },
          ],
        }),
        numeric({
          id: "v",
          skill: "conservation",
          assess: "application",
          title: L("SHIP SPEED", "อัตราเร็วของยาน"),
          prompt: L("How fast does the ship move toward the crew afterwards?", "หลังจากนั้นยานเคลื่อนที่เข้าหาลูกเรือด้วยอัตราเร็วเท่าไร"),
          label: "v_ship",
          unit: U.v,
          answer: v,
          formula: "(M − m_gas) × v_ship = m_gas × v_gas",
          hints: [
            L("The ship's momentum equals the gas's momentum in size.", "โมเมนตัมของยานมีขนาดเท่ากับโมเมนตัมของแก๊ส"),
            L("After venting, the ship is lighter: its mass is M − m_gas.", "หลังพ่นแก๊ส ยานเบาลง มวลของยานคือ M − m_gas"),
            L(`Set it up: v_ship = (${fmt(mf)} × ${fmt(u)}) ÷ (${fmt(M)} − ${fmt(mf)}).`, `ตั้งสมการ: v_ship = (${fmt(mf)} × ${fmt(u)}) ÷ (${fmt(M)} − ${fmt(mf)})`),
          ],
          scaffold: [
            `1▸ p_gas = ${fmt(mf)} × ${fmt(u)}`,
            L(`2▸ Ship mass after venting = ${fmt(M)} − ${fmt(mf)}`, `2▸ มวลยานหลังพ่น = ${fmt(M)} − ${fmt(mf)}`),
            L("3▸ v_ship = p_gas ÷ (ship mass after)", "3▸ v_ship = p_gas ÷ (มวลยานหลังพ่น)"),
          ],
          explain: `v_ship = ${fmt(mf * u)} ÷ ${fmt(ship)} = ${fmt(v)} m/s`,
          traps: [
            {
              value: (mf * u) / M,
              m: mis(
                "wrong-denominator",
                L("THE SHIP GOT LIGHTER", "ยานเบาลงแล้ว"),
                L(`After venting, the ship's mass is ${fmt(M)} − ${fmt(mf)} = ${fmt(ship)} kg.\n\nDivide by that, not by the original mass.`, `หลังพ่นแก๊ส มวลของยานคือ ${fmt(M)} − ${fmt(mf)} = ${fmt(ship)} kg\n\nให้หารด้วยค่านี้ ไม่ใช่มวลตั้งต้น`),
              ),
            },
            {
              value: mf * u,
              m: mis(
                "wrong-denominator",
                L("THAT'S THE MOMENTUM", "นั่นคือโมเมนตัม"),
                L("You found the momentum the ship gains.\n\nDivide by the ship's remaining mass to get its speed.", "คุณหาโมเมนตัมที่ยานได้รับแล้ว\n\nหารด้วยมวลที่เหลือของยานจึงจะได้อัตราเร็ว"),
              ),
            },
            {
              value: u,
              m: mis(
                "wrong-denominator",
                L("NOT THE SAME SPEED", "อัตราเร็วไม่เท่ากัน"),
                L("Ship and gas get equal MOMENTUM, not equal speed.\n\nThe ship is far heavier, so it moves far slower.", "ยานกับแก๊สได้ 'โมเมนตัม' เท่ากัน ไม่ใช่อัตราเร็วเท่ากัน\n\nยานหนักกว่ามาก จึงเคลื่อนที่ช้ากว่ามาก"),
              ),
            },
          ],
        }),
      ],
    };
  },
};

// ───────────────────────── Chapter 4 · Collision Mastery ─────────────────────────

const bounceOrStick: MissionDef = {
  id: "bounce-or-stick",
  chapter: 4,
  title: "Bounce or Stick?",
  icon: "search",
  tagline: "Classify by kinetic energy",
  skills: ["energy", "collision-type"],
  baseTime: 270,
  baseXp: 220,
  build(rng, tier, lang) {
    const L = pick(lang);
    const unit = rng.pick([200, 400, 500, 1000]);
    const v1 = rng.pick([4, 8, 12]);
    const kind = rng.pick(tier === 0 ? (["elastic", "stick"] as const) : (["elastic", "stick", "partial"] as const));
    const ratio = kind === "partial" ? "equal" : rng.pick(["equal", "heavy", "light"] as const);
    const m1 = ratio === "heavy" ? 3 * unit : unit;
    const m2 = ratio === "light" ? 3 * unit : unit;
    const M = m1 + m2;
    let v1f: number;
    let v2f: number;
    if (kind === "elastic") {
      v1f = ((m1 - m2) * v1) / M;
      v2f = (2 * m1 * v1) / M;
    } else if (kind === "stick") {
      v1f = v2f = (m1 * v1) / M;
    } else {
      v1f = 0.25 * v1;
      v2f = 0.75 * v1;
    }
    v1f = r2(v1f);
    v2f = r2(v2f);
    const keB = ke(m1, v1);
    const keA = r2(ke(m1, v1f) + ke(m2, v2f));
    const elastic = kind === "elastic";
    const pB = m1 * v1;
    return {
      story:
        L("A flight recorder logged a collision between two modules. Investigators need to know what kind of collision it was — the numbers will tell.", "เครื่องบันทึกการบินเก็บข้อมูลการชนของโมดูลสองตัวไว้ ผู้ตรวจสอบต้องรู้ว่าเป็นการชนแบบใด ตัวเลขจะเป็นคำตอบ"),
      givens: [
        { label: L("Module A before", "โมดูล A ก่อนชน"), value: L(`${fmt(m1)} kg at ${fmt(v1)} m/s →`, `${fmt(m1)} kg ที่ ${fmt(v1)} m/s →`) },
        { label: L("Module B before", "โมดูล B ก่อนชน"), value: L(`${fmt(m2)} kg at rest`, `${fmt(m2)} kg อยู่นิ่ง`) },
        { label: L("Module A after", "โมดูล A หลังชน"), value: `${sfmt(v1f)} m/s` },
        { label: L("Module B after", "โมดูล B หลังชน"), value: `${sfmt(v2f)} m/s` },
      ],
      scene: {
        backdrop: "dock",
        bodies: [
          { art: "satellite", name: "A", m: m1, v: v1 },
          { art: "module", name: "B", m: m2, v: 0 },
        ],
        after: { v: [v1f, v2f], merged: kind === "stick" },
      },
      meta: { m1, v1, m2, v2: 0, v1f, v2f },
      steps: [
        numeric({
          id: "keB",
          skill: "energy",
          assess: "application",
          title: L("ENERGY BEFORE", "พลังงานก่อนชน"),
          prompt: L("What is the total kinetic energy before the collision?", "ก่อนชน พลังงานจลน์รวมมีค่าเท่าไร"),
          label: "KE_before",
          unit: U.E,
          answer: keB,
          formula: "KE = ½ × m × v²",
          hints: [
            L("Kinetic energy depends on mass and on the SQUARE of the speed. Only moving bodies have it.", "พลังงานจลน์ขึ้นกับมวลและ 'กำลังสอง' ของอัตราเร็ว วัตถุที่เคลื่อนที่เท่านั้นจึงจะมีพลังงานจลน์"),
            L("Module B is at rest, so only A contributes: KE = ½ × m1 × v1².", "โมดูล B อยู่นิ่ง จึงคิดเฉพาะ A: KE = ½ × m1 × v1²"),
            L(`Set it up: ½ × ${fmt(m1)} × ${fmt(v1)}².`, `ตั้งสมการ: ½ × ${fmt(m1)} × ${fmt(v1)}²`),
          ],
          scaffold: [`1▸ v1² = ${fmt(v1)} × ${fmt(v1)}`, `2▸ KE_A = ½ × ${fmt(m1)} × v1²`, L("3▸ KE_B = 0 (at rest)", "3▸ KE_B = 0 (อยู่นิ่ง)")],
          explain: `KE_before = ½ × ${fmt(m1)} × ${fmt(v1)}² = ${fmt(keB)} J`,
          traps: [
            {
              value: m1 * v1,
              m: mis(
                "momentum-energy-confusion",
                L("THAT'S MOMENTUM", "นั่นคือโมเมนตัม"),
                L("m × v is momentum (kg·m/s).\n\nKinetic energy is ½ × m × v², in joules.", "m × v คือโมเมนตัม (kg·m/s)\n\nพลังงานจลน์คือ ½ × m × v² มีหน่วยเป็นจูล"),
              ),
            },
            { value: m1 * v1 * v1, m: mis("ke-slip", L("FORGOT THE ½", "ลืม ½"), L("Kinetic energy is ½ × m × v².", "พลังงานจลน์คือ ½ × m × v²")) },
            { value: 0.5 * m1 * v1, m: mis("ke-slip", L("FORGOT TO SQUARE THE SPEED", "ลืมยกกำลังสองอัตราเร็ว"), L("Kinetic energy is ½ × m × v² — the speed is squared.", "พลังงานจลน์คือ ½ × m × v² อัตราเร็วต้องยกกำลังสอง")) },
          ],
        }),
        numeric({
          id: "keA",
          skill: "energy",
          assess: "application",
          title: L("ENERGY AFTER", "พลังงานหลังชน"),
          prompt: L("What is the total kinetic energy after the collision?", "หลังชน พลังงานจลน์รวมมีค่าเท่าไร"),
          label: "KE_after",
          unit: U.E,
          answer: keA,
          formula: "KE_after = ½ m1 v1'² + ½ m2 v2'²",
          hints: [
            L("Now both modules may be moving. Each one has its own kinetic energy.", "ตอนนี้โมดูลทั้งสองอาจกำลังเคลื่อนที่ แต่ละตัวมีพลังงานจลน์ของตัวเอง"),
            L("Compute ½ × m × v² for A and for B with the AFTER speeds, then add.", "คำนวณ ½ × m × v² ของ A และของ B ด้วยอัตราเร็ว 'หลังชน' แล้วนำมาบวกกัน"),
            L(`Set it up: ½ × ${fmt(m1)} × ${fmt(v1f)}² + ½ × ${fmt(m2)} × ${fmt(v2f)}².`, `ตั้งสมการ: ½ × ${fmt(m1)} × ${fmt(v1f)}² + ½ × ${fmt(m2)} × ${fmt(v2f)}²`),
          ],
          scaffold: [
            `1▸ KE_A = ½ × ${fmt(m1)} × ${fmt(v1f)}²`,
            `2▸ KE_B = ½ × ${fmt(m2)} × ${fmt(v2f)}²`,
            L("3▸ Add them", "3▸ บวกเข้าด้วยกัน"),
          ],
          explain: `KE_after = ${fmt(ke(m1, v1f))} + ${fmt(ke(m2, v2f))} = ${fmt(keA)} J`,
          traps: [
            {
              value: keB,
              m: mis(
                "energy-always-conserved",
                L("DON'T ASSUME — CALCULATE", "อย่าเดา ให้คำนวณ"),
                L("Kinetic energy is only conserved in elastic collisions.\n\nWork it out from the after-collision speeds.", "พลังงานจลน์อนุรักษ์เฉพาะในการชนแบบยืดหยุ่น\n\nต้องคำนวณจากอัตราเร็วหลังชน"),
              ),
            },
            {
              value: Math.max(ke(m1, v1f), ke(m2, v2f)),
              m: mis("ke-slip", L("ADD BOTH MODULES", "ต้องรวมทั้งสองโมดูล"), L("That is one module's kinetic energy.\n\nThe total includes both.", "นั่นคือพลังงานจลน์ของโมดูลเดียว\n\nค่ารวมต้องคิดทั้งสองตัว")),
            },
            {
              value: m1 * v1f + m2 * v2f,
              m: mis(
                "momentum-energy-confusion",
                L("THAT'S MOMENTUM", "นั่นคือโมเมนตัม"),
                L("m × v is momentum.\n\nKinetic energy is ½ × m × v² for each module.", "m × v คือโมเมนตัม\n\nพลังงานจลน์คือ ½ × m × v² ของแต่ละโมดูล"),
              ),
            },
          ],
        }),
        choice({
          id: "type",
          skill: "collision-type",
          assess: "decision",
          title: L("VERDICT", "ข้อสรุป"),
          prompt: L("What kind of collision was it?", "เป็นการชนแบบใด"),
          formula: L("elastic ⇔ KE_before = KE_after", "ยืดหยุ่น ⇔ KE_before = KE_after"),
          hints: [
            L("Momentum is conserved in every collision. What else might be conserved?", "โมเมนตัมอนุรักษ์ในทุกการชน แล้วยังมีอะไรอีกที่อาจอนุรักษ์"),
            L("Compare the two kinetic energies you calculated.", "เปรียบเทียบพลังงานจลน์สองค่าที่คำนวณไว้"),
            L(`KE_before = ${fmt(keB)} J and KE_after = ${fmt(keA)} J. Equal means elastic; a drop means inelastic.`, `KE_before = ${fmt(keB)} J และ KE_after = ${fmt(keA)} J ถ้าเท่ากันคือยืดหยุ่น ถ้าลดลงคือไม่ยืดหยุ่น`),
          ],
          scaffold: [L("1▸ Momentum: conserved in all collisions", "1▸ โมเมนตัม: อนุรักษ์ในทุกการชน"), L("2▸ KE equal before and after → elastic", "2▸ KE ก่อนและหลังเท่ากัน → ยืดหยุ่น"), L("3▸ KE decreases → inelastic", "3▸ KE ลดลง → ไม่ยืดหยุ่น")],
          explain: elastic
            ? L(`KE stayed at ${fmt(keB)} J, so the collision was elastic.`, `KE คงอยู่ที่ ${fmt(keB)} J การชนจึงเป็นแบบยืดหยุ่น`)
            : L(`KE fell from ${fmt(keB)} J to ${fmt(keA)} J, so the collision was inelastic.`, `KE ลดจาก ${fmt(keB)} J เหลือ ${fmt(keA)} J การชนจึงเป็นแบบไม่ยืดหยุ่น`),
          options: [
            {
              id: "elastic",
              icon: "arrows",
              label: L("Elastic", "ยืดหยุ่น"),
              detail: L("kinetic energy conserved", "พลังงานจลน์อนุรักษ์"),
              correct: elastic,
              m: mis(
                "energy-always-conserved",
                L("KINETIC ENERGY WAS LOST", "พลังงานจลน์หายไป"),
                L(`KE dropped from ${fmt(keB)} J to ${fmt(keA)} J.\n\nMomentum is conserved in every collision; kinetic energy only in elastic ones.`, `KE ลดจาก ${fmt(keB)} J เหลือ ${fmt(keA)} J\n\nโมเมนตัมอนุรักษ์ในทุกการชน แต่พลังงานจลน์อนุรักษ์เฉพาะการชนแบบยืดหยุ่น`),
              ),
            },
            {
              id: "inelastic",
              icon: "burst",
              label: L("Inelastic", "ไม่ยืดหยุ่น"),
              detail: L("kinetic energy lost", "พลังงานจลน์หายไป"),
              correct: !elastic,
              m: mis(
                "wrong-collision-choice",
                L("KINETIC ENERGY WAS CONSERVED", "พลังงานจลน์อนุรักษ์"),
                L(`KE is ${fmt(keB)} J both before and after.\n\nNo kinetic energy was lost, so the collision was elastic.`, `KE เท่ากับ ${fmt(keB)} J ทั้งก่อนและหลังชน\n\nไม่มีพลังงานจลน์หายไป การชนจึงเป็นแบบยืดหยุ่น`),
              ),
            },
            {
              id: "impossible",
              icon: "ban",
              label: L("Impossible data", "ข้อมูลเป็นไปไม่ได้"),
              detail: L("momentum not conserved", "โมเมนตัมไม่อนุรักษ์"),
              correct: false,
              m: mis(
                "system-momentum",
                L("MOMENTUM IS CONSERVED", "โมเมนตัมอนุรักษ์"),
                L(`p_before = ${fmt(pB)} kg·m/s and p_after = ${fmt(m1 * v1f + m2 * v2f)} kg·m/s.\n\nThey match, as they must for an isolated system.`, `p_before = ${fmt(pB)} kg·m/s และ p_after = ${fmt(m1 * v1f + m2 * v2f)} kg·m/s\n\nสองค่านี้เท่ากัน ตามที่ต้องเป็นในระบบโดดเดี่ยว`),
              ),
            },
          ],
        }),
      ],
    };
  },
};

const elasticTransfer: MissionDef = {
  id: "elastic-transfer",
  chapter: 4,
  title: "Elastic Transfer",
  icon: "spring",
  tagline: "Bounce and hand over",
  skills: ["collision-type", "conservation"],
  baseTime: 270,
  baseXp: 220,
  build(rng, _tier, lang) {
    const L = pick(lang);
    const [m1, m2, v1] = draw(
      () => {
        const [a, b] = rng.pick(ELASTIC_PAIRS);
        return [a, b, rng.pick([3, 4, 5, 6, 8, 9, 10, 12])];
      },
      ([a, b, c]) => isDp((2 * a * c) / (a + b), 2) && isDp(((a - b) * c) / (a + b), 2),
      [1500, 1000, 8],
    );
    const M = m1 + m2;
    const v2f = r2((2 * m1 * v1) / M);
    const v1f = r2(((m1 - m2) * v1) / M);
    const stick = (m1 * v1) / M;
    return {
      story:
        L("A supply drone must knock a fuel canister toward the station using its spring bumper. The bumper stores and returns all the energy: a perfectly elastic collision.", "โดรนขนเสบียงต้องชนถังเชื้อเพลิงให้ลอยไปหาสถานีด้วยกันชนสปริง กันชนเก็บและคืนพลังงานทั้งหมด เป็นการชนแบบยืดหยุ่นสมบูรณ์"),
      givens: [
        { label: L("Drone", "โดรน"), value: L(`${fmt(m1)} kg at ${fmt(v1)} m/s →`, `${fmt(m1)} kg ที่ ${fmt(v1)} m/s →`) },
        { label: L("Canister", "ถังเชื้อเพลิง"), value: L(`${fmt(m2)} kg at rest`, `${fmt(m2)} kg อยู่นิ่ง`) },
        { label: L("Collision", "การชน"), value: L("perfectly elastic", "ยืดหยุ่นสมบูรณ์") },
        { label: L("Sign rule", "กติกาเครื่องหมาย"), value: L("→ positive, ← negative", "→ เป็นบวก, ← เป็นลบ") },
      ],
      scene: {
        backdrop: "dock",
        bodies: [
          { art: "saucer", name: L("Drone", "โดรน"), m: m1, v: v1 },
          { art: "canister", name: L("Canister", "ถังเชื้อเพลิง"), m: m2, v: 0 },
        ],
        after: { v: [v1f, v2f], merged: false },
      },
      meta: { m1, v1, m2, v2: 0 },
      steps: [
        numeric({
          id: "v2f",
          skill: "collision-type",
          assess: "application",
          title: L("CANISTER SPEED", "อัตราเร็วของถัง"),
          prompt: L("What is the canister's velocity after the collision?", "หลังชน ถังเชื้อเพลิงมีความเร็วเท่าไร"),
          label: "v2'",
          unit: U.v,
          answer: v2f,
          formula: "v2' = 2 × m1 × v1 ÷ (m1 + m2)",
          hints: [
            L("In an elastic collision both momentum and kinetic energy are conserved. For a target at rest this gives a compact formula.", "ในการชนแบบยืดหยุ่น ทั้งโมเมนตัมและพลังงานจลน์อนุรักษ์ เมื่อเป้าอยู่นิ่งจะได้สูตรสำเร็จสั้น ๆ"),
            "v2' = 2 × m1 × v1 ÷ (m1 + m2).",
            L(`Set it up: v2' = 2 × ${fmt(m1)} × ${fmt(v1)} ÷ ${fmt(M)}.`, `ตั้งสมการ: v2' = 2 × ${fmt(m1)} × ${fmt(v1)} ÷ ${fmt(M)}`),
          ],
          scaffold: [
            `1▸ m1 + m2 = ${fmt(M)} kg`,
            `2▸ 2 × m1 × v1 = 2 × ${fmt(m1)} × ${fmt(v1)}`,
            L("3▸ Divide: v2' = (2 m1 v1) ÷ (m1 + m2)", "3▸ หาร: v2' = (2 m1 v1) ÷ (m1 + m2)"),
          ],
          explain: `v2' = 2 × ${fmt(m1)} × ${fmt(v1)} ÷ ${fmt(M)} = ${fmt(v2f)} m/s`,
          traps: [
            {
              value: stick,
              m: mis(
                "wrong-collision-formula",
                L("THAT'S THE STICK-TOGETHER SPEED", "นั่นคืออัตราเร็วแบบชนแล้วติดกัน"),
                L("p ÷ (m1 + m2) is for bodies that lock together.\n\nHere they bounce apart elastically:\nv2' = 2 m1 v1 ÷ (m1 + m2)", "p ÷ (m1 + m2) ใช้กับวัตถุที่ล็อกติดกัน\n\nที่นี่ชนแล้วแยกกันแบบยืดหยุ่น:\nv2' = 2 m1 v1 ÷ (m1 + m2)"),
              ),
            },
            {
              value: v1,
              m: mis(
                "wrong-collision-formula",
                L("NOT A SIMPLE HAND-OFF", "ไม่ใช่การส่งต่อตรง ๆ"),
                L("The target takes exactly v1 only when the two masses are equal.\n\nUse v2' = 2 m1 v1 ÷ (m1 + m2).", "เป้าจะได้ความเร็ว v1 พอดีก็ต่อเมื่อมวลทั้งสองเท่ากัน\n\nใช้ v2' = 2 m1 v1 ÷ (m1 + m2)"),
              ),
            },
          ],
        }),
        numeric({
          id: "v1f",
          skill: "conservation",
          assess: "application",
          title: L("DRONE VELOCITY", "ความเร็วของโดรน"),
          prompt: L("What is the drone's velocity after the collision? Include the sign.", "หลังชน โดรนมีความเร็วเท่าไร ใส่เครื่องหมายด้วย"),
          label: "v1'",
          unit: U.v,
          answer: v1f,
          signed: true,
          formula: "m1 × v1 = m1 × v1' + m2 × v2'",
          hints: [
            L("Momentum is conserved, and you already know where the canister's share went.", "โมเมนตัมอนุรักษ์ และคุณรู้แล้วว่าส่วนของถังเชื้อเพลิงเป็นเท่าไร"),
            L("m1 × v1' = m1 × v1 − m2 × v2'. A lighter drone may bounce backwards (negative).", "m1 × v1' = m1 × v1 − m2 × v2' โดรนที่เบากว่าอาจกระดอนถอยหลัง (ค่าเป็นลบ)"),
            L(`Set it up: v1' = (${fmt(m1 * v1)} − ${fmt(m2)} × ${fmt(v2f)}) ÷ ${fmt(m1)}.`, `ตั้งสมการ: v1' = (${fmt(m1 * v1)} − ${fmt(m2)} × ${fmt(v2f)}) ÷ ${fmt(m1)}`),
          ],
          scaffold: [
            `1▸ p_before = ${fmt(m1)} × ${fmt(v1)}`,
            `2▸ p_canister = ${fmt(m2)} × ${fmt(v2f)}`,
            "3▸ p_drone = p_before − p_canister",
            `4▸ v1' = p_drone ÷ ${fmt(m1)}`,
          ],
          explain: `v1' = (${fmt(m1 * v1)} − ${fmt(m2 * v2f)}) ÷ ${fmt(m1)} = ${sfmt(v1f)} m/s`,
          traps: [
            {
              value: stick,
              m: mis(
                "wrong-collision-formula",
                L("THAT'S THE STICK-TOGETHER SPEED", "นั่นคืออัตราเร็วแบบชนแล้วติดกัน"),
                L("The drone and canister do not move together after an elastic collision.\n\nUse momentum conservation with the canister speed you found.", "หลังการชนแบบยืดหยุ่น โดรนกับถังไม่ได้เคลื่อนที่ไปด้วยกัน\n\nใช้กฎอนุรักษ์โมเมนตัมกับอัตราเร็วของถังที่หาได้แล้ว"),
              ),
            },
            {
              value: 0,
              m: mis(
                "wrong-collision-formula",
                L("ONLY FOR EQUAL MASSES", "ใช้ได้เฉพาะเมื่อมวลเท่ากัน"),
                L("The striker stops dead only when the two masses are equal.\n\nHere they differ, so the drone keeps some velocity.", "ตัวชนจะหยุดนิ่งก็ต่อเมื่อมวลทั้งสองเท่ากัน\n\nที่นี่มวลต่างกัน โดรนจึงยังมีความเร็วเหลืออยู่"),
              ),
            },
            {
              value: v1,
              m: mis(
                "system-momentum",
                L("THE DRONE GAVE MOMENTUM AWAY", "โดรนให้โมเมนตัมไปแล้ว"),
                L("The canister gained momentum, so the drone must have lost the same amount.", "ถังเชื้อเพลิงได้โมเมนตัมเพิ่ม โดรนจึงต้องเสียโมเมนตัมไปเท่ากัน"),
              ),
            },
          ],
        }),
      ],
    };
  },
};

const energyAudit: MissionDef = {
  id: "energy-audit",
  chapter: 4,
  title: "Energy Audit",
  icon: "battery",
  tagline: "Where did the energy go?",
  skills: ["energy", "conservation"],
  baseTime: 280,
  baseXp: 230,
  build(rng, _tier, lang) {
    const L = pick(lang);
    const ms = [500, 1000, 1500, 2000, 3000];
    const [m1, m2, v1] = draw(
      () => [rng.pick(ms), rng.pick(ms), rng.pick([2, 4, 6, 8, 10, 12])],
      ([a, b, c]) => {
        const vf = (a * c) / (a + b);
        return isDp(vf, 2) && isDp(ke(a, c) - ke(a + b, vf), 2);
      },
      [1000, 1000, 8],
    );
    const M = m1 + m2;
    const vf = r2((m1 * v1) / M);
    const keI = ke(m1, v1);
    const keF = r2(ke(M, vf));
    const lost = r2(keI - keF);
    return {
      story:
        L("A tug rams into a parked module and the docking clamps lock. The clamps got hot — engineering wants to know how much energy they absorbed.", "ยานลากพุ่งชนโมดูลที่จอดอยู่และตัวล็อกเทียบท่าล็อกติดกัน ตัวล็อกร้อนขึ้น ฝ่ายวิศวกรรมอยากรู้ว่ามันดูดซับพลังงานไปเท่าไร"),
      givens: [
        { label: L("Tug", "ยานลาก"), value: L(`${fmt(m1)} kg at ${fmt(v1)} m/s →`, `${fmt(m1)} kg ที่ ${fmt(v1)} m/s →`) },
        { label: L("Module", "โมดูล"), value: L(`${fmt(m2)} kg at rest`, `${fmt(m2)} kg อยู่นิ่ง`) },
        { label: L("Collision", "การชน"), value: L("clamps lock (perfectly inelastic)", "ตัวล็อกติดกัน (ไม่ยืดหยุ่นสมบูรณ์)") },
      ],
      scene: {
        backdrop: "dock",
        bodies: [
          { art: "rocket", name: L("Tug", "ยานลาก"), m: m1, v: v1 },
          { art: "satellite", name: L("Module", "โมดูล"), m: m2, v: 0 },
        ],
        after: { v: [vf, vf], merged: true },
      },
      meta: { m1, v1, m2, v2: 0 },
      steps: [
        numeric({
          id: "vf",
          skill: "conservation",
          assess: "application",
          title: L("DOCKED SPEED", "อัตราเร็วหลังเทียบท่า"),
          prompt: L("What is the common velocity after docking?", "หลังเทียบท่า ความเร็วร่วมมีค่าเท่าไร"),
          label: "v_f",
          unit: U.v,
          answer: vf,
          formula: "m1 × v1 = (m1 + m2) × v_f",
          hints: [
            L("Momentum is conserved even when kinetic energy is not.", "โมเมนตัมอนุรักษ์ แม้พลังงานจลน์จะไม่อนุรักษ์"),
            "v_f = m1 × v1 ÷ (m1 + m2).",
            L(`Set it up: v_f = ${fmt(m1 * v1)} ÷ ${fmt(M)}.`, `ตั้งสมการ: v_f = ${fmt(m1 * v1)} ÷ ${fmt(M)}`),
          ],
          scaffold: [`1▸ p_before = ${fmt(m1)} × ${fmt(v1)}`, L(`2▸ Combined mass = ${fmt(M)} kg`, `2▸ มวลรวม = ${fmt(M)} kg`), L("3▸ v_f = p_before ÷ combined mass", "3▸ v_f = p_before ÷ มวลรวม")],
          explain: `v_f = ${fmt(m1 * v1)} ÷ ${fmt(M)} = ${fmt(vf)} m/s`,
          traps: [
            {
              value: (m1 * v1) / m2,
              m: mis("wrong-denominator", L("WRONG DENOMINATOR", "ตัวหารผิด"), L("Both bodies move together after docking.\n\nDivide by (m1 + m2).", "หลังเทียบท่า วัตถุทั้งสองเคลื่อนที่ไปด้วยกัน\n\nให้หารด้วย (m1 + m2)")),
            },
            {
              value: (2 * m1 * v1) / M,
              m: mis(
                "wrong-collision-formula",
                L("WRONG COLLISION FORMULA", "ใช้สูตรการชนผิดแบบ"),
                L("That is the elastic result.\n\nThe clamps lock, so use v_f = m1 v1 ÷ (m1 + m2).", "นั่นคือผลของการชนแบบยืดหยุ่น\n\nตัวล็อกติดกัน จึงใช้ v_f = m1 v1 ÷ (m1 + m2)"),
              ),
            },
          ],
        }),
        numeric({
          id: "lost",
          skill: "energy",
          assess: "analysis",
          title: L("ENERGY ABSORBED", "พลังงานที่ถูกดูดซับ"),
          prompt: L("How much kinetic energy was lost in the docking?", "พลังงานจลน์หายไปเท่าไรในการเทียบท่า"),
          label: "ΔKE",
          unit: U.E,
          answer: lost,
          formula: "ΔKE = KE_before − KE_after",
          hints: [
            L("Find the kinetic energy before and after, then take the difference.", "หาพลังงานจลน์ก่อนและหลัง แล้วหาผลต่าง"),
            "KE_before = ½ m1 v1². KE_after = ½ (m1 + m2) v_f².",
            L(`Set it up: ½ × ${fmt(m1)} × ${fmt(v1)}² − ½ × ${fmt(M)} × ${fmt(vf)}².`, `ตั้งสมการ: ½ × ${fmt(m1)} × ${fmt(v1)}² − ½ × ${fmt(M)} × ${fmt(vf)}²`),
          ],
          scaffold: [
            `1▸ KE_before = ½ × ${fmt(m1)} × ${fmt(v1)}²`,
            `2▸ KE_after = ½ × ${fmt(M)} × ${fmt(vf)}²`,
            L("3▸ Subtract: KE_before − KE_after", "3▸ ลบกัน: KE_before − KE_after"),
          ],
          explain: `ΔKE = ${fmt(keI)} − ${fmt(keF)} = ${fmt(lost)} J`,
          traps: [
            {
              value: keF,
              m: mis("ke-slip", L("THAT'S WHAT REMAINS", "นั่นคือส่วนที่เหลืออยู่"), L("You found the kinetic energy after docking.\n\nThe loss is KE_before − KE_after.", "คุณหาพลังงานจลน์หลังเทียบท่าได้แล้ว\n\nส่วนที่หายไปคือ KE_before − KE_after")),
            },
            {
              value: keI,
              m: mis("ke-slip", L("THAT'S THE STARTING ENERGY", "นั่นคือพลังงานตั้งต้น"), L("Subtract the kinetic energy that remains after docking.", "ให้ลบด้วยพลังงานจลน์ที่เหลืออยู่หลังเทียบท่า")),
            },
            {
              value: 0,
              m: mis(
                "energy-always-conserved",
                L("ENERGY WENT SOMEWHERE", "พลังงานต้องไปอยู่ที่ไหนสักแห่ง"),
                L("Momentum is conserved here, kinetic energy is not.\n\nThe bodies stuck together, so some kinetic energy left the motion.", "ที่นี่โมเมนตัมอนุรักษ์ แต่พลังงานจลน์ไม่อนุรักษ์\n\nวัตถุติดกัน พลังงานจลน์บางส่วนจึงออกไปจากการเคลื่อนที่"),
              ),
            },
          ],
        }),
        choice({
          id: "where",
          skill: "energy",
          assess: "analysis",
          title: L("ENERGY TRAIL", "ตามรอยพลังงาน"),
          prompt: L("Where did the missing kinetic energy go?", "พลังงานจลน์ที่หายไป ไปอยู่ที่ไหน"),
          formula: L("total energy is conserved; kinetic energy need not be", "พลังงานรวมอนุรักษ์เสมอ แต่พลังงานจลน์ไม่จำเป็นต้องอนุรักษ์"),
          hints: [
            L("Energy cannot vanish. What happens to clamps and hulls when they slam together?", "พลังงานหายไปเฉย ๆ ไม่ได้ เมื่อตัวล็อกและตัวยานกระแทกกัน เกิดอะไรขึ้นกับมัน"),
            L("Think of the hot clamps in the story.", "นึกถึงตัวล็อกที่ร้อนขึ้นในเรื่อง"),
            L("It left the motion and became internal energy of the materials.", "พลังงานออกจากการเคลื่อนที่ไปเป็นพลังงานภายในของวัสดุ"),
          ],
          scaffold: [L("1▸ Total energy is always conserved", "1▸ พลังงานรวมอนุรักษ์เสมอ"), L("2▸ KE can turn into other forms", "2▸ KE เปลี่ยนไปเป็นพลังงานรูปอื่นได้"), L("3▸ Inelastic collisions heat and deform things", "3▸ การชนแบบไม่ยืดหยุ่นทำให้วัตถุร้อนและเสียรูป")],
          explain: L("The lost kinetic energy became heat, sound and permanent deformation of the clamps.", "พลังงานจลน์ที่หายไปกลายเป็นความร้อน เสียง และการเสียรูปถาวรของตัวล็อก"),
          options: rng.shuffle([
            {
              id: "heat",
              icon: "thermo",
              label: L("Heat, sound and deformation", "ความร้อน เสียง และการเสียรูป"),
              detail: L("of the clamps and hulls", "ของตัวล็อกและตัวยาน"),
              correct: true,
            },
            {
              id: "destroyed",
              icon: "void",
              label: L("It was destroyed", "ถูกทำลายไป"),
              detail: L("energy simply vanished", "พลังงานหายไปเฉย ๆ"),
              correct: false,
              m: mis(
                "energy-always-conserved",
                L("ENERGY IS NEVER DESTROYED", "พลังงานไม่มีวันถูกทำลาย"),
                L("Energy only changes form.\n\nHere the kinetic energy became thermal energy, sound and deformation.", "พลังงานเพียงเปลี่ยนรูป\n\nที่นี่พลังงานจลน์กลายเป็นพลังงานความร้อน เสียง และการเสียรูป"),
              ),
            },
            {
              id: "momentum",
              icon: "arrow-right",
              label: L("It became extra momentum", "กลายเป็นโมเมนตัมเพิ่ม"),
              detail: L("of the joined craft", "ของยานที่ต่อกันแล้ว"),
              correct: false,
              m: mis(
                "momentum-energy-confusion",
                L("ENERGY ≠ MOMENTUM", "พลังงาน ≠ โมเมนตัม"),
                L("Momentum and energy are different quantities.\n\nTotal momentum is the same before and after; the lost KE became heat and deformation.", "โมเมนตัมกับพลังงานเป็นปริมาณคนละตัว\n\nโมเมนตัมรวมเท่าเดิมทั้งก่อนและหลัง ส่วน KE ที่หายไปกลายเป็นความร้อนและการเสียรูป"),
              ),
            },
          ]),
        }),
      ],
    };
  },
};

const clampOrBumper: MissionDef = {
  id: "clamp-or-bumper",
  chapter: 4,
  title: "Clamp or Bumper?",
  icon: "magnet",
  tagline: "Pick the right collision",
  skills: ["collision-type", "conservation"],
  baseTime: 280,
  baseXp: 240,
  build(rng, _tier, lang) {
    const L = pick(lang);
    const goal = rng.pick(["capture", "launch", "gentle"] as const);
    const [m1, m2, v1, limit] = draw(
      () => {
        const [a, b] = rng.pick(ELASTIC_PAIRS);
        const c = rng.pick([3, 4, 5, 6, 8, 9, 10, 12]);
        const stickV = (a * c) / (a + b);
        return [a, b, c, Math.round(1.5 * stickV * 10) / 10];
      },
      ([a, b, c, x]) => {
        const stickV = (a * c) / (a + b);
        return isDp(stickV, 2) && x > stickV + 0.2 && x < 2 * stickV - 0.2;
      },
      [1500, 1000, 8, 7.2],
    );
    const M = m1 + m2;
    const stickV = r2((m1 * v1) / M);
    const bounceV = r2((2 * m1 * v1) / M);
    const useClamp = goal !== "launch";
    const answer = useClamp ? stickV : bounceV;
    const target = goal === "capture" ? L("crew capsule", "แคปซูลลูกเรือ") : goal === "launch" ? L("supply canister", "ถังเสบียง") : L("space telescope", "กล้องโทรทรรศน์อวกาศ");
    const goalText =
      goal === "capture"
        ? L("The capsule must end up attached to the tug so it can be towed home.", "แคปซูลต้องติดอยู่กับยานลากเพื่อจะลากกลับบ้านได้")
        : goal === "launch"
          ? L(`The canister must leave at ${fmt(limit)} m/s or faster to reach the station.`, `ถังต้องออกไปด้วยความเร็ว ${fmt(limit)} m/s ขึ้นไปจึงจะไปถึงสถานี`)
          : L(`The telescope is fragile: it must not move faster than ${fmt(limit)} m/s afterwards.`, `กล้องโทรทรรศน์เปราะบาง หลังชนต้องเคลื่อนที่ไม่เร็วกว่า ${fmt(limit)} m/s`);
    const clampFail =
      goal === "launch"
        ? L(`With clamps both move together at only ${fmt(stickV)} m/s — below the ${fmt(limit)} m/s the canister needs.`, `ถ้าใช้ตัวล็อก ทั้งคู่จะเคลื่อนที่ไปด้วยกันที่ ${fmt(stickV)} m/s เท่านั้น ต่ำกว่า ${fmt(limit)} m/s ที่ถังต้องการ`)
        : "";
    const bumperFail =
      goal === "capture"
        ? L(`With the bumper the capsule shoots away at ${fmt(bounceV)} m/s while the tug falls behind — nothing is attached.`, `ถ้าใช้กันชน แคปซูลจะพุ่งออกไปที่ ${fmt(bounceV)} m/s ขณะที่ยานลากตามไม่ทัน ไม่มีอะไรติดกันเลย`)
        : L(`With the bumper the telescope leaves at ${fmt(bounceV)} m/s — above the ${fmt(limit)} m/s limit.`, `ถ้าใช้กันชน กล้องโทรทรรศน์จะออกไปที่ ${fmt(bounceV)} m/s เกินขีดจำกัด ${fmt(limit)} m/s`);
    return {
      story: L(`A tug approaches a ${target} that is at rest. It can lock on with magnetic clamps or strike it with a spring bumper. ${goalText}`, `ยานลากกำลังเข้าหา${target}ที่อยู่นิ่ง จะล็อกด้วยตัวล็อกแม่เหล็กหรือชนด้วยกันชนสปริงก็ได้ ${goalText}`),
      givens: [
        { label: L("Tug", "ยานลาก"), value: L(`${fmt(m1)} kg at ${fmt(v1)} m/s →`, `${fmt(m1)} kg ที่ ${fmt(v1)} m/s →`) },
        { label: target[0].toUpperCase() + target.slice(1), value: L(`${fmt(m2)} kg at rest`, `${fmt(m2)} kg อยู่นิ่ง`) },
        { label: L("Mission goal", "เป้าหมายภารกิจ"), value: goal === "capture" ? L("stay attached", "ติดกันอยู่") : goal === "launch" ? L(`leave at ≥ ${fmt(limit)} m/s`, `ออกไปที่ ≥ ${fmt(limit)} m/s`) : L(`stay ≤ ${fmt(limit)} m/s`, `ไม่เกิน ${fmt(limit)} m/s`) },
      ],
      scene: {
        backdrop: "dock",
        bodies: [
          { art: "rocket", name: L("Tug", "ยานลาก"), m: m1, v: v1 },
          { art: goal === "capture" ? "saucer" : goal === "launch" ? "canister" : "telescope", name: L("Target", "เป้าหมาย"), m: m2, v: 0 },
        ],
        after: useClamp
          ? { v: [stickV, stickV], merged: true }
          : { v: [r2(((m1 - m2) * v1) / M), bounceV], merged: false },
      },
      meta: { m1, v1, m2, v2: 0, limit, goal: goal === "capture" ? 0 : goal === "launch" ? 1 : 2 },
      steps: [
        choice({
          id: "type",
          skill: "collision-type",
          assess: "decision",
          title: L("CONTACT MODE", "วิธีสัมผัส"),
          prompt: L("Which contact mode meets the mission goal?", "วิธีสัมผัสแบบใดทำได้ตามเป้าหมายภารกิจ"),
          formula: L("inelastic: v = m1 v1 ÷ (m1+m2) · elastic: v2' = 2 m1 v1 ÷ (m1+m2)", "ไม่ยืดหยุ่น: v = m1 v1 ÷ (m1+m2) · ยืดหยุ่น: v2' = 2 m1 v1 ÷ (m1+m2)"),
          hints: [
            L("Clamps make the bodies leave together (perfectly inelastic). A spring bumper makes them bounce apart (elastic).", "ตัวล็อกทำให้วัตถุออกไปด้วยกัน (ไม่ยืดหยุ่นสมบูรณ์) ส่วนกันชนสปริงทำให้กระดอนแยกกัน (ยืดหยุ่น)"),
            L("Work out the target's speed in each case and compare it with the mission goal.", "หาอัตราเร็วของเป้าในแต่ละกรณี แล้วเทียบกับเป้าหมายภารกิจ"),
            L(`Clamps: ${fmt(m1 * v1)} ÷ ${fmt(M)}. Bumper: twice that. Which result satisfies the goal?`, `ตัวล็อก: ${fmt(m1 * v1)} ÷ ${fmt(M)} กันชน: สองเท่าของค่านั้น ผลแบบใดตรงกับเป้าหมาย`),
          ],
          scaffold: [
            L(`1▸ Clamps: v = ${fmt(m1 * v1)} ÷ ${fmt(M)}`, `1▸ ตัวล็อก: v = ${fmt(m1 * v1)} ÷ ${fmt(M)}`),
            L(`2▸ Bumper: v2' = 2 × ${fmt(m1 * v1)} ÷ ${fmt(M)}`, `2▸ กันชน: v2' = 2 × ${fmt(m1 * v1)} ÷ ${fmt(M)}`),
            L("3▸ Compare each with the mission goal", "3▸ เทียบแต่ละค่ากับเป้าหมายภารกิจ"),
          ],
          explain: useClamp
            ? L(`Clamps: the pair moves at ${fmt(stickV)} m/s, which meets the goal. ${bumperFail}`, `ตัวล็อก: ทั้งคู่เคลื่อนที่ที่ ${fmt(stickV)} m/s ซึ่งตรงตามเป้าหมาย ${bumperFail}`)
            : L(`Bumper: the canister leaves at ${fmt(bounceV)} m/s, which meets the goal. ${clampFail}`, `กันชน: ถังออกไปที่ ${fmt(bounceV)} m/s ซึ่งตรงตามเป้าหมาย ${clampFail}`),
          options: [
            {
              id: "clamp",
              icon: "magnet",
              label: L("Magnetic clamps", "ตัวล็อกแม่เหล็ก"),
              detail: L("lock together · perfectly inelastic", "ล็อกติดกัน · ไม่ยืดหยุ่นสมบูรณ์"),
              correct: useClamp,
              m: mis("wrong-collision-choice", L("MISSION GOAL NOT MET", "ไม่บรรลุเป้าหมายภารกิจ"), L(`${clampFail}\n\nAn elastic bounce transfers more speed to the target.`, `${clampFail}\n\nการชนแบบยืดหยุ่นส่งอัตราเร็วให้เป้าได้มากกว่า`)),
            },
            {
              id: "bumper",
              icon: "spring",
              label: L("Spring bumper", "กันชนสปริง"),
              detail: L("bounce apart · elastic", "กระดอนแยกกัน · ยืดหยุ่น"),
              correct: !useClamp,
              m: mis("wrong-collision-choice", L("MISSION GOAL NOT MET", "ไม่บรรลุเป้าหมายภารกิจ"), L(`${bumperFail}\n\nLocking together gives the target the lowest possible speed.`, `${bumperFail}\n\nการล็อกติดกันทำให้เป้ามีอัตราเร็วต่ำที่สุดเท่าที่เป็นไปได้`)),
            },
          ],
        }),
        numeric({
          id: "v",
          skill: "collision-type",
          assess: "application",
          title: L("TARGET SPEED", "อัตราเร็วของเป้า"),
          prompt: L(`With ${useClamp ? "the clamps" : "the bumper"}, what is the ${target}'s velocity afterwards?`, `เมื่อใช้${useClamp ? "ตัวล็อก" : "กันชน"} หลังชน${target}มีความเร็วเท่าไร`),
          label: "v_target",
          unit: U.v,
          answer,
          formula: useClamp ? "m1 × v1 = (m1 + m2) × v" : "v2' = 2 × m1 × v1 ÷ (m1 + m2)",
          hints: useClamp
            ? [
                L("Locked together, the two bodies share one velocity.", "เมื่อล็อกติดกัน วัตถุทั้งสองมีความเร็วเดียวกัน"),
                "v = m1 × v1 ÷ (m1 + m2).",
                L(`Set it up: v = ${fmt(m1 * v1)} ÷ ${fmt(M)}.`, `ตั้งสมการ: v = ${fmt(m1 * v1)} ÷ ${fmt(M)}`),
              ]
            : [
                L("An elastic strike on a target at rest has a compact result.", "การชนแบบยืดหยุ่นกับเป้าที่อยู่นิ่งมีสูตรสำเร็จสั้น ๆ"),
                "v2' = 2 × m1 × v1 ÷ (m1 + m2).",
                L(`Set it up: v2' = 2 × ${fmt(m1 * v1)} ÷ ${fmt(M)}.`, `ตั้งสมการ: v2' = 2 × ${fmt(m1 * v1)} ÷ ${fmt(M)}`),
              ],
          scaffold: useClamp
            ? [`1▸ p_before = ${fmt(m1)} × ${fmt(v1)}`, L(`2▸ Combined mass = ${fmt(M)} kg`, `2▸ มวลรวม = ${fmt(M)} kg`), L("3▸ v = p_before ÷ combined mass", "3▸ v = p_before ÷ มวลรวม")]
            : [`1▸ 2 × m1 × v1 = 2 × ${fmt(m1 * v1)}`, `2▸ m1 + m2 = ${fmt(M)} kg`, L("3▸ Divide", "3▸ หาร")],
          explain: useClamp
            ? `v = ${fmt(m1 * v1)} ÷ ${fmt(M)} = ${fmt(stickV)} m/s`
            : `v2' = 2 × ${fmt(m1 * v1)} ÷ ${fmt(M)} = ${fmt(bounceV)} m/s`,
          traps: [
            {
              value: useClamp ? bounceV : stickV,
              m: mis(
                "wrong-collision-formula",
                L("WRONG COLLISION FORMULA", "ใช้สูตรการชนผิดแบบ"),
                useClamp
                  ? L("That is the elastic (bounce) result.\n\nWith clamps the bodies move together:\nv = m1 v1 ÷ (m1 + m2)", "นั่นคือผลของการชนแบบยืดหยุ่น (กระดอน)\n\nเมื่อใช้ตัวล็อก วัตถุเคลื่อนที่ไปด้วยกัน:\nv = m1 v1 ÷ (m1 + m2)")
                  : L("That is the stick-together result.\n\nWith the bumper the collision is elastic:\nv2' = 2 m1 v1 ÷ (m1 + m2)", "นั่นคือผลของการชนแล้วติดกัน\n\nเมื่อใช้กันชน การชนเป็นแบบยืดหยุ่น:\nv2' = 2 m1 v1 ÷ (m1 + m2)"),
              ),
            },
            {
              value: (m1 * v1) / m2,
              m: mis("wrong-denominator", L("WRONG DENOMINATOR", "ตัวหารผิด"), L("Use the combined mass (m1 + m2) in the denominator.", "ตัวหารต้องเป็นมวลรวม (m1 + m2)")),
            },
          ],
        }),
      ],
    };
  },
};

const crisisProtocol: MissionDef = {
  id: "crisis-protocol",
  chapter: 4,
  title: "Crisis Protocol",
  icon: "skull",
  tagline: "BOSS · everything at once",
  skills: ["impulse", "conservation", "vector", "energy"],
  baseTime: 360,
  baseXp: 400,
  boss: true,
  build(rng, _tier, lang) {
    const L = pick(lang);
    const [m1, v0, F, dt, m2] = draw(
      () => {
        const a = rng.pick([2000, 3000, 4000]);
        return [a, rng.pick([10, 12, 16, 20]), rng.pick([2000, 3000, 4000, 6000, 8000]), rng.pick([2, 3, 4, 5]), rng.pick([a, a / 2, 2 * a])];
      },
      ([a, u, f, t, b]) => {
        const v1 = u - (f * t) / a;
        const vf = (a * v1) / (a + b);
        return v1 >= 2 && isDp(v1, 1) && isDp(vf, 2) && isDp(ke(a, v1) - ke(a + b, vf), 2);
      },
      [2000, 16, 4000, 2, 2000],
    );
    const dv = (F * dt) / m1;
    const v1 = r2(v0 - dv);
    const M = m1 + m2;
    const vf = r2((m1 * v1) / M);
    const jStop = r2(-M * vf);
    const lost = r2(ke(m1, v1) - ke(M, vf));
    return {
      story:
        L("RED ALERT. A runaway shuttle is heading for the station. It can fire one retro-burn, then a rescue tug will clamp onto it, and the joined pair must be braked to rest. Every number has to be right.", "สัญญาณเตือนภัยสีแดง กระสวยที่ควบคุมไม่ได้กำลังพุ่งเข้าหาสถานี กระสวยจุดเครื่องยนต์ถอยหลังได้หนึ่งครั้ง จากนั้นยานลากกู้ภัยจะล็อกเข้ากับมัน แล้วต้องเบรกทั้งคู่ให้หยุดนิ่ง ตัวเลขทุกตัวต้องถูกต้อง"),
      givens: [
        { label: L("Shuttle", "กระสวย"), value: L(`${fmt(m1)} kg at ${fmt(v0)} m/s →`, `${fmt(m1)} kg ที่ ${fmt(v0)} m/s →`) },
        { label: L("Retro-burn", "เครื่องยนต์ถอยหลัง"), value: L(`${fmt(F)} N ← for ${fmt(dt)} s`, `${fmt(F)} N ← นาน ${fmt(dt)} s`) },
        { label: L("Rescue tug", "ยานลากกู้ภัย"), value: L(`${fmt(m2)} kg at rest`, `${fmt(m2)} kg อยู่นิ่ง`) },
        { label: L("Sign rule", "กติกาเครื่องหมาย"), value: L("→ positive, ← negative", "→ เป็นบวก, ← เป็นลบ") },
      ],
      scene: {
        backdrop: "dock",
        bodies: [
          { art: "rocket", name: L("Shuttle", "กระสวย"), m: m1, v: v0 },
          { art: "satellite", name: L("Tug", "ยานลาก"), m: m2, v: 0 },
        ],
        after: { v: [0, 0], merged: true },
      },
      meta: { m1, v0, F, dt, m2 },
      steps: [
        numeric({
          id: "v1",
          skill: "impulse",
          assess: "application",
          title: L("1 · RETRO-BURN", "1 · จุดเครื่องยนต์ถอยหลัง"),
          prompt: L("What is the shuttle's velocity after the retro-burn?", "หลังจุดเครื่องยนต์ถอยหลัง กระสวยมีความเร็วเท่าไร"),
          label: "v1",
          unit: U.v,
          answer: v1,
          formula: L("v1 = v0 + J ÷ m, with J = F × Δt", "v1 = v0 + J ÷ m โดย J = F × Δt"),
          hints: [
            L("The burn delivers an impulse against the motion, so the shuttle slows.", "เครื่องยนต์ให้การดลสวนทางการเคลื่อนที่ กระสวยจึงช้าลง"),
            L("Δv = F × Δt ÷ m, and it is subtracted because the thrust points ←.", "Δv = F × Δt ÷ m และต้องนำไปลบ เพราะแรงขับชี้ไปทาง ←"),
            L(`Set it up: v1 = ${fmt(v0)} − (${fmt(F)} × ${fmt(dt)}) ÷ ${fmt(m1)}.`, `ตั้งสมการ: v1 = ${fmt(v0)} − (${fmt(F)} × ${fmt(dt)}) ÷ ${fmt(m1)}`),
          ],
          scaffold: [L(`1▸ J = ${fmt(F)} × ${fmt(dt)} (pointing ←)`, `1▸ J = ${fmt(F)} × ${fmt(dt)} (ชี้ไปทาง ←)`), `2▸ Δv = J ÷ ${fmt(m1)}`, `3▸ v1 = ${fmt(v0)} − Δv`],
          explain: `v1 = ${fmt(v0)} − ${fmt(F * dt)} ÷ ${fmt(m1)} = ${fmt(v1)} m/s`,
          traps: [
            {
              value: v0 + dv,
              m: mis("vector-neglect", L("RETRO-BURN OPPOSES MOTION", "แรงขับถอยหลังสวนทางการเคลื่อนที่"), L("The thrust points left, so it slows the shuttle.\n\nSubtract Δv.", "แรงขับชี้ไปทางซ้าย จึงทำให้กระสวยช้าลง\n\nต้องลบ Δv ออก")),
            },
            {
              value: dv,
              m: mis(
                "forgot-initial-velocity",
                L("THAT'S ONLY THE CHANGE", "นั่นเป็นแค่ส่วนที่เปลี่ยนไป"),
                L("F × Δt ÷ m is Δv.\n\nSubtract it from the velocity the shuttle already had.", "F × Δt ÷ m คือ Δv\n\nนำไปลบออกจากความเร็วเดิมของกระสวย"),
              ),
            },
            {
              value: v0 - F * dt,
              m: mis("impulse-momentum-confusion", L("FORGOT TO DIVIDE BY MASS", "ลืมหารด้วยมวล"), L("Impulse changes momentum.\n\nΔv = J ÷ m", "การดลเปลี่ยนโมเมนตัม\n\nΔv = J ÷ m")),
            },
          ],
        }),
        numeric({
          id: "vf",
          skill: "conservation",
          assess: "application",
          title: L("2 · CLAMP ON", "2 · ล็อกเข้าหากัน"),
          prompt: L("The tug clamps onto the shuttle. What is their common velocity?", "ยานลากล็อกเข้ากับกระสวย ความเร็วร่วมมีค่าเท่าไร"),
          label: "v_f",
          unit: U.v,
          answer: vf,
          formula: "m1 × v1 = (m1 + m2) × v_f",
          hints: [
            L("Clamping is a perfectly inelastic collision. Momentum is conserved.", "การล็อกติดกันเป็นการชนแบบไม่ยืดหยุ่นสมบูรณ์ โมเมนตัมอนุรักษ์"),
            L("v_f = m1 × v1 ÷ (m1 + m2), using the velocity AFTER the burn.", "v_f = m1 × v1 ÷ (m1 + m2) โดยใช้ความเร็ว 'หลัง' จุดเครื่องยนต์"),
            L(`Set it up: v_f = (${fmt(m1)} × ${fmt(v1)}) ÷ ${fmt(M)}.`, `ตั้งสมการ: v_f = (${fmt(m1)} × ${fmt(v1)}) ÷ ${fmt(M)}`),
          ],
          scaffold: [`1▸ p = ${fmt(m1)} × ${fmt(v1)}`, L(`2▸ Combined mass = ${fmt(M)} kg`, `2▸ มวลรวม = ${fmt(M)} kg`), L("3▸ v_f = p ÷ combined mass", "3▸ v_f = p ÷ มวลรวม")],
          explain: `v_f = ${fmt(m1 * v1)} ÷ ${fmt(M)} = ${fmt(vf)} m/s`,
          traps: [
            {
              value: (m1 * v0) / M,
              m: mis(
                "system-momentum",
                L("USE THE POST-BURN VELOCITY", "ต้องใช้ความเร็วหลังจุดเครื่องยนต์"),
                L("The shuttle had already slowed down before the tug clamped on.\n\nUse v1 from the previous step.", "กระสวยช้าลงไปแล้วก่อนที่ยานลากจะล็อกเข้ามา\n\nให้ใช้ v1 จากขั้นก่อนหน้า"),
              ),
            },
            {
              value: (m1 * v1) / m2,
              m: mis("wrong-denominator", L("WRONG DENOMINATOR", "ตัวหารผิด"), L("Both craft move together.\n\nDivide by (m1 + m2).", "ยานทั้งสองเคลื่อนที่ไปด้วยกัน\n\nให้หารด้วย (m1 + m2)")),
            },
            {
              value: (2 * m1 * v1) / M,
              m: mis("wrong-collision-formula", L("WRONG COLLISION FORMULA", "ใช้สูตรการชนผิดแบบ"), L("That is the elastic result.\n\nThe tug clamps on: perfectly inelastic.", "นั่นคือผลของการชนแบบยืดหยุ่น\n\nยานลากล็อกติด เป็นการชนแบบไม่ยืดหยุ่นสมบูรณ์")),
            },
          ],
        }),
        numeric({
          id: "jStop",
          skill: "impulse",
          assess: "application",
          title: L("3 · FINAL BRAKE", "3 · เบรกครั้งสุดท้าย"),
          prompt: L("What impulse brings the joined pair to rest? Include the sign.", "ต้องใช้การดลเท่าไรจึงจะทำให้ทั้งคู่หยุดนิ่ง ใส่เครื่องหมายด้วย"),
          label: "J",
          unit: U.J,
          answer: jStop,
          signed: true,
          formula: "J = Δp = 0 − (m1 + m2) × v_f",
          hints: [
            L("To stop, the impulse must cancel all the momentum the pair has.", "จะหยุดได้ การดลต้องหักล้างโมเมนตัมทั้งหมดที่ทั้งคู่มี"),
            L("J = 0 − (m1 + m2) × v_f. It points against the motion.", "J = 0 − (m1 + m2) × v_f มีทิศสวนทางการเคลื่อนที่"),
            L(`Set it up: J = −${fmt(M)} × ${fmt(vf)}.`, `ตั้งสมการ: J = −${fmt(M)} × ${fmt(vf)}`),
          ],
          scaffold: [`1▸ p = ${fmt(M)} × ${fmt(vf)}`, L("2▸ Final momentum = 0", "2▸ โมเมนตัมสุดท้าย = 0"), L("3▸ J = 0 − p (negative)", "3▸ J = 0 − p (เป็นลบ)")],
          explain: `J = −${fmt(M)} × ${fmt(vf)} = ${fmt(jStop)} N·s`,
          traps: both(
            m2 * vf,
            mis("wrong-denominator", L("BRAKE THE WHOLE STACK", "ต้องเบรกทั้งชุด"), L("Shuttle and tug are locked together now.\n\nUse the combined mass.", "ตอนนี้กระสวยกับยานลากล็อกติดกันแล้ว\n\nให้ใช้มวลรวม")),
          ),
        }),
        numeric({
          id: "lost",
          skill: "energy",
          assess: "analysis",
          title: L("4 · DAMAGE REPORT", "4 · รายงานความเสียหาย"),
          prompt: L("How much kinetic energy did the clamps absorb when the tug locked on?", "ตอนที่ยานลากล็อกเข้ามา ตัวล็อกดูดซับพลังงานจลน์ไปเท่าไร"),
          label: "ΔKE",
          unit: U.E,
          answer: lost,
          formula: "ΔKE = ½ m1 v1² − ½ (m1 + m2) v_f²",
          hints: [
            L("Compare the kinetic energy just before and just after the clamping.", "เปรียบเทียบพลังงานจลน์ก่อนและหลังการล็อกทันที"),
            L("Before: ½ m1 v1² (the tug was at rest). After: ½ (m1 + m2) v_f².", "ก่อน: ½ m1 v1² (ยานลากอยู่นิ่ง) หลัง: ½ (m1 + m2) v_f²"),
            L(`Set it up: ½ × ${fmt(m1)} × ${fmt(v1)}² − ½ × ${fmt(M)} × ${fmt(vf)}².`, `ตั้งสมการ: ½ × ${fmt(m1)} × ${fmt(v1)}² − ½ × ${fmt(M)} × ${fmt(vf)}²`),
          ],
          scaffold: [
            `1▸ KE_before = ½ × ${fmt(m1)} × ${fmt(v1)}²`,
            `2▸ KE_after = ½ × ${fmt(M)} × ${fmt(vf)}²`,
            L("3▸ Subtract", "3▸ ลบกัน"),
          ],
          explain: `ΔKE = ${fmt(ke(m1, v1))} − ${fmt(ke(M, vf))} = ${fmt(lost)} J`,
          traps: [
            {
              value: ke(M, vf),
              m: mis("ke-slip", L("THAT'S WHAT REMAINS", "นั่นคือส่วนที่เหลืออยู่"), L("You found the kinetic energy after clamping.\n\nThe loss is KE_before − KE_after.", "คุณหาพลังงานจลน์หลังการล็อกได้แล้ว\n\nส่วนที่หายไปคือ KE_before − KE_after")),
            },
            {
              value: ke(m1, v1),
              m: mis("ke-slip", L("THAT'S THE STARTING ENERGY", "นั่นคือพลังงานตั้งต้น"), L("Subtract the kinetic energy that remains after clamping.", "ให้ลบด้วยพลังงานจลน์ที่เหลืออยู่หลังการล็อก")),
            },
            {
              value: 0,
              m: mis(
                "energy-always-conserved",
                L("ENERGY WENT SOMEWHERE", "พลังงานต้องไปอยู่ที่ไหนสักแห่ง"),
                L("Momentum is conserved in the clamping, kinetic energy is not.", "ในการล็อกติดกัน โมเมนตัมอนุรักษ์ แต่พลังงานจลน์ไม่อนุรักษ์"),
              ),
            },
          ],
        }),
      ],
    };
  },
};

export const MISSIONS_B: MissionDef[] = [
  theJunction,
  recoil,
  headOn,
  massEjection,
  bounceOrStick,
  elasticTransfer,
  energyAudit,
  clampOrBumper,
  crisisProtocol,
];
