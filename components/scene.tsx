import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { Art } from "@/components/art";
import { Icon } from "@/components/icon";
import { C, MONO } from "@/constants/theme";
import { sliderProps, useReduceMotion } from "@/lib/a11y";
import { fmt, sfmt } from "@/lib/engine/build";
import type { ArtName, Scene } from "@/lib/engine/types";
import { useL, type L } from "@/lib/i18n";
import { makeStyles, tap, useLayout, useSw } from "@/lib/layout";
import { Text } from "@/lib/text";
import { Starfield } from "@/lib/ui";

export type ScenePhase = "before" | "after" | "failed";

/** Lets the learner drag the velocity arrows (virtual lab). */
export interface DragVelocity {
  min: number;
  max: number;
  step: number;
  onChange: (body: number, v: number) => void;
}

const backdropLabel = (L: L, b: Scene["backdrop"]) =>
  b === "orbit" ? L("OPEN SPACE", "อวกาศเปิด") : b === "dock" ? L("DOCKING ZONE", "เขตเทียบท่า") : L("IMPACT BUFFER", "แผ่นกันกระแทก");

/** Arrow whose length is proportional to the speed and whose direction follows the sign. */
function VelocityArrow({ v, vmax, color }: { v: number; vmax: number; color: string }) {
  const sw = useSw();
  const len = Math.round(sw(14) + sw(36) * Math.min(1, Math.abs(v) / vmax));
  const h = 12;
  const head = 8;
  const d =
    v > 0
      ? `M1 6H${len - head}M${len - head} 1 ${len - 1} 6 ${len - head} 11z`
      : `M${len - 1} 6H${head}M${head} 1 1 6 ${head} 11z`;
  return (
    <Svg width={len} height={h} viewBox={`0 0 ${len} ${h}`} aria-hidden>
      <Path d={d} stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill={color} />
    </Svg>
  );
}

function BodyView({
  index,
  art,
  name,
  m,
  v,
  vmax,
  vectors,
  values,
  hideVectorSlot,
  momentum,
  linked,
  center,
  tx,
  bob,
  dim,
  color,
  drag,
  zoom,
}: {
  /** How much the stage is magnified on screen; a drag is measured in screen pixels. */
  zoom: number;
  index: number;
  art: ArtName;
  name: string;
  m: number;
  v: number;
  vmax: number;
  vectors: boolean;
  values: boolean;
  hideVectorSlot: boolean;
  momentum: boolean;
  linked: boolean;
  center: number;
  tx: SharedValue<number>;
  bob: SharedValue<number>;
  dim: boolean;
  color: string;
  drag?: DragVelocity;
}) {
  const s = useStyles();
  const sw = useSw();
  const L = useL();
  const col = sw(104);
  const startV = useRef(v);
  const move = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { translateY: bob.value }] }));

  const pxPerUnit = sw(36) / Math.max(1, drag?.max ?? 1);
  const pan = Gesture.Pan()
    .runOnJS(true)
    .enabled(!!drag)
    .minDistance(2)
    .onBegin(() => {
      startV.current = v;
    })
    .onUpdate((e) => {
      if (!drag) return;
      const raw = startV.current + e.translationX / (pxPerUnit * zoom);
      const snapped = Math.round(raw / drag.step) * drag.step;
      const next = Math.max(drag.min, Math.min(drag.max, Number(snapped.toFixed(4))));
      if (next !== v) drag.onChange(index, next);
    });

  const slot = (
    <View
      style={[s.vectorSlot, drag ? s.vectorDrag : null]}
      {...(drag
        ? sliderProps({
            label: L(`Velocity of ${name}: drag, or use the arrow keys`, `ความเร็วของ ${name}: ลาก หรือใช้ปุ่มลูกศร`),
            value: v,
            min: drag.min,
            max: drag.max,
            step: drag.step,
            text: `${sfmt(v)} m/s`,
            onChange: (next) => drag.onChange(index, next),
          })
        : {})}
    >
      {vectors ? (
        v === 0 ? (
          <Text style={[s.rest, { color }]}>{drag ? L("drag ↔ to push", "ลาก ↔ เพื่อผลัก") : L("at rest", "อยู่นิ่ง")}</Text>
        ) : (
          <>
            <VelocityArrow v={v} vmax={vmax} color={color} />
            {values ? <Text style={[s.vLabel, { color }]}>v = {sfmt(v)} m/s</Text> : null}
          </>
        )
      ) : hideVectorSlot ? null : (
        <Text style={s.vHidden}>{L("vectors off", "ซ่อนเวกเตอร์")}</Text>
      )}
    </View>
  );

  return (
    <Animated.View style={[s.body, { width: col, left: center - col / 2, opacity: dim ? 0.35 : 1 }, move]}>
      {drag ? <GestureDetector gesture={pan}>{slot}</GestureDetector> : slot}
      <Art name={art} size={sw(46)} flip={v < 0} />
      <View style={s.nameRow}>
        <Text style={s.name} numberOfLines={1}>
          {name}
        </Text>
        {linked ? <Icon name="link" size={sw(10)} color={C.green} /> : null}
      </View>
      <Text style={s.mass}>{fmt(m)} kg</Text>
      {momentum && v !== 0 ? <Text style={s.pLabel}>p = {sfmt(m * v)}</Text> : null}
    </Animated.View>
  );
}

