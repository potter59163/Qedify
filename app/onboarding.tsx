import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Planet, RocketHero } from "@/components/art";
import { FadeSlideIn } from "@/components/fade-slide-in";
import { Icon } from "@/components/icon";
import { C, MONO } from "@/constants/theme";
import type { IconName } from "@/lib/engine/types";
import { useL, type Bi } from "@/lib/i18n";
import { href } from "@/lib/nav";
import { Seo } from "@/lib/seo";
import { useGame } from "@/lib/store";
import { Text } from "@/lib/text";
import { Btn, Screen, Starfield } from "@/lib/ui";

const SLIDES: { title: Bi; accent: Bi; body: Bi; badge: [IconName, Bi]; formula: string; chip: [IconName, Bi] }[] = [
  {
    title: ["Physics becomes a ", "ฟิสิกส์กลายเป็น"],
    accent: ["Space Mission", "ภารกิจอวกาศ"],
    body: ["Solve real momentum problems to rescue spacecraft and unlock the secrets of the universe.", "แก้โจทย์โมเมนตัมจริงเพื่อกู้ภัยยานอวกาศ และไขความลับของจักรวาล"],
    badge: ["star", ["LEVEL UP", "เลื่อนระดับ"]],
    formula: "p = m × v",
    chip: ["bolt", ["+250 XP", "+250 XP"]],
  },
  {
    title: ["Learn by ", "เรียนรู้ด้วย"],
    accent: ["doing", "การลงมือทำ"],
    body: ["Set forces, burn times and collision types, then watch the simulation obey the laws of physics. Every mistake gets feedback aimed at the idea behind it.", "กำหนดแรง เวลาจุดเครื่องยนต์ และชนิดการชน แล้วดูการจำลองที่เป็นไปตามกฎฟิสิกส์ ทุกครั้งที่ตอบผิดจะได้คำแนะนำที่ตรงกับแนวคิดที่เข้าใจคลาดเคลื่อน"],
    badge: ["flask", ["VIRTUAL LAB", "ห้องทดลองเสมือน"]],
    formula: "J = F × Δt",
    chip: ["bulb", ["HINTS", "คำใบ้"]],
  },
  {
    title: ["A coach that ", "โค้ชที่"],
    accent: ["adapts to you", "ปรับตามตัวคุณ"],
    body: ["QEDify tracks what you master and where you slip, then tunes the difficulty and the support, with an AI coach for when you are stuck.", "QEDify ติดตามว่าคุณชำนาญเรื่องใดและพลาดตรงไหน แล้วปรับความยากและการช่วยเหลือให้เหมาะ พร้อมโค้ช AI ไว้ช่วยเมื่อคุณติดขัด"],
    badge: ["robot", ["AI COACH", "โค้ช AI"]],
    formula: "p_before = p_after",
    chip: ["chart", ["ADAPTIVE", "ปรับตามผู้เรียน"]],
  },
];

