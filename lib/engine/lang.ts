/** Languages the app speaks. */
export type Lang = "en" | "th";

/** Picks the string for the current language: `L("Hint", "คำใบ้")`. */
export type L = (en: string, th: string) => string;

const EN: L = (en) => en;
const TH: L = (_en, th) => th;

/** One stable function per language, so memoised components only re-render when the language changes. */
export const pick = (lang: Lang = "en"): L => (lang === "th" ? TH : EN);

/** Words used as subscripts in formulas, e.g. p_before, v_final. */
const SUBSCRIPT_TH: Record<string, string> = {
  final: "หลัง",
  initial: "ก่อน",
  before: "ก่อน",
  after: "หลัง",
  total: "รวม",
  ship: "ยาน",
  gas: "แก๊ส",
  astronaut: "นักบิน",
  toolkit: "กล่อง",
  target: "เป้า",
  canister: "ถัง",
  drone: "โดรน",
};
const SUBSCRIPT = new RegExp(`_(${Object.keys(SUBSCRIPT_TH).join("|")})\\b`, "g");

/**
 * Thai text keeps the physics symbols (p, v, J, KE) but reads better with Thai
 * subscripts: p_before → p_ก่อน. Applied to every string of a mission or a
 * briefing, however deeply nested; numbers and everything else pass through.
 */
export function thaiSubscripts<T>(x: T): T {
  if (typeof x === "string") return x.replace(SUBSCRIPT, (_, word: string) => `_${SUBSCRIPT_TH[word]}`) as T;
  if (Array.isArray(x)) return x.map((item) => thaiSubscripts(item)) as T;
  if (x && typeof x === "object") {
    return Object.fromEntries(Object.entries(x).map(([key, value]) => [key, thaiSubscripts(value)])) as T;
  }
  return x;
}

/** A string kept in both languages, for tables defined outside components. */
export type Bi = readonly [en: string, th: string];