/**
 * The simulation panel. Before the mission is solved it shows the set-up with
 * velocity vectors; once solved it plays the real outcome computed by the
 * physics engine. Passing `outcome` plays that instead: the mission uses it to
 * show what a wrong answer would really do. At the expert tier the vectors are
 * hidden (fading).
 */
export function SceneView({
  scene,
  vectors,
  momentum = false,
  phase,
  shake,
  outcome,
  values = true,
  tag,
  compact = false,
  drag,
}: {
  scene: Scene;
  vectors: boolean;
  /** Also label each body's momentum. Off in missions, where it is often the answer. */
  momentum?: boolean;
  phase: ScenePhase;
  /** Increment to shake the scene (wrong answer). */
  shake: number;
  /** Velocities to play in the "after" phase instead of the mission's real outcome. */
  outcome?: { v: number[]; merged?: boolean };
  /** Show the numbers next to the arrows. */
  values?: boolean;
  /** Replaces the BEFORE / AFTER tag, e.g. "YOUR ANSWER". */
  tag?: string;
  /** Shorter panel, for use inside a dialog. */
  compact?: boolean;
  drag?: DragVelocity;
}) {
  const s = useStyles();
  const sw = useSw();
  const L = useL();
  const reduced = useReduceMotion();
  const [width, setWidth] = useState(0);
  const { bp } = useLayout();
  // On a desktop the simulation is the centrepiece, so the whole stage is drawn 1.3× larger.
  const zoom = !compact && bp === "desktop" ? 1.3 : 1;
  const stageW = width / zoom;
  const two = scene.bodies.length > 1;
  // Keep the bodies a comfortable distance apart on very wide panels.
  const spread = Math.min(stageW * 0.46, sw(260));
  const centers = two ? [stageW / 2 - spread / 2, stageW / 2 + spread / 2] : [stageW * 0.4];
  const played = outcome ?? scene.after;
  const after = phase === "after" && played ? played : null;
  const wrong = !!outcome;
  const vmax = Math.max(1, ...scene.bodies.map((b) => Math.abs(b.v)), ...(played?.v ?? []).map(Math.abs));

  const bob = useSharedValue(0);
  const tx0 = useSharedValue(0);
  const tx1 = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const flash = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      cancelAnimation(bob);
      bob.value = 0;
      return;
    }
    bob.value = withRepeat(
      withSequence(
        withTiming(-sw(4), { duration: 1900, easing: Easing.inOut(Easing.sin) }),
        withTiming(sw(4), { duration: 1900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [bob, sw, reduced]);

  useEffect(() => {
    if (shake === 0 || reduced) return;
    shakeX.value = withSequence(
      withTiming(7, { duration: 50 }),
      withTiming(-7, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [shake, shakeX, reduced]);

  useEffect(() => {
    if (phase === "failed") {
      flash.value = withSequence(withTiming(1, { duration: 120 }), withDelay(900, withTiming(0.85, { duration: 300 })));
      return;
    }
    if (phase !== "after" || !played || width === 0) {
      tx0.value = 0;
      tx1.value = 0;
      return;
    }
    const slide = (to: number, ms: number, easing = Easing.out(Easing.cubic)) => (reduced ? to : withTiming(to, { duration: ms, easing }));
    const reach = sw(44);
    const outV = played.v;
    const scaleV = Math.max(1, ...outV.map(Math.abs));
    if (two) {
      // Close the gap first, then drift apart (or together) with the outcome velocities.
      const gap = (spread - sw(66)) / 2;
      const meet = scene.bodies[0].v > scene.bodies[1].v ? gap : 0;
      const end0 = meet + (outV[0] / scaleV) * reach;
      const end1 = -meet + (outV[1] / scaleV) * reach;
      tx0.value = reduced ? end0 : withSequence(slide(meet, 550, Easing.in(Easing.quad)), slide(end0, 1000));
      tx1.value = reduced ? end1 : withSequence(slide(-meet, 550, Easing.in(Easing.quad)), slide(end1, 1000));
    } else {
      const dir = outV[0] === 0 ? Math.sign(scene.bodies[0].v) || 1 : Math.sign(outV[0]);
      tx0.value = slide(dir * sw(outV[0] === 0 ? 34 : 70), 1000);
    }
    // The animation targets depend only on the phase, the (stable) scene and outcome, and the measured width.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, scene, played, width]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const txs = [tx0, tx1];
  const accent = wrong ? C.orange : C.green;
  const describe = (name: string, m: number, v: number) =>
    v === 0
      ? L(`${name}, ${fmt(m)} kilograms, at rest`, `${name} มวล ${fmt(m)} กิโลกรัม อยู่นิ่ง`)
      : L(
          `${name}, ${fmt(m)} kilograms, moving ${v > 0 ? "right" : "left"} at ${fmt(Math.abs(v))} metres per second`,
          `${name} มวล ${fmt(m)} กิโลกรัม เคลื่อนที่ไปทาง${v > 0 ? "ขวา" : "ซ้าย"}ที่ ${fmt(Math.abs(v))} เมตรต่อวินาที`,
        );

  return (
    <View
      style={[s.wrap, compact && s.compact, wrong && s.wrapWrong, zoom !== 1 && { height: sw(196) * zoom }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      // A picture for screen readers; in the lab it is a group, so the draggable arrows inside stay reachable.
      accessible={!drag}
      role={drag ? "group" : "img"}
      accessibilityLabel={`${L("Simulation", "การจำลอง")}: ${scene.bodies.map((b, i) => describe(b.name, b.m, after ? after.v[i] : b.v)).join("; ")}`}
    >
      <Starfield count={compact ? 10 : 16} />
      <Text style={s.backdrop}>{backdropLabel(L, scene.backdrop)}</Text>
      <View style={[s.tag, after ? { borderColor: accent + "66", backgroundColor: accent + "14" } : null]}>
        <Text style={[s.tagText, after ? { color: accent } : null]}>{tag ?? (after ? L("AFTER", "หลัง") : L("BEFORE", "ก่อน"))}</Text>
      </View>
      {scene.backdrop !== "orbit" ? <View style={[s.rail, { top: sw(112) * zoom }]} /> : null}
      <Animated.View style={[{ flex: 1 }, shakeStyle]}>
        <View style={{ width: stageW, height: sw(196), transform: [{ scale: zoom }], transformOrigin: "top left" }}>
        {width > 0
          ? scene.bodies.map((b, i) => (
              <BodyView
                key={i}
                index={i}
                art={b.art}
                name={b.name}
                m={b.m}
                v={after ? after.v[i] : b.v}
                vmax={vmax}
                // Locked together they share one velocity, so one arrow is enough.
                vectors={(vectors || !!after) && !(after?.merged && i === 1)}
                values={values}
                hideVectorSlot={!!after?.merged && i === 1}
                momentum={momentum}
                linked={!!after?.merged && two}
                center={centers[i]}
                tx={txs[i]}
                bob={bob}
                dim={phase === "failed"}
                color={after && wrong ? C.orange : C.cyan}
                drag={after ? undefined : drag}
                zoom={zoom}
              />
            ))
          : null}
        </View>
      </Animated.View>
      {phase === "failed" ? (
        <Animated.View style={[s.crash, flashStyle]} pointerEvents="none">
          <Icon name="burst" size={sw(54)} color="#ff5555" />
          <Text style={s.crashText}>{L("MISSION LOST", "ภารกิจล้มเหลว")}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((sw) => ({
  wrap: {
    height: sw(196),
    backgroundColor: "rgba(0,200,255,0.03)",
    borderWidth: 1,
    borderColor: C.lineSoft,
    borderRadius: sw(14),
    overflow: "hidden",
  },
  compact: { height: sw(168), alignSelf: "stretch" },
  wrapWrong: { borderColor: "rgba(255,168,39,0.35)", backgroundColor: "rgba(255,168,39,0.04)" },
  backdrop: { position: "absolute", left: sw(12), top: sw(9), fontFamily: MONO, fontSize: sw(8.5), letterSpacing: 2, color: C.dim },
  tag: {
    position: "absolute",
    right: sw(12),
    top: sw(7),
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: sw(6),
    paddingHorizontal: sw(7),
    paddingVertical: sw(2),
  },
  tagText: { fontFamily: MONO, fontSize: sw(8.5), letterSpacing: 1.5, color: C.cyan },
  rail: { position: "absolute", left: 0, right: 0, top: sw(112), height: 1, backgroundColor: "rgba(0,200,255,0.18)" },
  body: { position: "absolute", top: sw(28), alignItems: "center" },
  vectorSlot: { height: sw(34), alignItems: "center", justifyContent: "flex-end", marginBottom: sw(4), alignSelf: "stretch" },
  vectorDrag: {
    height: tap(sw),
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: C.edge,
    borderRadius: sw(8),
    cursor: "pointer",
    paddingBottom: sw(2),
  },
  vLabel: { fontFamily: MONO, fontSize: sw(9.5), marginTop: sw(2) },
  vHidden: { fontFamily: MONO, fontSize: sw(8.5), color: C.dim, letterSpacing: 1 },
  rest: { fontFamily: MONO, fontSize: sw(9.5) },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: sw(2) },
  name: { fontFamily: MONO, fontSize: sw(9.5), color: C.muted, letterSpacing: 1 },
  mass: { fontFamily: MONO, fontSize: sw(11), color: C.text, marginTop: 1 },
  pLabel: { fontFamily: MONO, fontSize: sw(9.5), color: C.orange, marginTop: 1 },
  crash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(6,13,31,0.6)",
  },
  crashText: { fontFamily: MONO, fontSize: sw(15), fontWeight: "bold", letterSpacing: 2, color: "#ff5555", marginTop: sw(4) },
}));
