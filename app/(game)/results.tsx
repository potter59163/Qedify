import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FadeSlideIn } from "@/components/fade-slide-in";
import { Icon } from "@/components/icon";
import { C, MONO } from "@/constants/theme";
import { askCoach } from "@/lib/ai";
import { CHAPTERS, SKILLS, TIER_NAME, missionById, missionText, skillLabel, tierName } from "@/lib/engine/catalog";
import { misLabel } from "@/lib/engine/misconceptions";
import type { Skill } from "@/lib/engine/types";
import { pick, useL, useLang, type Bi, type Lang } from "@/lib/i18n";
import { makeStyles } from "@/lib/layout";
import { href, missionHref } from "@/lib/nav";
import { BADGES, badgeText, levelInfo, nextMission, type MissionResult, type StepStatus } from "@/lib/progress";
import { useGame } from "@/lib/store";
import { Text } from "@/lib/text";
import { Btn, Card, Page, PageTitle, Screen } from "@/lib/ui";

const KEY_IDEA: Record<Skill, Bi> = {
  momentum: ["Momentum is mass × velocity: p = m × v.", "โมเมนตัมคือมวล × ความเร็ว: p = m × v"],
  vector: ["Momentum is a vector, so opposite directions carry opposite signs.", "โมเมนตัมเป็นเวกเตอร์ ทิศตรงข้ามกันจึงมีเครื่องหมายตรงข้ามกัน"],
  impulse: ["Impulse equals the change in momentum: J = F × Δt = Δp.", "การดลเท่ากับโมเมนตัมที่เปลี่ยนไป: J = F × Δt = Δp"],
  "force-time": ["For the same change in momentum, a longer collision time means a smaller force.", "เมื่อโมเมนตัมเปลี่ยนเท่าเดิม ช่วงเวลาที่ชนนานขึ้นทำให้แรงน้อยลง"],
  conservation: ["With no outside force, total momentum before equals total momentum after.", "เมื่อไม่มีแรงภายนอก โมเมนตัมรวมก่อนเท่ากับโมเมนตัมรวมหลัง"],
  "collision-type": ["Momentum is conserved in every collision; kinetic energy only in elastic ones.", "โมเมนตัมอนุรักษ์ในทุกการชน แต่พลังงานจลน์อนุรักษ์เฉพาะการชนแบบยืดหยุ่น"],
  energy: ["Kinetic energy (½mv²) can be lost in a collision even though momentum is conserved.", "พลังงานจลน์ (½mv²) หายไปในการชนได้ แม้โมเมนตัมจะอนุรักษ์"],
};

const STATUS: Record<StepStatus, { label: Bi; color: string; bg: string }> = {
  mastered: { label: ["MASTERED", "เชี่ยวชาญ"], color: C.green, bg: "rgba(0,255,159,0.12)" },
  partial: { label: ["PARTIAL", "บางส่วน"], color: C.orange, bg: "rgba(255,168,39,0.12)" },
  review: { label: ["REVIEW", "ควรทบทวน"], color: C.redSoft, bg: "rgba(239,68,68,0.12)" },
};

const ASSESS = { application: ["Application", "การประยุกต์ใช้"], analysis: ["Analysis", "การวิเคราะห์"], decision: ["Decision-making", "การตัดสินใจ"] } as const;

function localDebrief(r: MissionResult, skill: Skill, lang: Lang): string {
  const L = pick(lang);
  const opener =
    r.stars === 3
      ? L("Perfect execution: no wrong answers and no hints.", "ทำได้สมบูรณ์แบบ ไม่ตอบผิดและไม่ใช้คำใบ้เลย")
      : r.wrong === 0
        ? L("Solid work: every answer was right the first time.", "ทำได้ดีมาก ตอบถูกตั้งแต่ครั้งแรกทุกข้อ")
        : L("You got there by adjusting your approach after feedback.", "คุณไปถึงคำตอบได้ด้วยการปรับวิธีคิดหลังได้รับคำแนะนำ");
  const watch = r.misconceptions[0]
    ? L(` Watch out for: ${misLabel(r.misconceptions[0]).toLowerCase()}.`, ` ข้อควรระวัง: ${misLabel(r.misconceptions[0], "th")}`)
    : "";
  return `${opener} ${L("Key idea:", "แนวคิดสำคัญ:")} ${L(...KEY_IDEA[skill])}${watch}`;
}

