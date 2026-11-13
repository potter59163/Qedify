import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/icon";
import { SceneView } from "@/components/scene";
import { Slider } from "@/components/slider";
import { C, MONO } from "@/constants/theme";
import { radioGroup } from "@/lib/a11y";
import { fmt, sfmt } from "@/lib/engine/build";
import type { Scene } from "@/lib/engine/types";
import { useL, type Bi } from "@/lib/i18n";
import { makeStyles, tap } from "@/lib/layout";
import { goBack } from "@/lib/nav";
import { play } from "@/lib/sound";
import { useGame } from "@/lib/store";
import { Text } from "@/lib/text";
import { Btn, Card, Kicker, Page, Screen, Split, TopBar } from "@/lib/ui";

type Mode = "elastic" | "inelastic";

const PRESETS: { label: Bi; m1: number; v1: number; m2: number; v2: number }[] = [
  { label: ["Equal masses", "มวลเท่ากัน"], m1: 1000, v1: 8, m2: 1000, v2: 0 },
  { label: ["Heavy → light", "หนัก → เบา"], m1: 3000, v1: 6, m2: 500, v2: 0 },
  { label: ["Light → heavy", "เบา → หนัก"], m1: 500, v1: 10, m2: 3000, v2: 0 },
  { label: ["Head-on", "ชนประสานงา"], m1: 1500, v1: 6, m2: 1000, v2: -4 },
];

const V_RANGE = { min: -20, max: 20, step: 0.5 };

const ke = (m: number, v: number) => 0.5 * m * v * v;

/** 1-D collision between A (left) and B (right). Returns null when A never reaches B. */
function collide(m1: number, v1: number, m2: number, v2: number, mode: Mode) {
  if (v1 <= v2) return null;
  const M = m1 + m2;
  if (mode === "inelastic") {
    const vf = (m1 * v1 + m2 * v2) / M;
    return { v1f: vf, v2f: vf };
  }
  return {
    v1f: ((m1 - m2) * v1 + 2 * m2 * v2) / M,
    v2f: ((m2 - m1) * v2 + 2 * m1 * v1) / M,
  };
}

