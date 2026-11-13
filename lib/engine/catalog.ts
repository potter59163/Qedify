import { thaiSubscripts, type Lang } from "./lang";
import { MISSIONS_A } from "./missions-a";
import { MISSIONS_B } from "./missions-b";
import type { MissionDef, Skill, Tier } from "./types";

/** Every mission, in unlock order. In Thai the subscripts of the formulas are Thai too. */
export const MISSIONS: MissionDef[] = [...MISSIONS_A, ...MISSIONS_B].map((def) => ({
  ...def,
  build: (rng, tier, lang) => (lang === "th" ? thaiSubscripts(def.build(rng, tier, lang)) : def.build(rng, tier, lang)),
}));

export const missionById = (id: string | undefined): MissionDef | undefined =>
  MISSIONS.find((m) => m.id === id);

export const missionsOf = (chapter: number): MissionDef[] =>
  MISSIONS.filter((m) => m.chapter === chapter);

/** Thai titles and taglines, by mission id. The verifier checks that every mission has one. */
export const MISSION_TH: Record<string, { title: string; tagline: string }> = {
  "cargo-check": { title: "ตรวจสินค้า", tagline: "พื้นฐาน p = mv" },
  "heavy-or-fast": { title: "หนักหรือเร็ว?", tagline: "เปรียบเทียบโมเมนตัม" },
  "opposite-lanes": { title: "สวนเลน", tagline: "โมเมนตัมเป็นเวกเตอร์" },
  "tug-assist": { title: "ยานลากช่วยเหลือ", tagline: "ทำโมเมนตัมให้ตรงเป้า" },
  "orbital-rescue": { title: "กู้ภัยในวงโคจร", tagline: "J = FΔt ในแบบของคุณ" },
  "full-stop": { title: "หยุดสนิท", tagline: "การดลเพื่อหยุดยาน" },
  "crash-test": { title: "ทดสอบการชน", tagline: "เวลามากขึ้น แรงน้อยลง" },
  "burn-window": { title: "ช่วงจุดเครื่องยนต์", tagline: "การดลเปลี่ยนความเร็ว" },
  "the-junction": { title: "ชุมทาง", tagline: "เชื่อมต่อแล้วไปด้วยกัน" },
  recoil: { title: "แรงถีบกลับ", tagline: "ผลักออก แล้วลอยถอยหลัง" },
  "head-on": { title: "เทียบท่าหัวชนหัว", tagline: "กฎอนุรักษ์แบบมีทิศทาง" },
  "mass-ejection": { title: "พ่นมวล", tagline: "โยนมวลเพื่อเคลื่อนที่" },
  "bounce-or-stick": { title: "เด้งหรือติด?", tagline: "จำแนกด้วยพลังงานจลน์" },
  "elastic-transfer": { title: "ส่งต่อแบบยืดหยุ่น", tagline: "ชนแล้วส่งต่อความเร็ว" },
  "energy-audit": { title: "ตรวจบัญชีพลังงาน", tagline: "พลังงานหายไปไหน?" },
  "clamp-or-bumper": { title: "ตัวล็อกหรือกันชน?", tagline: "เลือกการชนให้ถูกแบบ" },
  "crisis-protocol": { title: "ภาวะวิกฤต", tagline: "BOSS · ทุกเรื่องในด่านเดียว" },
};

/** Title and tagline of a mission in the given language. */
export function missionText(def: MissionDef, lang: Lang): { title: string; tagline: string } {
  return (lang === "th" && MISSION_TH[def.id]) || def;
}

export interface ChapterDef {
  id: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  th: { title: string; description: string };
  /** 1–4 dots on the chapter card. */
  difficulty: number;
  color: string;
}