function Star({ on, delay }: { on: boolean; delay: number }) {
  const s = useStyles();
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 5, stiffness: 180 }));
  }, [delay, scale]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={anim}>
      <Icon name="star" size={s.star.fontSize as number} color={on ? C.orange : "#2a3a4a"} />
    </Animated.View>
  );
}

export default function ResultsRoute() {
  const { state } = useGame();
  const r = state.lastResult;
  if (!r || !missionById(r.missionId)) return <Redirect href={href("/home")} />;
  return <Results key={r.ts} r={r} />;
}

function Results({ r }: { r: MissionResult }) {
  const s = useStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useGame();
  const L = useL();
  const lang = useLang();
  const def = missionById(r.missionId)!;
  const [xpShown, setXpShown] = useState(0);
  const [debrief, setDebrief] = useState<{ text: string; ai: boolean; loading: boolean }>({
    text: localDebrief(r, def.skills[0], lang),
    ai: false,
    loading: state.settings.ai,
  });

  useEffect(() => {
    const startAt = Date.now() + 350;
    const tick = setInterval(() => {
      const t = Math.min(Math.max(Date.now() - startAt, 0) / 1400, 1);
      setXpShown(Math.round((1 - Math.pow(1 - t, 3)) * r.xp));
      if (t >= 1) clearInterval(tick);
    }, 16);
    return () => clearInterval(tick);
  }, [r.xp]);

  useEffect(() => {
    if (!state.settings.ai) return;
    let alive = true;
    askCoach(
      "debrief",
      {
        mission: def.title,
        chapter: CHAPTERS[def.chapter - 1].title,
        stars: r.stars,
        wrongAnswers: r.wrong,
        hintsUsed: r.hintsUsed,
        supportLevel: TIER_NAME[r.tier],
        steps: r.steps.map((o, i) => ({ step: o.title, skill: SKILLS[o.skill].label, wrongAnswers: o.wrong, hints: o.hints, result: r.statuses[i] })),
        misconceptionsDetected: r.misconceptions.map((id) => misLabel(id)),
      },
      state.settings.lang,
    ).then((reply) => {
      if (!alive) return;
      setDebrief((d) => (reply.ok ? { text: reply.text, ai: true, loading: false } : { ...d, loading: false }));
    });
    return () => {
      alive = false;
    };
    // Fetch once per result; the settings are read at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mastered = r.statuses.filter((x) => x === "mastered").length;
  const upNext = nextMission(state);
  const level = levelInfo(state.xp, lang);
  const seconds = Math.round(r.ms / 1000);
  const newBadges = BADGES.filter((b) => r.newBadges.includes(b.id));

  return (
    <Screen>
      <PageTitle title={L("Mission results", "ผลภารกิจ")} />
      <Page>
        <FadeSlideIn offsetY={-20}>
          <View style={[s.header, { paddingTop: insets.top + 34 }]}>
            <Icon name="sparkles" size={56} color={C.orange} />
            <Text style={s.title} accessibilityRole="header">
              {L("MISSION COMPLETE!", "ภารกิจสำเร็จ!")}
            </Text>
            <Text style={s.sub}>
              {missionText(def, lang).title} · {L("Chapter", "บทที่")} {def.chapter}
              {r.review ? ` · ${L("retention check", "ทบทวนความจำ")}` : ""}
            </Text>
          </View>
        </FadeSlideIn>

        <View style={s.stars} accessibilityLabel={L(`${r.stars} of 3 stars`, `${r.stars} จาก 3 ดาว`)}>
          <Star on={r.stars >= 1} delay={220} />
          <Star on={r.stars >= 2} delay={380} />
          <Star on={r.stars >= 3} delay={540} />
        </View>
        <Text style={s.starsLabel}>{r.stars === 3 ? L("PERFECT SCORE", "คะแนนเต็ม") : r.stars === 2 ? L("GOOD JOB", "ทำได้ดี") : L("COMPLETED", "ผ่านแล้ว")}</Text>

        <View style={s.body}>
          <FadeSlideIn delay={300}>
            <Card style={s.statsCard}>
              {[
                { l: L("XP EARNED", "XP ที่ได้"), v: `+${xpShown} XP` },
                { l: L("ACCURACY", "ความแม่นยำ"), v: `${r.accuracy}%` },
                { l: L("MASTERY", "ความชำนาญ"), v: `${mastered}/${r.steps.length}` },
              ].map((x, i) => (
                <View key={x.l} style={[s.statCol, i > 0 && s.statDivider]}>
                  <Text style={s.statLabel}>{x.l}</Text>
                  <Text style={s.statVal}>{x.v}</Text>
                </View>
              ))}
            </Card>
            {r.dailyBonus || !r.firstClear ? (
              <Text style={s.xpNote}>
                {r.dailyBonus ? L("Daily challenge bonus: +50% XP. ", "โบนัสภารกิจประจำวัน: +50% XP ") : ""}
                {!r.firstClear ? L("Replay: practice XP (30%).", "เล่นซ้ำ: ได้ XP ฝึกฝน (30%)") : ""}
              </Text>
            ) : null}
          </FadeSlideIn>

          {r.levelAfter > r.levelBefore ? (
            <FadeSlideIn delay={360}>
              <Card tone="orange" style={s.gap}>
                <Text style={s.levelUp}>{L("LEVEL UP", "เลื่อนระดับ")}: {level.name.toUpperCase()}</Text>
              </Card>
            </FadeSlideIn>
          ) : null}

          {newBadges.length ? (
            <FadeSlideIn delay={400}>
              <Card tone="orange" style={s.gap}>
                <Text style={s.cardTitleOrange}>{L(newBadges.length > 1 ? "NEW BADGES" : "NEW BADGE", "เหรียญตราใหม่")}</Text>
                {newBadges.map((b) => (
                  <View key={b.id} style={s.badgeRow}>
                    <Icon name={b.icon} size={18} color={C.orange} />
                    <Text style={s.badgeLine}>
                      {badgeText(b, lang).label}: {badgeText(b, lang).how}
                    </Text>
                  </View>
                ))}
              </Card>
            </FadeSlideIn>
          ) : null}

          <FadeSlideIn delay={420}>
            <Card style={[s.gap, s.flush]}>
              {[
                { l: L("Time", "เวลา"), v: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` },
                { l: L("Wrong answers", "ตอบผิด"), v: r.wrong === 0 ? L("none", "ไม่มี") : String(r.wrong), good: r.wrong === 0 },
                { l: L("Hints used", "คำใบ้ที่ใช้"), v: `${r.hintsUsed} / ${r.maxHints}`, good: r.hintsUsed === 0 },
                { l: L("Support level", "ระดับการช่วยเหลือ"), v: tierName(r.tier, lang) },
              ].map((row, i) => (
                <View key={row.l} style={[s.row, i > 0 && s.rowDivider]}>
                  <Text style={s.rowLeft}>{row.l}</Text>
                  <Text style={[s.rowRight, row.good && { color: C.green }]}>{row.v}</Text>
                </View>
              ))}
            </Card>
          </FadeSlideIn>

          <FadeSlideIn delay={480}>
            <Card style={[s.gap, s.flush]}>
              <Text style={s.cardTitle} role="heading" aria-level={2}>
                {L("LEARNING OUTCOMES", "ผลการเรียนรู้")}
              </Text>
              {r.steps.map((o, i) => {
                const st = STATUS[r.statuses[i]];
                return (
                  <View key={o.id} style={[s.row, s.rowDivider]}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={s.rowLeft}>{skillLabel(o.skill, lang)}</Text>
                      <Text style={s.rowHint}>
                        {o.title} · {o.wrong === 0 ? L("first try", "ครั้งแรก") : L(`${o.wrong + 1} tries`, `${o.wrong + 1} ครั้ง`)}
                        {o.hints ? L(` · ${o.hints} hint${o.hints > 1 ? "s" : ""}`, ` · คำใบ้ ${o.hints} ครั้ง`) : ""}
                      </Text>
                    </View>
                    <View style={[s.status, { backgroundColor: st.bg }]}>
                      <Text style={[s.statusText, { color: st.color }]}>{L(...st.label)}</Text>
                    </View>
                  </View>
                );
              })}
              <View style={s.rubric}>
                <Text style={s.rubricLabel}>{L("RUBRIC · correct within 2 attempts", "เกณฑ์ · ตอบถูกภายใน 2 ครั้ง")}</Text>
                <View style={s.rubricChips}>
                  {r.rubric.map((x) => (
                    <View key={x.assess} style={[s.chip, { borderColor: x.pass ? "rgba(0,255,159,0.45)" : "rgba(255,168,39,0.45)" }]}>
                      <Text style={[s.chipText, { color: x.pass ? C.green : C.orange }]}>
                        {L(ASSESS[x.assess][0], ASSESS[x.assess][1])}: {x.pass ? L("pass", "ผ่าน") : L("not yet", "ยังไม่ผ่าน")}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </Card>
          </FadeSlideIn>

          {r.misconceptions.length ? (
            <FadeSlideIn delay={520}>
              <Card tone="red" style={s.gap}>
                <Text style={s.reviewTitle}>{L("TO REVIEW BEFORE THE NEXT MISSION", "ควรทบทวนก่อนภารกิจถัดไป")}</Text>
                {r.misconceptions.map((id) => (
                  <Text key={id} style={s.reviewItem}>
                    ▸ {misLabel(id, lang)}
                  </Text>
                ))}
              </Card>
            </FadeSlideIn>
          ) : null}

          <FadeSlideIn delay={560}>
            <Card tone="purple" style={s.gap}>
              <Text style={s.insightTitle}>{debrief.ai ? L("AI COACH DEBRIEF", "สรุปจากโค้ช AI") : L("PHYSICS INSIGHT", "ข้อคิดทางฟิสิกส์")}</Text>
              <Text style={s.insightText}>{debrief.text}</Text>
              {debrief.loading ? <Text style={s.insightNote}>{L("Your AI coach is writing a personal debrief…", "โค้ช AI กำลังเขียนสรุปเฉพาะสำหรับคุณ…")}</Text> : null}
            </Card>
          </FadeSlideIn>

          <FadeSlideIn delay={620}>
            <View style={s.actions}>
              {upNext ? (
                <Btn label={`${L("NEXT", "ถัดไป")}: ${missionText(upNext, lang).title.toUpperCase()}`} iconRight="arrow-right" tone="orange" onPress={() => router.replace(missionHref(state, upNext))} />
              ) : (
                <Btn label={L("ALL MISSIONS CLEARED", "ผ่านครบทุกภารกิจแล้ว")} icon="sparkles" onPress={() => router.replace(href("/profile"))} />
              )}
              <Btn label={r.stars < 3 ? L("REPLAY FOR 3 STARS", "เล่นซ้ำเพื่อ 3 ดาว") : L("REPLAY", "เล่นซ้ำ")} icon="refresh" tone="outline" onPress={() => router.replace(href(`/mission/${def.id}`))} />
              <Btn label={L("HOME", "หน้าหลัก")} icon="home" tone="quiet" onPress={() => router.replace(href("/home"))} />
            </View>
          </FadeSlideIn>
        </View>
      </Page>
    </Screen>
  );
}

const useStyles = makeStyles((sw) => ({
  header: { alignItems: "center", paddingBottom: sw(6) },
  title: { fontFamily: MONO, fontSize: sw(20), color: C.text, fontWeight: "bold", letterSpacing: 2, marginTop: sw(10) },
  sub: { fontSize: sw(14), color: C.muted, marginTop: sw(4) },
  stars: { flexDirection: "row", justifyContent: "center", gap: sw(8), paddingTop: sw(12) },
  star: { fontSize: sw(38), color: C.orange },
  starsLabel: { fontFamily: MONO, fontSize: sw(10), color: C.orange, textAlign: "center", letterSpacing: 2, marginTop: sw(2), marginBottom: sw(12) },

  body: {},
  gap: { marginTop: sw(14) },
  flush: { padding: 0, overflow: "hidden" },
  statsCard: { flexDirection: "row", paddingHorizontal: 0 },
  statCol: { flex: 1, alignItems: "center" },
  statDivider: { borderLeftWidth: 1, borderLeftColor: C.lineSoft },
  statLabel: { fontFamily: MONO, fontSize: sw(9), color: C.muted, letterSpacing: 1 },
  statVal: { fontFamily: MONO, fontSize: sw(16), color: C.cyan, fontWeight: "bold", marginTop: sw(4) },
  xpNote: { fontSize: sw(11), color: C.muted, textAlign: "center", marginTop: sw(8) },
  levelUp: { fontFamily: MONO, fontSize: sw(13), color: C.orange, fontWeight: "bold", letterSpacing: 1, textAlign: "center" },
  cardTitleOrange: { fontFamily: MONO, fontSize: sw(10), color: C.orange, letterSpacing: 1.5, marginBottom: sw(6) },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: sw(8), marginTop: sw(4) },
  badgeLine: { flex: 1, fontSize: sw(13), color: C.text, lineHeight: sw(21) },

  cardTitle: { fontFamily: MONO, fontSize: sw(10), color: C.cyan, letterSpacing: 1, paddingHorizontal: sw(16), paddingTop: sw(14), paddingBottom: sw(8) },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: sw(16), paddingVertical: sw(12) },
  rowDivider: { borderTopWidth: 1, borderTopColor: "rgba(0,200,255,0.08)" },
  rowLeft: { fontSize: sw(13), color: C.text },
  rowHint: { fontSize: sw(10.5), color: C.muted, marginTop: 2 },
  rowRight: { fontFamily: MONO, fontSize: sw(12), color: C.muted },
  status: { borderRadius: sw(6), paddingHorizontal: sw(7), paddingVertical: sw(3) },
  statusText: { fontFamily: MONO, fontSize: sw(10), fontWeight: "bold" },
  rubric: { borderTopWidth: 1, borderTopColor: "rgba(0,200,255,0.08)", paddingHorizontal: sw(16), paddingVertical: sw(12) },
  rubricLabel: { fontFamily: MONO, fontSize: sw(9), color: C.muted, letterSpacing: 1 },
  rubricChips: { flexDirection: "row", flexWrap: "wrap", gap: sw(6), marginTop: sw(8) },
  chip: { borderWidth: 1, borderRadius: sw(12), paddingHorizontal: sw(9), paddingVertical: sw(4) },
  chipText: { fontFamily: MONO, fontSize: sw(10) },

  reviewTitle: { fontFamily: MONO, fontSize: sw(9.5), color: C.redSoft, letterSpacing: 1, marginBottom: sw(8) },
  reviewItem: { fontSize: sw(12.5), color: "#fca5a5", lineHeight: sw(20) },
  insightTitle: { fontFamily: MONO, fontSize: sw(10), color: C.purple, letterSpacing: 1, marginBottom: sw(8) },
  insightText: { fontSize: sw(13), color: C.text, lineHeight: sw(21) },
  insightNote: { fontSize: sw(11), color: C.muted, marginTop: sw(8) },
  actions: { marginTop: sw(20), gap: sw(10) },
}));
