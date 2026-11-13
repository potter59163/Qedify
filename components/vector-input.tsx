import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Path } from "react-native-svg";

import { C, MONO } from "@/constants/theme";
import { sliderProps } from "@/lib/a11y";
import { fmt, sfmt } from "@/lib/engine/build";
import { useL } from "@/lib/i18n";
import { makeStyles, tap, useSw } from "@/lib/layout";
import { Text } from "@/lib/text";

const NICE = [1, 2, 2.5, 5, 10];

/** Smallest "nice" number (1, 2, 2.5, 5 × 10ⁿ) that is ≥ x. */
function niceCeil(x: number): number {
  const p = 10 ** Math.floor(Math.log10(x));
  return (NICE.find((n) => n * p >= x - 1e-9) ?? 10) * p;
}

/**
 * Axis for dragging a vector answer. The range is a round number 1.4–2.6 times
 * the answer (the factor comes from the seed, so the answer does not sit at a
 * fixed spot), and the grid is the coarsest round step on which the answer is
 * reachable, so a learner who knows the value can always land on it.
 */
export function vectorScale(answer: number, seed: number): { max: number; step: number } {
  const size = Math.abs(answer);
  if (size < 1e-9) return { max: 10, step: 0.5 };
  const factor = 1.4 + ((Math.abs(seed) % 97) / 97) * 1.2;
  const max = niceCeil(size * factor);
  const p = 10 ** Math.floor(Math.log10(max));
  for (const step of [p / 10, p / 20, p / 40, p / 100, p / 200, p / 400, p / 1000]) {
    if (Math.abs(size / step - Math.round(size / step)) < 1e-6) return { max, step };
  }
  return { max, step: p / 100 };
}

/**
 * Drag-and-drop vector input (paper A5, D1): drag the arrow tip to set the size
 * and, on a signed axis, the direction. The arrow keys and the − and + buttons
 * move one grid step.
 * It is an alternative to typing: both write the same answer.
 */
export function VectorInput({
  value,
  onChange,
  max,
  step,
  signed,
  unit,
  color = C.orange,
}: {
  /** NaN when nothing is entered yet. */
  value: number;
  onChange: (v: number) => void;
  max: number;
  step: number;
  signed: boolean;
  unit: string;
  color?: string;
}) {
  const s = useStyles();
  const sw = useSw();
  const L = useL();
  const [width, setWidth] = useState(0);
  const h = tap(sw, 46);
  const mid = h / 2;
  const pad = sw(14);
  const span = Math.max(1, width - 2 * pad);
  const zero = signed ? width / 2 : pad;
  const perUnit = (signed ? span / 2 : span) / max;
  const shown = Number.isFinite(value) ? Math.max(signed ? -max : 0, Math.min(max, value)) : 0;
  const tip = zero + shown * perUnit;
  const snap = (v: number) => Number((Math.round(v / step) * step).toFixed(6));
  const clamp = (v: number) => Math.max(signed ? -max : 0, Math.min(max, v));

  const setFromX = (x: number) => {
    if (width <= 0) return;
    onChange(clamp(snap((x - zero) / perUnit)));
  };
  const nudge = (dir: 1 | -1) => onChange(clamp(snap((Number.isFinite(value) ? value : 0) + dir * step)));

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => setFromX(e.x))
    .onUpdate((e) => setFromX(e.x));

  const head = sw(9);
  const dir = shown >= 0 ? 1 : -1;
  const arrow =
    Math.abs(tip - zero) < 1
      ? ""
      : `M${zero} ${mid}H${tip - dir * head}M${tip - dir * head} ${mid - head * 0.7}L${tip} ${mid}L${tip - dir * head} ${mid + head * 0.7}Z`;

  return (
    <View style={s.wrap}>
      <View style={s.head}>
        <Text style={s.label}>{L("OR DRAG THE VECTOR", "หรือลากเวกเตอร์")}</Text>
        <Text style={[s.value, { color }]}>
          {Number.isFinite(value) ? (signed ? sfmt(value) : fmt(value)) : "—"} <Text style={s.unit}>{unit}</Text>
        </Text>
      </View>
      <View style={s.row}>
        <Pressable style={s.nudge} onPress={() => nudge(-1)} accessibilityRole="button" accessibilityLabel={L("One step less", "ลดหนึ่งขั้น")}>
          <Text style={s.nudgeText}>−</Text>
        </Pressable>
        <GestureDetector gesture={pan}>
          <View
            style={[s.track, { height: h }]}
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
            {...sliderProps({
              label: L(`Vector in ${unit}: drag, or use the arrow keys`, `เวกเตอร์ หน่วย ${unit}: ลาก หรือใช้ปุ่มลูกศร`),
              value: shown,
              min: signed ? -max : 0,
              max,
              step,
              text: `${signed ? sfmt(shown) : fmt(shown)} ${unit}`,
              onChange,
            })}
          >
            {width > 0 ? (
              <Svg width={width} height={h} aria-hidden>
                <Path d={`M${pad} ${mid}H${width - pad}`} stroke={C.off} strokeWidth={2} strokeLinecap="round" />
                <Path d={`M${zero} ${mid - sw(9)}V${mid + sw(9)}`} stroke={C.muted} strokeWidth={1.5} strokeLinecap="round" />
                {arrow ? <Path d={arrow} stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill={color} /> : null}
              </Svg>
            ) : null}
            <View style={[s.thumb, { left: tip - sw(11), top: mid - sw(11), width: sw(22), height: sw(22), borderRadius: sw(11), borderColor: color }]} />
          </View>
        </GestureDetector>
        <Pressable style={s.nudge} onPress={() => nudge(1)} accessibilityRole="button" accessibilityLabel={L("One step more", "เพิ่มหนึ่งขั้น")}>
          <Text style={s.nudgeText}>+</Text>
        </Pressable>
      </View>
      <View style={s.scale}>
        <Text style={s.tick}>{signed ? `← ${fmt(-max)}` : "0"}</Text>
        {signed ? <Text style={s.tick}>0</Text> : null}
        <Text style={s.tick}>{signed ? `+${fmt(max)} →` : `${fmt(max)} →`}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((sw) => ({
  wrap: {
    marginTop: sw(10),
    borderWidth: 1,
    borderColor: "rgba(255,168,39,0.25)",
    backgroundColor: "rgba(255,168,39,0.04)",
    borderRadius: sw(10),
    paddingVertical: sw(8),
    paddingHorizontal: sw(10),
  },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontFamily: MONO, fontSize: sw(9.5), color: C.muted, letterSpacing: 1 },
  value: { fontFamily: MONO, fontSize: sw(13), fontWeight: "bold" },
  unit: { fontSize: sw(9.5), fontWeight: "normal", color: C.muted },
  row: { flexDirection: "row", alignItems: "center", gap: sw(6), marginTop: sw(2) },
  track: { flex: 1, justifyContent: "center", cursor: "pointer" },
  thumb: { position: "absolute", borderWidth: 2, backgroundColor: C.bg },
  nudge: {
    width: tap(sw),
    height: tap(sw),
    borderRadius: sw(10),
    borderWidth: 1,
    borderColor: C.edge,
    alignItems: "center",
    justifyContent: "center",
  },
  nudgeText: { fontFamily: MONO, fontSize: sw(17), color: C.cyan, lineHeight: sw(20) },
  scale: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: sw(50) },
  tick: { fontFamily: MONO, fontSize: sw(9), color: C.dim },
}));
