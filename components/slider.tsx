import React, { useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { C, MONO } from "@/constants/theme";
import { sliderProps } from "@/lib/a11y";
import { fmt } from "@/lib/engine/build";
import { useL } from "@/lib/i18n";
import { makeStyles, tap, useSw } from "@/lib/layout";
import { Text } from "@/lib/text";

/**
 * Drag-or-tap slider that also works from the keyboard (arrow keys, Page Up /
 * Down, Home / End). Controlled: the thumb position is derived from `value`,
 * so presets and resets move it too.
 */
export function Slider({
  label,
  name,
  unit,
  color = C.cyan,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  /** Short visible label, e.g. "m". */
  label: string;
  /** Full name for screen readers, e.g. "Mass of body A". Defaults to the label and unit. */
  name?: string;
  unit: string;
  color?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const s = useStyles();
  const sw = useSw();
  const L = useL();
  const [trackW, setTrackW] = useState(0);
  const thumb = sw(18);
  const frac = (value - min) / (max - min);

  const setFromX = (x: number) => {
    if (trackW <= 0) return;
    const f = Math.min(1, Math.max(0, x / trackW));
    const raw = min + f * (max - min);
    const snapped = Math.round(raw / step) * step;
    onChange(Math.min(max, Math.max(min, Number(snapped.toFixed(4)))));
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => setFromX(e.x))
    .onUpdate((e) => setFromX(e.x));

  return (
    <View style={s.row}>
      <Text style={[s.label, { color }]}>{label}</Text>
      <GestureDetector gesture={pan}>
        <View
          style={s.hit}
          onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
          {...sliderProps({
            label: name ?? L(`${label} in ${unit}`, `${label} หน่วย ${unit}`),
            value,
            min,
            max,
            step,
            text: `${fmt(value)} ${unit}`,
            onChange,
          })}
        >
          <View style={s.track}>
            <View style={[s.fill, { width: frac * trackW, backgroundColor: color }]} />
          </View>
          <View
            style={[
              s.thumb,
              { width: thumb, height: thumb, borderRadius: thumb / 2, backgroundColor: color, left: frac * trackW - thumb / 2 },
            ]}
          />
        </View>
      </GestureDetector>
      <Text style={[s.value, { color }]}>
        {fmt(value)}
        <Text style={s.unit}> {unit}</Text>
      </Text>
    </View>
  );
}

const useStyles = makeStyles((sw) => ({
  row: { flexDirection: "row", alignItems: "center", height: tap(sw) },
  label: { fontFamily: MONO, fontSize: sw(12), width: sw(26) },
  hit: { flex: 1, height: tap(sw), justifyContent: "center", marginHorizontal: sw(10), cursor: "pointer" },
  // Grey, so the empty part stands out from the page (3.3:1) and from the coloured part that is filled.
  track: { height: sw(4), borderRadius: sw(2), backgroundColor: C.off, overflow: "hidden" },
  fill: { height: sw(4), borderRadius: sw(2) },
  thumb: { position: "absolute", top: (tap(sw) - sw(18)) / 2, borderWidth: 2, borderColor: C.bg },
  value: { fontFamily: MONO, fontSize: sw(12), width: sw(82), textAlign: "right" },
  unit: { fontSize: sw(9), color: C.muted },
}));
