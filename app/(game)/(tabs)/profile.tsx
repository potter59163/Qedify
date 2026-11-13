import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/art";
import { FadeSlideIn } from "@/components/fade-slide-in";
import { Icon } from "@/components/icon";
import { C, MONO } from "@/constants/theme";
import { askCoach, coachFailureText } from "@/lib/ai";
import { MISSIONS, SKILLS, SKILL_ORDER, skillLabel } from "@/lib/engine/catalog";
import { useL, useLang } from "@/lib/i18n";
import { PAGE, makeStyles, useLayout, useSw } from "@/lib/layout";
import { href } from "@/lib/nav";
import {
  BADGES,
  avgDecisionSeconds,
  badgeText,
  hintRate,
  leaderboard,
  levelInfo,
  localInsights,
  logicConsistency,
  masteryOf,
  overallAccuracy,
  retention,
  solvingStyle,
  streakInfo,
  topMisconceptions,
  weeklyAccuracy,
} from "@/lib/progress";
import { useGame } from "@/lib/store";
import { Text } from "@/lib/text";
import { Bar, Btn, Card, Kicker, Page, PageTitle, Screen, SectionLabel } from "@/lib/ui";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const DAYS_TH = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

export default function Profile() {
  const s = useStyles();
  const sw = useSw();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, bp } = useLayout();
  const { state, dispatch } = useGame();
  const [ai, setAi] = useState<{ busy: boolean; note: string | null }>({ busy: false, note: null });

  const L = useL();
  const lang = useLang();
  const profile = state.profile;
  const level = levelInfo(state.xp, lang);
  const streak = streakInfo(state);
  const accuracy = overallAccuracy(state);
  const cleared = MISSIONS.filter((m) => state.records[m.id]).length;
  const week = weeklyAccuracy(state, new Date(), lang);
  const consistency = logicConsistency(state);
  const kept = retention(state);
  const rank = leaderboard(state, "all").find((r) => r.isYou)!.rank;
  const style = solvingStyle(state);
  const hints = hintRate(state);
  const decision = avgDecisionSeconds(state);
  const insights = localInsights(state, lang);
  const hasData = state.events.length > 0;
  const twoCol = bp !== "phone" && width >= 980;
  const cell = twoCol ? s.cellTwo : s.cell;

  const refreshInsights = async () => {
    setAi({ busy: true, note: null });
    const reply = await askCoach(
      "insights",
      {
        missionsCleared: cleared,
        missionsTotal: MISSIONS.length,
        accuracyPercent: accuracy,
        hintUsePercent: hints,
        averageDecisionSeconds: decision,
        solvedDirectlyPercent: style?.directPct ?? null,
        masteryPercentBySkill: Object.fromEntries(SKILL_ORDER.map((k) => [SKILLS[k].label, Math.round(masteryOf(state, k) * 100)])),
        misconceptions: topMisconceptions(state, 5).map((m) => ({ pattern: m.label, timesSeen: m.count })),
      },
      state.settings.lang,
    );
    if (reply.ok) {
      const items = reply.text
        .split("\n")
        .map((l) => l.replace(/^[-•*\d.)\s]+/, "").trim())
        .filter(Boolean)
        .slice(0, 3);
      dispatch({ type: "insights", items });
      setAi({ busy: false, note: null });
    } else {
      setAi({ busy: false, note: coachFailureText(reply.reason, lang, "insights") });
    }
  };

  return (
    <Screen>
      <PageTitle title={L("Profile", "โปรไฟล์")} />
      <View role="banner" style={[s.header, { paddingTop: insets.top + 14 }]}>
        <View style={s.headerInner}>
          <View style={s.top}>
            <Avatar id={profile?.avatar ?? "a1"} size={sw(64)} ring />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.name} numberOfLines={1} role="heading" aria-level={1}>
                {profile?.name}
              </Text>
              <Text style={s.handle} numberOfLines={1}>
                {profile?.school ? profile.school : L("Independent cadet", "นักเรียนอิสระ")}
              </Text>
              <View style={s.badgeRow}>
                <View style={s.levelBadge}>
                  <Icon name="star" size={sw(11)} color={C.orange} />
                  <Text style={s.levelBadgeText}>{level.name.toUpperCase()}</Text>
                </View>
                <Text style={s.rank}>{L("Squad rank", "อันดับในทีม")} #{rank}</Text>
              </View>
            </View>
            <Pressable
              onPress={() => router.push(href("/settings"))}
              style={(st) => [s.gear, (st as { hovered?: boolean }).hovered && { backgroundColor: "rgba(0,200,255,0.1)" }]}
              accessibilityRole="button"
              accessibilityLabel={L("Settings", "ตั้งค่า")}
            >
              <Icon name="gear" size={sw(22)} color={C.muted} />
            </Pressable>
          </View>

          <View style={s.stats}>
            {[
              { v: state.xp.toLocaleString("en-US"), l: L("Total XP", "XP รวม") },
              { v: String(streak.current), l: L("Day Streak", "วันต่อเนื่อง") },
              { v: accuracy === null ? "—" : `${accuracy}%`, l: L("Accuracy", "ความแม่นยำ") },
              { v: `${cleared}/${MISSIONS.length}`, l: L("Missions", "ภารกิจ") },
            ].map((q) => (
              <View key={q.l} style={s.stat}>
                <Text style={s.statVal}>{q.v}</Text>
                <Text style={s.statLabel}>{q.l}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <Page width="wide">
        <View style={[s.grid, twoCol && s.gridTwo]}>
          <FadeSlideIn delay={60} style={cell}>
            <SectionLabel>{L("LEVEL PROGRESS", "ความคืบหน้าของระดับ")}</SectionLabel>
            <Card>
              <View style={s.between}>
                <Text style={s.strong}>{level.nextName ? `${level.name} → ${level.nextName}` : L(`${level.name} · top rank`, `${level.name} · ระดับสูงสุด`)}</Text>
                <Text style={s.mono}>
                  {state.xp.toLocaleString("en-US")}
                  {level.ceil ? ` / ${level.ceil.toLocaleString("en-US")}` : ""} XP
                </Text>
              </View>
              <View style={{ marginTop: sw(10) }}>
                <Bar pct={level.pct} delay={300} label={L("Progress to the next level", "ความคืบหน้าสู่ระดับถัดไป")} />
              </View>
            </Card>

            <SectionLabel>{L("STREAK TRACKER", "สถิติวันต่อเนื่อง")}</SectionLabel>
            <Card>
              <View style={s.between}>
                <View>
                  <Text style={s.small}>{L("Current Streak", "ต่อเนื่องปัจจุบัน")}</Text>
                  <View style={s.streakRow}>
                    <Text style={s.big}>{streak.current}</Text>
                    <Icon name="flame" size={sw(24)} color={C.orange} />
                  </View>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={s.small}>{L("Best Streak", "ต่อเนื่องสูงสุด")}</Text>
                  <Text style={[s.big, { color: C.text, fontSize: sw(22) }]}>{streak.best}</Text>
                </View>
              </View>
              <View style={s.days}>
                {DAYS.map((d, i) => (
                  <View key={i} style={[s.day, streak.week[i] && s.dayOn]}>
                    <Text style={[s.dayText, streak.week[i] && { color: C.bg }]}>{L(d, DAYS_TH[i])}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <SectionLabel>{L("BADGES EARNED", "เหรียญตราที่ได้รับ")}</SectionLabel>
            <Card>
              <View style={s.badges}>
                {BADGES.map((b) => {
                  const got = state.badges.includes(b.id);
                  return (
                    <View key={b.id} style={s.badge} accessible role="img" accessibilityLabel={`${badgeText(b, lang).label}: ${got ? L("earned", "ได้รับแล้ว") : `${L("locked", "ยังล็อกอยู่")}. ${badgeText(b, lang).how}`}`}>
                      <View style={[s.badgeCircle, got && s.badgeCircleOn]}>
                        <Icon name={b.icon} size={sw(22)} color={got ? C.orange : C.lock} />
                      </View>
                      <Text style={[s.badgeName, got && { color: C.text }]} numberOfLines={2}>
                        {badgeText(b, lang).label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          </FadeSlideIn>

          <FadeSlideIn delay={140} style={cell}>
            <SectionLabel>{L("SKILL MASTERY", "ความชำนาญรายทักษะ")}</SectionLabel>
            <Card>
              {SKILL_ORDER.map((k, i) => {
                const pct = Math.round(masteryOf(state, k) * 100);
                const tried = (state.mastery[k]?.n ?? 0) > 0;
                return (
                  <View key={k} style={i > 0 && { marginTop: sw(12) }}>
                    <View style={s.between}>
                      <Text style={s.skill}>{skillLabel(k, lang)}</Text>
                      <Text style={[s.mono, pct >= 75 && { color: C.green }]}>{tried ? `${pct}%` : L("not tried", "ยังไม่ได้ลอง")}</Text>
                    </View>
                    <View style={{ marginTop: sw(5) }}>
                      <Bar
                        pct={pct}
                        color={pct >= 75 ? C.green : pct >= 45 ? C.cyan : C.orange}
                        delay={350 + i * 60}
                        label={L(`${SKILLS[k].label} mastery`, `ความชำนาญเรื่อง${SKILLS[k].th}`)}
                      />
                    </View>
                  </View>
                );
              })}
              <Text style={s.foot}>{L("Mastery drives the support level: as it rises, hints and vectors fade.", "ความชำนาญกำหนดระดับการช่วยเหลือ ยิ่งสูง คำใบ้และเวกเตอร์ยิ่งลดลง")}</Text>
            </Card>

            <SectionLabel>{L("ACCURACY THIS WEEK", "ความแม่นยำสัปดาห์นี้")}</SectionLabel>
            <Card>
              <View style={s.between}>
                <Text style={s.small}>{week.current === null ? L("No attempts in the last 7 days", "ไม่มีการตอบใน 7 วันที่ผ่านมา") : L(`7-day accuracy: ${week.current}%`, `ความแม่นยำ 7 วัน: ${week.current}%`)}</Text>
                {week.trend !== null ? (
                  <Text style={[s.mono, { color: week.trend >= 0 ? C.green : C.redSoft }]}>
                    {week.trend >= 0 ? "+" : ""}
                    {week.trend}% {L("vs last week", "เทียบกับสัปดาห์ก่อน")}
                  </Text>
                ) : null}
              </View>
              <View style={s.chart}>
                {week.bars.map((b, i) => (
                  <View key={i} style={s.chartCol}>
                    <Text style={s.chartVal}>{b.acc === null ? "" : b.acc}</Text>
                    <View
                      style={[
                        s.chartBar,
                        { height: sw(4) + sw(60) * ((b.acc ?? 0) / 100) },
                        b.acc === null && { backgroundColor: "rgba(100,120,150,0.2)" },
                        i === 6 && b.acc !== null && { backgroundColor: C.cyan },
                      ]}
                    />
                    <Text style={[s.chartDay, i === 6 && { color: C.cyan }]}>{b.label}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <SectionLabel>{L("LEARNING ANALYTICS", "การวิเคราะห์การเรียนรู้")}</SectionLabel>
            <Card>
              <View style={s.metrics}>
                {[
                  { v: decision === null ? "—" : `${decision}s`, l: L("avg. decision time", "เวลาตัดสินใจเฉลี่ย") },
                  { v: hints === null ? "—" : `${hints}%`, l: L("solved with hints", "ตอบถูกโดยใช้คำใบ้") },
                  { v: style ? `${style.directPct}%` : "—", l: L("solved directly", "ตอบถูกในครั้งเดียว") },
                  { v: consistency ? `${consistency.pct}%` : "—", l: L("logic consistency", "ความสม่ำเสมอเชิงตรรกะ") },
                  { v: kept ? `${kept.pct}%` : "—", l: L("retention (first try)", "ความคงทน (ถูกครั้งแรก)") },
                  { v: String(state.labRuns), l: L("lab experiments", "การทดลองในห้องทดลอง") },
                ].map((m) => (
                  <View key={m.l} style={s.metric}>
                    <Text style={s.metricVal}>{m.v}</Text>
                    <Text style={s.metricLabel}>{m.l}</Text>
                  </View>
                ))}
              </View>
              <Text style={s.foot}>
                {style
                  ? style.directPct >= 60
                    ? L("You mostly go straight from the formula to the answer.", "ส่วนใหญ่คุณไปจากสูตรสู่คำตอบได้ตรง ๆ")
                    : L("You often reach answers by trial and error. Try writing the formula first.", "คุณมักได้คำตอบจากการลองผิดลองถูก ลองเขียนสูตรก่อนทุกครั้ง")
                  : L("Play a few missions to see how you tend to solve problems.", "เล่นสักสองสามภารกิจเพื่อดูว่าคุณมักแก้โจทย์แบบใด")}
              </Text>
              <Text style={s.foot}>
                {L(
                  "Logic consistency: answers on conservation-law steps that did not break a conservation law. Retention: first-try accuracy in checks taken days after a mission was cleared.",
                  "ความสม่ำเสมอเชิงตรรกะ: สัดส่วนคำตอบในขั้นที่ใช้กฎการอนุรักษ์ซึ่งไม่ขัดกับกฎ ความคงทน: ความแม่นยำในการตอบครั้งแรกของการทบทวนที่ทำหลังผ่านภารกิจไปแล้วหลายวัน",
                )}
                {kept ? L(` Checks so far: ${kept.checks}.`, ` ทบทวนไปแล้ว ${kept.checks} ครั้ง`) : ""}
              </Text>
            </Card>

            <SectionLabel>{L("AI LEARNING INSIGHTS", "ข้อมูลเชิงลึกจาก AI")}</SectionLabel>
            <Card tone="purple">
              {state.insights ? (
                <>
                  <Kicker icon="robot" text={L("FROM YOUR AI COACH", "จากโค้ช AI ของคุณ")} color={C.purple} />
                  {state.insights.items.map((t, i) => (
                    <View key={i} style={s.insight}>
                      <View style={[s.dot, { backgroundColor: C.purple }]} />
                      <Text style={s.insightText}>{t}</Text>
                    </View>
                  ))}
                  <View style={s.divider} />
                </>
              ) : null}
              <Text style={s.small}>{hasData ? L("Patterns detected in your answers:", "รูปแบบที่พบในคำตอบของคุณ:") : L("No answers logged yet.", "ยังไม่มีคำตอบที่บันทึกไว้")}</Text>
              {insights.map((it, i) => (
                <View key={i} style={s.insight}>
                  <View style={[s.dot, { backgroundColor: it.good ? C.green : C.orange }]} />
                  <Text style={s.insightText}>{it.text}</Text>
                </View>
              ))}
              {hasData && insights.length === 0 ? <Text style={[s.insightText, { marginTop: sw(8) }]}>{L("No recurring mistakes so far.", "ยังไม่พบข้อผิดพลาดซ้ำ ๆ")}</Text> : null}
              {state.settings.ai ? (
                <Btn
                  label={ai.busy ? L("ASKING COACH…", "กำลังถามโค้ช…") : state.insights ? L("REFRESH AI INSIGHTS", "อัปเดตข้อมูลเชิงลึก") : L("ASK AI COACH", "ถามโค้ช AI")}
                  icon="robot"
                  tone="outline"
                  small
                  disabled={ai.busy || !hasData}
                  onPress={refreshInsights}
                  style={{ marginTop: sw(14) }}
                />
              ) : null}
              {ai.note ? <Text style={s.aiNote}>{ai.note}</Text> : null}
            </Card>
          </FadeSlideIn>
        </View>
      </Page>
    </Screen>
  );
}

const useStyles = makeStyles((sw) => ({
  header: { backgroundColor: C.panel, borderBottomWidth: 1, borderBottomColor: C.line, alignItems: "center" },
  headerInner: { width: "100%", maxWidth: PAGE.wide, paddingHorizontal: sw(20), paddingBottom: sw(16) },
  top: { flexDirection: "row", alignItems: "center", gap: sw(14) },
  name: { fontSize: sw(20), fontWeight: "bold", color: C.text },
  handle: { fontSize: sw(12.5), color: C.muted, marginTop: 1 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: sw(8), marginTop: sw(6) },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: C.orange,
    borderRadius: sw(8),
    paddingHorizontal: sw(8),
    paddingVertical: sw(3),
  },
  levelBadgeText: { fontFamily: MONO, fontSize: sw(10), color: C.orange, letterSpacing: 1 },
  rank: { fontSize: sw(11.5), color: C.green },
  gear: { width: sw(44), height: sw(44), borderRadius: sw(22), alignItems: "center", justifyContent: "center" },
  stats: { flexDirection: "row", marginTop: sw(16) },
  stat: { flex: 1, alignItems: "center" },
  statVal: { fontFamily: MONO, fontSize: sw(16), fontWeight: "bold", color: C.cyan },
  statLabel: { fontSize: sw(10.5), color: C.muted, marginTop: 2 },

  grid: {},
  gridTwo: { flexDirection: "row", alignItems: "flex-start", gap: sw(28) },
  cell: { width: "100%" },
  cellTwo: { flex: 1, minWidth: 0 },

  between: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: sw(8) },
  strong: { fontSize: sw(13.5), fontWeight: "600", color: C.text, flexShrink: 1 },
  mono: { fontFamily: MONO, fontSize: sw(11.5), color: C.muted },
  small: { fontSize: sw(12.5), color: C.muted },
  streakRow: { flexDirection: "row", alignItems: "center", gap: sw(6) },
  big: { fontFamily: MONO, fontSize: sw(30), fontWeight: "bold", color: C.orange },
  foot: { fontSize: sw(11.5), color: C.dim, marginTop: sw(12), lineHeight: sw(17) },

  days: { flexDirection: "row", justifyContent: "space-between", marginTop: sw(12) },
  day: { width: sw(34), height: sw(34), borderRadius: sw(17), borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" },
  dayOn: { backgroundColor: C.orange, borderColor: C.orange },
  dayText: { fontFamily: MONO, fontSize: sw(11), color: C.muted },

  skill: { fontSize: sw(13), color: C.text },

  badges: { flexDirection: "row", flexWrap: "wrap", rowGap: sw(14) },
  // Nine badges: three rows of three, with no orphan.
  badge: { width: "33.33%", alignItems: "center" },
  badgeCircle: {
    width: sw(48),
    height: sw(48),
    borderRadius: sw(24),
    borderWidth: 1,
    borderColor: C.lock,
    backgroundColor: "rgba(10,22,40,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeCircleOn: { borderColor: C.orange, backgroundColor: "rgba(255,168,39,0.12)", boxShadow: "0 0 10px rgba(255,168,39,0.35)" },
  badgeName: { fontSize: sw(10.5), color: C.dim, textAlign: "center", marginTop: sw(5), paddingHorizontal: 2 },

  chart: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: sw(12), height: sw(100) },
  chartCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  chartVal: { fontFamily: MONO, fontSize: sw(9.5), color: C.muted, marginBottom: 2 },
  chartBar: { width: sw(22), borderRadius: sw(5), backgroundColor: "rgba(0,200,255,0.45)" },
  chartDay: { fontSize: sw(10), color: C.muted, marginTop: sw(5) },

  metrics: { flexDirection: "row", flexWrap: "wrap", rowGap: sw(14) },
  metric: { width: "33.33%", alignItems: "center" },
  metricVal: { fontFamily: MONO, fontSize: sw(18), fontWeight: "bold", color: C.text },
  metricLabel: { fontSize: sw(10.5), color: C.muted, marginTop: 2, textAlign: "center" },

  insight: { flexDirection: "row", alignItems: "flex-start", gap: sw(9), marginTop: sw(8) },
  dot: { width: sw(7), height: sw(7), borderRadius: sw(4), marginTop: sw(6) },
  insightText: { flex: 1, fontSize: sw(13), color: C.text, lineHeight: sw(19) },
  divider: { height: 1, backgroundColor: "rgba(91,69,224,0.25)", marginVertical: sw(12) },
  aiNote: { fontSize: sw(11.5), color: C.orange, marginTop: sw(10), lineHeight: sw(17) },
}));
