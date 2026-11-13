import { Platform } from "react-native";

/** One palette for the whole app: deep-space navy with neon cyan accents. */
export const C = {
  bg: "#060d1f",
  bgDeep: "#010409",
  stage: "#0a1020",
  panel: "rgba(6,13,31,0.95)",
  card: "rgba(10,22,40,0.85)",
  cardSoft: "rgba(0,200,255,0.06)",
  modal: "#0d1b2e",

  line: "rgba(0,200,255,0.2)",
  lineSoft: "rgba(0,200,255,0.12)",
  lock: "rgba(100,120,150,0.3)",
  /** Border of an input, an unselected option or a slider track: 3.65:1 on the page background, 3.26:1 on a field fill (WCAG 1.4.11). */
  edge: "rgba(0,200,255,0.55)",
  /** A lost heart or an unearned star: still 3.3:1 on the page background. */
  off: "#55667a",

  cyan: "#00c8ff",
  cyanBright: "#00eeff",
  teal: "#00ffd5",
  blue: "#0d4eaa",
  /** Top of the primary button gradient: dark enough for white text (WCAG AA). */
  blueTop: "#0b74c6",
  /** Text on orange buttons. */
  onOrange: "#1a1000",
  green: "#00ff9f",
  greenDark: "#00b870",
  orange: "#ffa827",
  orangeDark: "#e67e00",
  red: "#ff4757",
  redSoft: "#f87171",
  purple: "#a78bfa",
  lilac: "#c4b5fd",
  violet: "#5b45e0",

  text: "#e8f4ff",
  muted: "#8899aa",
  dim: "#73859a",
} as const;

export const MONO = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: '"SF Mono", SFMono-Regular, Menlo, Consolas, "Courier New", monospace',
}) as string;

/** Avatar ids and the suit colour each one wears (drawn in components/art.tsx). */
export const AVATARS = ["a1", "a2", "a3", "a4"] as const;
export const AVATAR_COLOR: Record<string, string> = { a1: "#00c8ff", a2: "#ffa827", a3: "#00ff9f", a4: "#a78bfa" };