export default function Lab() {
  const s = useStyles();
  const router = useRouter();
  const L = useL();
  const { dispatch } = useGame();
  const [m1, setM1] = useState(1000);
  const [v1, setV1] = useState(8);
  const [m2, setM2] = useState(1000);
  const [v2, setV2] = useState(0);
  const [mode, setMode] = useState<Mode>("elastic");
  const [ran, setRan] = useState(false);
  // Order in which the variables were adjusted since the last run (paper M4.1).
  const path = useRef<string[]>([]);

  // Any change to the set-up returns the scene to "before" and is added to the path.
  const edit = (what: string, fn: () => void) => {
    setRan(false);
    if (path.current[path.current.length - 1] !== what && path.current.length < 40) path.current.push(what);
    fn();
  };

  const out = collide(m1, v1, m2, v2, mode);
  const scene: Scene = {
    backdrop: "dock",
    bodies: [
      { art: "rocket", name: "A", m: m1, v: v1 },
      { art: "satellite", name: "B", m: m2, v: v2 },
    ],
    after: out ? { v: [out.v1f, out.v2f], merged: mode === "inelastic" } : undefined,
  };
  const pBefore = m1 * v1 + m2 * v2;
  const keBefore = ke(m1, v1) + ke(m2, v2);
  const pAfter = out ? m1 * out.v1f + m2 * out.v2f : null;
  const keAfter = out ? ke(m1, out.v1f) + ke(m2, out.v2f) : null;

  const run = () => {
    if (ran) {
      setRan(false);
      return;
    }
    dispatch({ type: "lab", event: { ts: Date.now(), m1, v1, m2, v2, mode, path: path.current } });
    path.current = [];
    play("collide");
    setRan(true);
  };

  return (
    <Screen>
      <TopBar
        title={L("VIRTUAL LAB", "ห้องทดลองเสมือน")}
        subtitle={L("Free exploration · nothing is graded", "สำรวจได้อิสระ · ไม่มีการให้คะแนน")}
        onBack={() => goBack(router)}
        width="wide"
      />
      <Page width="wide">
        <View style={{ height: 16 }} />
        <Split
          gap={28}
          left={
            <>
              <SceneView
                scene={scene}
                vectors
                momentum
                phase={ran && out ? "after" : "before"}
                shake={0}
                drag={{
                  ...V_RANGE,
                  onChange: (body, v) => edit(body === 0 ? "v1" : "v2", () => (body === 0 ? setV1(v) : setV2(v))),
                }}
              />
              <Text style={s.dragHint}>
                {L("Drag a velocity arrow left or right to set its size and direction.", "ลากลูกศรความเร็วไปทางซ้ายหรือขวาเพื่อกำหนดขนาดและทิศทาง")}
              </Text>
              <Card tone={ran ? "green" : "cyan"} style={{ marginTop: 12 }}>
                <Text style={[s.cardTitle, ran && { color: C.green }]}>{L("CONSERVATION CHECK", "ตรวจกฎการอนุรักษ์")}</Text>
                <View style={s.tableRow}>
                  <Text style={s.th} />
                  <Text style={s.th}>{L("BEFORE", "ก่อน")}</Text>
                  <Text style={s.th}>{L("AFTER", "หลัง")}</Text>
                </View>
                <View style={s.tableRow}>
                  <Text style={s.td0}>{L("p_total", "p_รวม")} (kg·m/s)</Text>
                  <Text style={s.td}>{sfmt(pBefore)}</Text>
                  <Text style={[s.td, ran && { color: C.green }]}>{ran && pAfter !== null ? sfmt(pAfter) : "?"}</Text>
                </View>
                <View style={s.tableRow}>
                  <Text style={s.td0}>{L("KE_total", "KE_รวม")} (J)</Text>
                  <Text style={s.td}>{fmt(keBefore)}</Text>
                  <Text style={[s.td, ran && { color: mode === "elastic" ? C.green : C.orange }]}>
                    {ran && keAfter !== null ? fmt(keAfter) : "?"}
                  </Text>
                </View>
                {ran && out && keAfter !== null ? (
                  <Text style={s.verdict} aria-live="polite">
                    {`v_A' = ${sfmt(out.v1f)} m/s · v_B' = ${sfmt(out.v2f)} m/s\n`}
                    {L("Momentum is conserved. ", "โมเมนตัมอนุรักษ์ ")}
                    {mode === "elastic"
                      ? L("Kinetic energy is conserved too: that is what makes it elastic.", "พลังงานจลน์ก็อนุรักษ์ด้วย นี่คือสิ่งที่ทำให้เป็นการชนแบบยืดหยุ่น")
                      : L(
                          `${fmt(keBefore - keAfter)} J of kinetic energy became heat and deformation.`,
                          `พลังงานจลน์ ${fmt(keBefore - keAfter)} J กลายเป็นความร้อนและการเสียรูป`,
                        )}
                  </Text>
                ) : (
                  <Text style={s.verdict} aria-live="polite">
                    {L("Predict the AFTER column first, then run the collision to check yourself.", "ลองทำนายค่าในคอลัมน์ “หลัง” ก่อน แล้วค่อยรันการชนเพื่อตรวจคำตอบ")}
                  </Text>
                )}
              </Card>
            </>
          }
          right={
            <View style={s.pad}>
              <View style={s.presets}>
                {PRESETS.map((p) => (
                  <Pressable
                    key={p.label[0]}
                    style={s.preset}
                    onPress={() =>
                      edit("preset", () => {
                        setM1(p.m1);
                        setV1(p.v1);
                        setM2(p.m2);
                        setV2(p.v2);
                      })
                    }
                    accessibilityRole="button"
                  >
                    <Text style={s.presetText}>{L(...p.label)}</Text>
                  </Pressable>
                ))}
              </View>

              <Card tone="solid" style={{ marginTop: 14 }}>
                <Kicker text={L("BODY A", "วัตถุ A")} style={{ marginBottom: 6 }} />
                <Slider label="m" name={L("Mass of body A, in kilograms", "มวลของวัตถุ A หน่วยกิโลกรัม")} unit="kg" color={C.cyan} min={100} max={3000} step={50} value={m1} onChange={(x) => edit("m1", () => setM1(x))} />
                <Slider label="v" name={L("Velocity of body A, in metres per second", "ความเร็วของวัตถุ A หน่วยเมตรต่อวินาที")} unit="m/s" color={C.teal} {...V_RANGE} value={v1} onChange={(x) => edit("v1", () => setV1(x))} />
                <Text style={s.readout}>
                  p_A = {sfmt(m1 * v1)} kg·m/s · KE_A = {fmt(ke(m1, v1))} J
                </Text>
              </Card>

              <Card tone="solid" style={{ marginTop: 12 }}>
                <Kicker text={L("BODY B", "วัตถุ B")} style={{ marginBottom: 6 }} />
                <Slider label="m" name={L("Mass of body B, in kilograms", "มวลของวัตถุ B หน่วยกิโลกรัม")} unit="kg" color={C.cyan} min={100} max={3000} step={50} value={m2} onChange={(x) => edit("m2", () => setM2(x))} />
                <Slider label="v" name={L("Velocity of body B, in metres per second", "ความเร็วของวัตถุ B หน่วยเมตรต่อวินาที")} unit="m/s" color={C.teal} {...V_RANGE} value={v2} onChange={(x) => edit("v2", () => setV2(x))} />
                <Text style={s.readout}>
                  p_B = {sfmt(m2 * v2)} kg·m/s · KE_B = {fmt(ke(m2, v2))} J
                </Text>
              </Card>

              <View style={s.modes} {...radioGroup(L("Collision type", "ชนิดของการชน"))}>
                {(["elastic", "inelastic"] as const).map((k) => (
                  <Pressable
                    key={k}
                    style={[s.mode, mode === k && s.modeOn]}
                    onPress={() => edit("mode", () => setMode(k))}
                    accessibilityRole="radio"
                    aria-checked={mode === k}
                  >
                    <Icon name={k === "elastic" ? "arrows" : "burst"} size={22} color={mode === k ? C.cyan : C.muted} />
                    <Text style={[s.modeName, mode === k && { color: C.cyan }]}>
                      {k === "elastic" ? L("ELASTIC", "ยืดหยุ่น") : L("INELASTIC", "ไม่ยืดหยุ่น")}
                    </Text>
                    <Text style={s.modeSub}>{k === "elastic" ? L("Bounce apart", "ชนแล้วแยกกัน") : L("Stick together", "ชนแล้วติดกัน")}</Text>
                  </Pressable>
                ))}
              </View>

              <Btn
                label={ran ? L("RESET", "เริ่มใหม่") : L("RUN COLLISION", "รันการชน")}
                icon={ran ? "refresh" : "bolt"}
                tone={ran ? "outline" : "orange"}
                disabled={!out}
                onPress={run}
                style={{ marginTop: 14 }}
              />
              {!out ? (
                <Text style={s.warn}>
                  {L(
                    "A never reaches B with these velocities. Make A faster than B, or send B to the left (negative v).",
                    "ด้วยความเร็วเหล่านี้ A จะไม่มีวันถึง B ลองให้ A เร็วกว่า B หรือให้ B ไปทางซ้าย (v เป็นลบ)",
                  )}
                </Text>
              ) : null}
            </View>
          }
        />
      </Page>
    </Screen>
  );
}

