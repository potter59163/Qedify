import { Platform } from "react-native";

export type CoachTask = "hint" | "debrief" | "insights";

export type CoachReply =
  | { ok: true; text: string }
  | { ok: false; reason: "unconfigured" | "offline" | "busy" | "error" };

/**
 * When the server reports that no API key is configured, stop asking for a
 * while instead of sending a doomed request on every hint.
 */
const UNCONFIGURED_BACKOFF_MS = 5 * 60_000;
let unconfiguredUntil = 0;

/**
 * Where the coach endpoint lives. On the web it is same-origin (`/api/coach`).
 * Native builds have no origin, so they need EXPO_PUBLIC_API_BASE.
 */
function apiBase(): string | null {
  const env = process.env.EXPO_PUBLIC_API_BASE;
  if (env) return env.replace(/\/$/, "");
  return Platform.OS === "web" ? "" : null;
}

/**
 * Ask the Claude-backed coach. The context is structured mission data only —
 * no name, email or free-form chat is ever sent. Every failure resolves to a
 * reason so callers can fall back to the built-in rule-based feedback.
 */
export async function askCoach(
  task: CoachTask,
  context: Record<string, unknown>,
  lang: "en" | "th",
  timeoutMs = 25000,
): Promise<CoachReply> {
  const base = apiBase();
  if (base === null || Date.now() < unconfiguredUntil) return { ok: false, reason: "unconfigured" };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/api/coach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, lang, context }),
      signal: ctrl.signal,
    });
    if (res.status === 503) {
      unconfiguredUntil = Date.now() + UNCONFIGURED_BACKOFF_MS;
      return { ok: false, reason: "unconfigured" };
    }
    if (res.status === 429) return { ok: false, reason: "busy" };
    if (!res.ok) return { ok: false, reason: "error" };
    const data: unknown = await res.json();
    const text = (data as { text?: unknown })?.text;
    return typeof text === "string" && text.trim() ? { ok: true, text: text.trim() } : { ok: false, reason: "error" };
  } catch {
    return { ok: false, reason: "offline" };
  } finally {
    clearTimeout(timer);
  }
}

/** Why the coach did not answer, and what is shown instead (`what` names the fallback). */
export function coachFailureText(
  reason: Exclude<CoachReply, { ok: true }>["reason"],
  lang: "en" | "th" = "en",
  what: "hint" | "insights" = "hint",
): string {
  const th = lang === "th";
  const shown = th
    ? what === "hint"
      ? "แสดงคำใบ้ที่มีในตัวแอปแทน"
      : "แสดงข้อมูลเชิงลึกที่มีในตัวแอปแทน"
    : `Showing the built-in ${what}.`;
  switch (reason) {
    case "unconfigured":
      return th ? `เซิร์ฟเวอร์นี้ยังไม่ได้เชื่อมต่อโค้ช AI ${shown}` : `AI coach is not connected on this server. ${shown}`;
    case "busy":
      return th ? `โค้ช AI กำลังไม่ว่าง ${shown}` : `AI coach is busy right now. ${shown}`;
    case "offline":
      return th ? `ติดต่อโค้ช AI ไม่ได้ ${shown}` : `Can't reach the AI coach. ${shown}`;
    default:
      return th ? `โค้ช AI เกิดปัญหา ${shown}` : `AI coach had a problem. ${shown}`;
  }
}
