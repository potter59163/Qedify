import React from "react";
import Svg, { Path } from "react-native-svg";

import { C } from "@/constants/theme";
import type { IconName } from "@/lib/engine/types";

/** Circle and rounded-rectangle as path data, so every icon is just paths. */
const circ = (x: number, y: number, r: number) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;

/** `s` is stroked, `f` is filled. All icons are drawn on a 24 × 24 grid. */
const ICONS: Record<IconName, { s?: string; f?: string }> = {
  home: { s: "M3 11 12 3l9 8M5 9.5V20h5v-6h4v6h5V9.5" },
  book: { s: "M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h12M9 8h6" },
  trophy: { s: "M8 4h8v6a4 4 0 0 1-8 0zM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 14v4M8 20h8" },
  user: { s: `${circ(12, 8, 4)}M4 21a8 8 0 0 1 16 0` },
  bolt: { f: "M13 2 4 14h6l-1 8 9-12h-6z" },
  flame: { f: "M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-2 1-4 2-5 0 2 1 3 2 3 0-3-1-6 2-10z" },
  star: { f: "M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6-5.9-3.2-5.9 3.2 1.2-6.6L2.5 9.5l6.6-.9z" },
  heart: { f: "M12 20.5S4.5 15.9 4.5 10.3A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" },
  lock: { s: `${rr(5, 10.5, 14, 9.5, 2)}M8 10.5V7.5a4 4 0 0 1 8 0v3` },
  check: { s: "M5 12.5l4.5 4.5L19 7.5" },
  x: { s: "M6 6l12 12M18 6 6 18" },
  bulb: { s: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z" },
  clock: { s: `${circ(12, 12, 9)}M12 7v5l3 2` },
  flask: { s: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M7.5 15h9" },
  gear: { s: `${circ(12, 12, 3.5)}M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1` },
  skull: {
    s: "M12 3a8 8 0 0 0-8 8c0 2.7 1.4 4.6 3 5.7V20h10v-3.3c1.6-1.1 3-3 3-5.7a8 8 0 0 0-8-8zM10 20v-2M14 20v-2",
    f: circ(9, 11.5, 1.6) + circ(15, 11.5, 1.6),
  },
  target: { s: circ(12, 12, 9) + circ(12, 12, 5), f: circ(12, 12, 1.5) },
  scale: { s: "M12 4v16M7 20h10M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z" },
  arrows: { s: "M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4" },
  box: { s: "M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8" },
  stop: { s: "M8.5 3h7L21 8.5v7L15.5 21h-7L3 15.5v-7zM8 12h8" },
  battery: { s: `${rr(3, 8, 16, 8, 2)}M21 11v2M7 12h5` },
  magnet: { s: "M6 4v8a6 6 0 0 0 12 0V4h-4v8a2 2 0 0 1-4 0V4zM6 8h4M14 8h4" },
  search: { s: `${circ(11, 11, 6)}M20 20l-4.3-4.3` },
  wind: { s: "M3 9h10a3 3 0 1 0-3-3M3 15h14a3 3 0 1 1-3 3M3 12h6" },
  spring: { s: "M3 12h2l2-5 3 10 3-10 3 10 2-5h3" },
  shield: { s: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" },
  disc: { s: circ(12, 12, 8) + circ(12, 12, 3) },
  foam: { s: rr(4, 7, 16, 10, 3), f: circ(9, 11, 1) + circ(14, 10, 1) + circ(12, 14, 1) + circ(16, 14, 1) },
  balloon: { s: "M12 3a6.5 6.5 0 0 0-6.5 6.5C5.5 14 9 17 12 17s6.5-3 6.5-7.5A6.5 6.5 0 0 0 12 3zM12 17v4" },
  thermo: { s: "M10 5a2 2 0 0 1 4 0v8.5a4 4 0 1 1-4 0z", f: circ(12, 17, 1.5) },
  void: { s: "M12 4a8 8 0 0 1 8 8M12 20a8 8 0 0 1-8-8M4.5 9A8 8 0 0 1 9 4.5M19.5 15a8 8 0 0 1-4.5 4.5" },
  "arrow-left": { s: "M19 12H5M11 6l-6 6 6 6" },
  "arrow-right": { s: "M5 12h14M13 6l6 6-6 6" },
  hourglass: { s: "M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" },
  zero: { s: "M12 4c-3 0-4.5 3.5-4.5 8s1.5 8 4.5 8 4.5-3.5 4.5-8S15 4 12 4z" },
  question: { s: "M9 9a3 3 0 1 1 4.5 2.6c-.9.5-1.5 1.2-1.5 2.4", f: circ(12, 18, 1.1) },
  equal: { s: "M6 9h12M6 15h12" },
  robot: { s: `${rr(5, 8, 14, 11, 2.5)}M12 4v4M9 15.5h6`, f: circ(12, 3.5, 1.2) + circ(9.5, 12, 1.2) + circ(14.5, 12, 1.2) },
  chart: { s: "M3 20h18M6 20v-7M11 20V6M16 20V10" },
  medal: { s: `${circ(12, 15, 5)}M9 10.5 6 3h4l2 4 2-4h4l-3 7.5` },
  crown: { s: "M4 18h16M4 18 3 7l5 4 4-7 4 7 5-4-1 11" },
  refresh: { s: "M20 11a8 8 0 0 0-14.5-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14.5 4L20 15M20 20v-5h-5" },
  warning: { s: "M12 3 2 20h20zM12 10v4", f: circ(12, 17, 1) },
  sparkles: { f: "M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" },
  rocket: { s: "M12 3c3 2.5 4.5 6 4.5 10l-2 3h-5l-2-3C7.5 9 9 5.5 12 3zM9.5 16 8 20l4-1.5 4 1.5-1.5-4", f: circ(12, 10, 1.6) },
  satellite: {
    s: `${rr(2.5, 10, 5, 4, 0.5)}${rr(16.5, 10, 5, 4, 0.5)}${rr(9.5, 8.5, 5, 7, 1)}M7.5 12h2M14.5 12h2M12 8.5V5.5`,
    f: circ(12, 4.5, 1),
  },
  pod: { s: `${rr(3, 7, 18, 9, 2.5)}M7 10h3M14 10h3${circ(7.5, 18.5, 1.8)}${circ(16.5, 18.5, 1.8)}` },
  astronaut: { s: `${circ(12, 8, 4.5)}M6 21v-3a6 6 0 0 1 12 0v3M9.5 8h5` },
  burst: { s: "M12 2l2 6 6-2-4 5 5 3-6 1 1 6-4-5-4 5 1-6-6-1 5-3-4-5 6 2z" },
  ban: { s: `${circ(12, 12, 9)}M5.6 5.6l12.8 12.8` },
  globe: { s: `${circ(12, 12, 9)}M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18` },
  clipboard: { s: `${rr(5, 5, 14, 16, 2)}M9 5V3.5h6V5M8.5 11h7M8.5 15h5` },
  play: { f: "M8 5l11 7-11 7z" },
  "chevron-right": { s: "M9 6l6 6-6 6" },
  "chevron-down": { s: "M6 9l6 6 6-6" },
  "chevron-up": { s: "M6 15l6-6 6 6" },
  link: {
    s: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  },
  info: { s: `${circ(12, 12, 9)}M12 11v6`, f: circ(12, 7.5, 1.1) },
  trash: { s: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" },
  flag: { s: "M6 21V4M6 4h11l-2 4 2 4H6" },
  school: { s: "M3 9l9-5 9 5-9 5zM7 11.5V16c0 1.5 2.5 3 5 3s5-1.5 5-3v-4.5M21 9v6" },
};

/**
 * Line icon. Decorative by default (hidden from screen readers); pass `label`
 * when the icon carries meaning on its own.
 */
export const Icon = React.memo(function Icon({
  name,
  size = 20,
  color = C.text,
  label,
}: {
  name: IconName;
  size?: number;
  color?: string;
  label?: string;
}) {
  const icon = ICONS[name];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...(label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true })}
    >
      {icon.f ? <Path d={icon.f} fill={color} /> : null}
      {icon.s ? <Path d={icon.s} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /> : null}
    </Svg>
  );
});