const useStyles = makeStyles((sw) => ({
  pad: { paddingTop: sw(14) },
  dragHint: { fontSize: sw(11.5), color: C.dim, textAlign: "center", marginTop: sw(8) },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: sw(8) },
  preset: { borderWidth: 1, borderColor: C.edge, borderRadius: sw(22), paddingHorizontal: sw(14), height: tap(sw), justifyContent: "center" },
  presetText: { fontSize: sw(11.5), color: C.cyan },
  cardTitle: { fontFamily: MONO, fontSize: sw(11), color: C.cyan, letterSpacing: 2, marginBottom: sw(6) },
  readout: { fontFamily: MONO, fontSize: sw(10.5), color: C.orange, marginTop: sw(6) },
  modes: { flexDirection: "row", gap: sw(8), marginTop: sw(14) },
  mode: {
    flex: 1,
    alignItems: "center",
    backgroundColor: C.cardSoft,
    borderWidth: 1,
    borderColor: C.edge,
    borderRadius: sw(12),
    padding: sw(12),
  },
  modeOn: { borderColor: C.cyan, backgroundColor: "rgba(0,200,255,0.12)" },
  modeName: { fontFamily: MONO, fontSize: sw(10.5), color: C.muted, letterSpacing: 1, marginTop: sw(4) },
  modeSub: { fontSize: sw(11), color: C.muted, marginTop: 2 },
  warn: { fontSize: sw(12), color: C.orange, marginTop: sw(10), lineHeight: sw(18), textAlign: "center" },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: sw(5) },
  th: { flex: 1, fontFamily: MONO, fontSize: sw(9), color: C.muted, letterSpacing: 1, textAlign: "right" },
  td0: { flex: 1, fontSize: sw(11.5), color: C.muted },
  td: { flex: 1, fontFamily: MONO, fontSize: sw(12.5), color: C.text, fontWeight: "bold", textAlign: "right" },
  verdict: { fontSize: sw(12), color: C.text, lineHeight: sw(19), marginTop: sw(10) },
}));