export const CHAPTERS: ChapterDef[] = [
  {
    id: 1,
    title: "Momentum Fundamentals",
    description: "Master p = mv, vector directions, and momentum as a physical quantity.",
    th: { title: "พื้นฐานโมเมนตัม", description: "เข้าใจ p = mv ทิศของเวกเตอร์ และโมเมนตัมในฐานะปริมาณทางฟิสิกส์" },
    difficulty: 1,
    color: "#00ff9f",
  },
  {
    id: 2,
    title: "Impulse & Force",
    description: "Explore J = FΔt = Δp and how collision time changes the force of an impact.",
    th: { title: "การดลและแรง", description: "สำรวจ J = FΔt = Δp และดูว่าช่วงเวลาที่ชนเปลี่ยนแรงกระแทกอย่างไร" },
    difficulty: 2,
    color: "#00c8ff",
  },
  {
    id: 3,
    title: "Conservation Laws",
    description: "Apply momentum conservation to docking, recoil and mass ejection.",
    th: { title: "กฎการอนุรักษ์", description: "ใช้กฎการอนุรักษ์โมเมนตัมกับการเทียบท่า การถอยหลัง และการพ่นมวล" },
    difficulty: 3,
    color: "#ffa827",
  },
  {
    id: 4,
    title: "Collision Mastery",
    description: "Elastic vs inelastic collisions, kinetic energy analysis, crisis scenarios.",
    th: { title: "เชี่ยวชาญการชน", description: "การชนแบบยืดหยุ่นและไม่ยืดหยุ่น การวิเคราะห์พลังงานจลน์ และสถานการณ์วิกฤต" },
    difficulty: 4,
    color: "#ff4757",
  },
];

/** Title and description of a chapter in the given language. */
export function chapterText(ch: ChapterDef, lang: Lang): { title: string; description: string } {
  return lang === "th" ? ch.th : ch;
}

export const SKILLS: Record<Skill, { label: string; th: string; chapter: number }> = {
  momentum: { label: "Momentum (p = mv)", th: "โมเมนตัม (p = mv)", chapter: 1 },
  vector: { label: "Vector direction", th: "ทิศของเวกเตอร์", chapter: 1 },
  impulse: { label: "Impulse (J = FΔt)", th: "การดล (J = FΔt)", chapter: 2 },
  "force-time": { label: "Force–time trade-off", th: "แรงกับช่วงเวลาที่ชน", chapter: 2 },
  conservation: { label: "Momentum conservation", th: "การอนุรักษ์โมเมนตัม", chapter: 3 },
  "collision-type": { label: "Collision types", th: "ชนิดของการชน", chapter: 4 },
  energy: { label: "Kinetic energy analysis", th: "การวิเคราะห์พลังงานจลน์", chapter: 4 },
};

export const skillLabel = (k: Skill, lang: Lang): string => (lang === "th" ? SKILLS[k].th : SKILLS[k].label);

export const SKILL_ORDER = Object.keys(SKILLS) as Skill[];

/** English tier names. Also what the AI coach is told. */
export const TIER_NAME: Record<Tier, string> = { 0: "GUIDED", 1: "STANDARD", 2: "EXPERT" };

const TIER_TH: Record<Tier, string> = { 0: "มีผู้ช่วย", 1: "มาตรฐาน", 2: "เชี่ยวชาญ" };

export const tierName = (t: Tier, lang: Lang): string => (lang === "th" ? TIER_TH[t] : TIER_NAME[t]);

/** Support policy per tier: scaffolding fades as the learner improves (paper M3). */
export const SUPPORT: Record<
  Tier,
  { maxHints: number; scaffoldAfter: number; vectors: boolean; formula: boolean; time: number; stallSeconds: number }
> = {
  0: { maxHints: 3, scaffoldAfter: 1, vectors: true, formula: true, time: 1.25, stallSeconds: 40 },
  1: { maxHints: 2, scaffoldAfter: 2, vectors: true, formula: true, time: 1, stallSeconds: 60 },
  2: { maxHints: 1, scaffoldAfter: 3, vectors: false, formula: false, time: 0.85, stallSeconds: 90 },
};
