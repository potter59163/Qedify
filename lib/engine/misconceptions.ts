import type { Lang } from "./lang";
import type { Skill } from "./types";

/**
 * Misconceptions the engine can detect. Each wrong answer that matches a known
 * error pattern is logged under one of these ids so the learner profile can
 * report "what keeps going wrong", not only "how often".
 */
export const MIS = {
  "vector-neglect": { label: "Vector direction errors", th: "ผิดเรื่องทิศของเวกเตอร์", skill: "vector" },
  "added-not-multiplied": { label: "Adding instead of multiplying", th: "บวกแทนที่จะคูณ", skill: "momentum" },
  "wrong-operation": { label: "Wrong operation in p = mv", th: "ใช้การดำเนินการผิดใน p = mv", skill: "momentum" },
  "mass-speed-bias": { label: "Judging momentum by mass or speed alone", th: "ตัดสินโมเมนตัมจากมวลหรืออัตราเร็วอย่างเดียว", skill: "momentum" },
  "momentum-energy-confusion": { label: "Momentum vs kinetic energy confusion", th: "สับสนโมเมนตัมกับพลังงานจลน์", skill: "energy" },
  "force-impulse-confusion": { label: "Force vs impulse confusion", th: "สับสนแรงกับการดล", skill: "impulse" },
  "impulse-momentum-confusion": { label: "Impulse vs momentum confusion", th: "สับสนการดลกับโมเมนตัม", skill: "impulse" },
  "forgot-initial-velocity": { label: "Forgetting the initial velocity", th: "ลืมความเร็วเริ่มต้น", skill: "impulse" },
  "resource-limit": { label: "Ignoring thruster or fuel limits", th: "ไม่คำนึงถึงขีดจำกัดแรงขับหรือเชื้อเพลิง", skill: "impulse" },
  "time-force-tradeoff": { label: "Collision time vs impact force", th: "ช่วงเวลาที่ชนกับแรงกระแทก", skill: "force-time" },
  "over-engineered": { label: "Over-cushioning (wasted payload)", th: "กันกระแทกเกินจำเป็น (เสียน้ำหนักบรรทุก)", skill: "force-time" },
  "wrong-denominator": { label: "Wrong mass in conservation", th: "ใช้มวลผิดตัวในกฎอนุรักษ์", skill: "conservation" },
  "system-momentum": { label: "System momentum not conserved", th: "คิดว่าโมเมนตัมของระบบไม่อนุรักษ์", skill: "conservation" },
  "wrong-collision-formula": { label: "Elastic vs inelastic formula mix-up", th: "สลับสูตรการชนยืดหยุ่นกับไม่ยืดหยุ่น", skill: "collision-type" },
  "wrong-collision-choice": { label: "Collision type vs mission goal", th: "เลือกชนิดการชนไม่ตรงเป้าหมายภารกิจ", skill: "collision-type" },
  "ke-slip": { label: "Kinetic energy calculation slips", th: "คำนวณพลังงานจลน์พลาด", skill: "energy" },
  "energy-always-conserved": { label: "Assuming kinetic energy is always conserved", th: "คิดว่าพลังงานจลน์อนุรักษ์เสมอ", skill: "energy" },
} as const satisfies Record<string, { label: string; th: string; skill: Skill }>;

export type MisId = keyof typeof MIS;

/**
 * Errors that break a conservation law (momentum of the system, or treating
 * kinetic energy as conserved when it is not). Used for the logic-consistency
 * metric (paper A4.2).
 */
export const CONSERVATION_VIOLATIONS: readonly string[] = [
  "system-momentum",
  "wrong-denominator",
  "wrong-collision-formula",
  "energy-always-conserved",
  "vector-neglect",
];

export function misLabel(id: string, lang: Lang = "en"): string {
  const m = (MIS as Record<string, { label: string; th: string }>)[id];
  return m ? (lang === "th" ? m.th : m.label) : id;
}