export default function Onboarding() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const L = useL();
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;

  const finish = () => {
    dispatch({ type: "onboarded" });
    router.replace(href(state.profile ? "/home" : "/register"));
  };

  return (
    <Screen>
      <Seo
        title={L("How QEDify works", "QEDify ทำงานอย่างไร")}
        description={L("A three-step tour of QEDify: physics as space missions, learning by doing, and a coach that adapts to you.", "ทัวร์สามขั้นของ QEDify: ฟิสิกส์ในรูปภารกิจอวกาศ การเรียนรู้ด้วยการลงมือทำ และโค้ชที่ปรับตามตัวคุณ")}
        path="/onboarding"
      />
      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
        <View role="main" style={s.col}>
          <View style={s.art} aria-hidden>
            <Starfield count={16} />
            <Planet size={230} />
            <View style={s.rocket}>
              <RocketHero size={58} />
            </View>
            <FadeSlideIn key={`b${i}`} delay={60} style={[s.chip, s.badge]}>
              <Icon name={slide.badge[0]} size={14} color={C.cyan} />
              <Text style={s.chipText}>{L(...slide.badge[1])}</Text>
            </FadeSlideIn>
            <FadeSlideIn key={`f${i}`} delay={140} style={s.formula}>
              <Text style={s.formulaText}>{slide.formula}</Text>
            </FadeSlideIn>
            <FadeSlideIn key={`c${i}`} delay={220} style={[s.chip, s.xp]}>
              <Icon name={slide.chip[0]} size={13} color={C.teal} />
              <Text style={[s.chipText, { color: C.teal }]}>{L(...slide.chip[1])}</Text>
            </FadeSlideIn>
          </View>

          <View style={s.panel}>
            <Text style={s.kicker}>
              {L("STEP", "ขั้นที่")} 0{i + 1} {L("OF", "จาก")} 0{SLIDES.length}
            </Text>
            <Text style={s.title} role="heading" aria-level={1}>
              {L(...slide.title)}
              <Text style={s.accent}>{L(...slide.accent)}</Text>
            </Text>
            <Text style={s.body}>{L(...slide.body)}</Text>

            <View style={s.dots}>
              {SLIDES.map((_, k) => (
                <Pressable key={k} onPress={() => setI(k)} hitSlop={12} accessibilityRole="button" accessibilityLabel={L(`Go to slide ${k + 1}`, `ไปที่สไลด์ ${k + 1}`)}>
                  <View style={[s.dot, k === i ? s.dotOn : s.dotOff]} />
                </Pressable>
              ))}
            </View>

            <Btn label={last ? L("GET STARTED", "เริ่มเลย") : L("NEXT", "ถัดไป")} iconRight="arrow-right" onPress={() => (last ? finish() : setI(i + 1))} />
            <Pressable onPress={finish} style={s.skip} accessibilityRole="button" disabled={last}>
              <Text style={[s.skipText, last && { opacity: 0 }]}>{L("Skip intro", "ข้ามแนะนำ")}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Screen>
  );
}

// Fixed sizes on purpose: this page is pre-rendered, so nothing may depend on the measured window.
const s = StyleSheet.create({
  safe: { flex: 1, alignItems: "center" },
  col: { flex: 1, width: "100%", maxWidth: 520 },
  art: { flex: 1, minHeight: 220, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  rocket: { position: "absolute", top: "12%", right: "20%", transform: [{ rotate: "30deg" }] },
  chip: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    backgroundColor: "rgba(6,13,31,0.8)",
  },
  badge: { top: "14%", left: "9%", borderColor: C.cyan, boxShadow: "0 0 12px rgba(0,200,255,0.45)" },
  xp: { bottom: "9%", right: "10%", borderColor: C.teal },
  chipText: { fontFamily: MONO, fontSize: 12, color: C.cyan },
  formula: { position: "absolute", bottom: "16%", left: "11%" },
  formulaText: { fontFamily: MONO, fontSize: 13, color: C.cyan },

  panel: { paddingHorizontal: 28, paddingBottom: 14 },
  kicker: { fontFamily: MONO, fontSize: 11, color: C.cyan, letterSpacing: 3, marginBottom: 12 },
  title: { fontSize: 27, fontWeight: "800", color: C.text, lineHeight: 35 },
  accent: { color: C.cyan },
  body: { fontSize: 14.5, color: C.muted, lineHeight: 23, marginTop: 12, minHeight: 92 },
  dots: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 20 },
  dot: { height: 8, borderRadius: 4 },
  dotOn: { width: 24, backgroundColor: C.cyan, boxShadow: "0 0 12px rgba(0,200,255,0.6)" },
  dotOff: { width: 8, backgroundColor: "rgba(0,200,255,0.3)" },
  skip: { alignItems: "center", paddingVertical: 14 },
  skipText: { fontSize: 13, color: C.muted },
});
