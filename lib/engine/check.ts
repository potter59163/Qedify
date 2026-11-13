import { fmt } from "./build";
import { pick, type Lang } from "./lang";
import type { CheckResult, Step, StepInput } from "./types";

function trapTol(value: number, tol: number) {
  return Math.max(tol, Math.abs(value) * 0.005);
}

/**
 * Grade one answer. Wrong answers are matched against the step's known error
 * patterns first so the feedback can name the misconception instead of just
 * saying "incorrect". The correct value is never revealed here.
 */
export function checkStep(step: Step, input: StepInput, lang: Lang = "en"): CheckResult {
  const L = pick(lang);
  const ok: CheckResult = { ok: true, title: L("CORRECT", "ถูกต้อง"), body: "" };

  if (step.kind === "numeric" && input.kind === "numeric") {
    const raw = input.value;
    if (!Number.isFinite(raw)) {
      return {
        ok: false,
        title: L("NO ANSWER ENTERED", "ยังไม่ได้ใส่คำตอบ"),
        body: L(`Type a value for ${step.label} in ${step.unit}.`, `พิมพ์ค่าของ ${step.label} ในหน่วย ${step.unit}`),
      };
    }
    const x = step.signed ? raw : Math.abs(raw);
    if (Math.abs(x - step.answer) <= step.tol) return ok;

    if (step.signed && step.answer !== 0 && Math.abs(x + step.answer) <= step.tol) {
      const title = L("CHECK YOUR DIRECTION", "ตรวจทิศทางอีกครั้ง");
      return {
        ok: false,
        m: { id: "vector-neglect", skill: "vector", title, body: "" },
        title,
        body: L(
          "The size is right but the sign is wrong.\n\nMomentum, impulse and velocity are vectors: rightward (→) is positive, leftward (←) is negative.",
          "ขนาดถูกแล้ว แต่เครื่องหมายผิด\n\nโมเมนตัม การดล และความเร็วเป็นเวกเตอร์: ไปทางขวา (→) เป็นบวก ไปทางซ้าย (←) เป็นลบ",
        ),
      };
    }
    for (const t of step.traps) {
      if (Math.abs(x - t.value) <= trapTol(t.value, step.tol)) {
        return { ok: false, m: t.m, title: t.m.title, body: t.m.body };
      }
    }
    const diff = x - step.answer;
    if (Math.abs(diff) <= Math.max(Math.abs(step.answer) * 0.1, step.tol * 4)) {
      return {
        ok: false,
        near: true,
        title: L("ALMOST THERE", "เกือบถูกแล้ว"),
        body: L(
          `You are within 10% — slightly too ${diff > 0 ? "high" : "low"}.\n\nRecheck the arithmetic and keep exact values until the last step.\n\n${step.formula}`,
          `คลาดเคลื่อนไม่เกิน 10% ค่า${diff > 0 ? "สูง" : "ต่ำ"}ไปเล็กน้อย\n\nตรวจการคำนวณอีกครั้ง และอย่าปัดเศษจนถึงขั้นสุดท้าย\n\n${step.formula}`,
        ),
      };
    }
    return {
      ok: false,
      title: L("NOT QUITE", "ยังไม่ถูก"),
      body: L(
        `That value doesn't satisfy the physics yet.\n\nStart from:\n${step.formula}\n\nThen substitute the numbers from the mission brief.`,
        `ค่านี้ยังไม่สอดคล้องกับหลักฟิสิกส์\n\nเริ่มจาก:\n${step.formula}\n\nแล้วแทนค่าตัวเลขจากข้อมูลภารกิจ`,
      ),
    };
  }

  if (step.kind === "choice" && input.kind === "choice") {
    const opt = step.options.find((o) => o.id === input.id);
    if (!opt) return { ok: false, title: L("NO ANSWER ENTERED", "ยังไม่ได้ใส่คำตอบ"), body: L("Select one option.", "เลือกหนึ่งตัวเลือก") };
    if (opt.correct) return ok;
    return {
      ok: false,
      m: opt.m,
      title: opt.m?.title ?? L("NOT THE BEST CHOICE", "ยังไม่ใช่ตัวเลือกที่ดีที่สุด"),
      body: opt.m?.body ?? opt.why ?? L(`Think again with:\n${step.formula}`, `ลองคิดอีกครั้งด้วย:\n${step.formula}`),
    };
  }

  if (step.kind === "pair" && input.kind === "pair") {
    const { a, b } = input;
    if (!(a > 0) || !(b > 0)) {
      return {
        ok: false,
        title: L("MISSING INPUTS", "ใส่ค่าไม่ครบ"),
        body: L(
          `Both ${step.a.label} and ${step.b.label} must be greater than zero.\n\n${step.formula}`,
          `ทั้ง${step.a.label}และ${step.b.label}ต้องมากกว่าศูนย์\n\n${step.formula}`,
        ),
      };
    }
    if (a > step.a.max) return { ok: false, m: step.overA, title: step.overA.title, body: step.overA.body };
    if (b > step.b.max) return { ok: false, m: step.overB, title: step.overB.title, body: step.overB.body };
    const product = a * b;
    if (Math.abs(product - step.target) <= step.tol) return ok;
    for (const t of step.traps) {
      if (Math.abs(product - t.value) <= trapTol(t.value, step.tol)) {
        return { ok: false, m: t.m, title: t.m.title, body: t.m.body };
      }
    }
    const diff = product - step.target;
    if (Math.abs(diff) <= Math.abs(step.target) * 0.15) {
      return {
        ok: false,
        near: true,
        title: L("ALMOST THERE", "เกือบถูกแล้ว"),
        body: L(
          `Your result: ${fmt(product)} ${step.unit}\nOff by: ${fmt(Math.abs(diff))} ${step.unit}\n\n${diff > 0 ? "Decrease" : "Increase"} ${step.a.label} or ${step.b.label} slightly.`,
          `ผลลัพธ์ของคุณ: ${fmt(product)} ${step.unit}\nคลาดไป: ${fmt(Math.abs(diff))} ${step.unit}\n\n${diff > 0 ? "ลด" : "เพิ่ม"}${step.a.label}หรือ${step.b.label}อีกเล็กน้อย`,
        ),
      };
    }
    return {
      ok: false,
      title: L("TARGET MISSED", "ไม่ตรงเป้า"),
      body: L(
        `Your result: ${fmt(product)} ${step.unit}\n\nAdjust ${step.a.label} × ${step.b.label} until it matches the required value.\n\n${step.formula}`,
        `ผลลัพธ์ของคุณ: ${fmt(product)} ${step.unit}\n\nปรับ${step.a.label} × ${step.b.label}จนได้ค่าที่ต้องการ\n\n${step.formula}`,
      ),
    };
  }

  return { ok: false, title: L("NO ANSWER ENTERED", "ยังไม่ได้ใส่คำตอบ"), body: L("Enter an answer first.", "ใส่คำตอบก่อน") };
}

/** The canonical correct input for a step (used by the verifier and by "show solution"). */
export function solutionInput(step: Step): StepInput {
  if (step.kind === "numeric") return { kind: "numeric", value: step.answer };
  if (step.kind === "choice") return { kind: "choice", id: step.options.find((o) => o.correct)!.id };
  const a = step.a.max;
  return { kind: "pair", a, b: step.target / a };
}
