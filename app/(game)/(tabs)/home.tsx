import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FadeSlideIn } from "@/components/fade-slide-in";
import { Icon } from "@/components/icon";
import { C, MONO } from "@/constants/theme";
import { SR_ONLY, useReduceMotion } from "@/lib/a11y";
import { CHAPTERS, MISSIONS, chapterText, missionText, missionsOf, tierName } from "@/lib/engine/catalog";
import type { MissionDef } from "@/lib/engine/types";
import { useL, useLang } from "@/lib/i18n";
import { PAGE, makeStyles, useLayout, useSw } from "@/lib/layout";
import { href, missionHref } from "@/lib/nav";
import {
  chapterProgress,
  currentChapter,
  dailyMission,
  dayKey,
  dueReviews,
  fmtClock,
  isCleared,
  isUnlocked,
  msUntilMidnight,
  nextMission,
  streakInfo,
  tierFor,
  totalStars,
} from "@/lib/progress";
import { useGame } from "@/lib/store";
import { Text } from "@/lib/text";
import { Btn, Kicker, LiveText, Page, PageTitle, Pill, Screen, Split, Stars } from "@/lib/ui";

type NodeState = "complete" | "current" | "locked" | "boss";

function Node({ def, status, stars, onPress }: { def: MissionDef; status: NodeState; stars: number; onPress?: () => void }) {
  const s = useStyles();
  const sw = useSw();
  const L = useL();
  const text = missionText(def, useLang());
  const reduced = useReduceMotion();
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (status !== "current" || reduced) {
      cancelAnimation(pulse);
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 750, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.95, { duration: 750, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [status, pulse, reduced]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const circle =
    status === "complete" ? (
      <LinearGradient colors={[C.green, C.greenDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.circle, s.circleDone]}>
        <Icon name="check" size={sw(26)} color={C.bg} />
      </LinearGradient>
    ) : status === "current" ? (
      <Animated.View style={[s.circle, s.circleNow, anim]}>
        <Icon name={def.icon} size={sw(26)} color={C.cyan} />
      </Animated.View>
    ) : (
      <View style={[s.circle, status === "boss" ? s.circleBoss : s.circleLocked]}>
        <Icon name={status === "boss" ? "skull" : "lock"} size={sw(22)} color={status === "boss" ? "rgba(255,71,87,0.7)" : C.dim} />
      </View>
    );

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={(st) => [s.node, onPress && (st as { hovered?: boolean }).hovered && s.nodeHover]}
      accessibilityRole="button"
    >
      {circle}
      <View style={s.nodeText}>
        <Text style={[s.nodeTitle, status === "boss" && { color: C.red }, status === "locked" && { color: C.muted }]}>{text.title}</Text>
        <Text style={s.nodeSub}>{text.tagline}</Text>
        {/* The button is named by what it shows, so voice control can target it; the status is added for screen readers. */}
        <Text style={SR_ONLY}>
          {status === "complete" ? L("cleared", "ผ่านแล้ว") : status === "current" ? L("ready to play", "พร้อมเล่น") : L("locked", "ล็อกอยู่")}
        </Text>
        {status === "complete" ? <Stars count={stars} /> : null}
      </View>
      {onPress ? <Icon name="chevron-right" size={sw(20)} color={C.dim} /> : null}
    </Pressable>
  );
}

export default function Home() {
  const s = useStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useGame();
  const L = useL();
  const lang = useLang();
  const { width, bp } = useLayout();
  // One column: the secondary cards shrink to a single line each.
  const stacked = bp === "phone" || width < 900;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? L("Good morning", "สวัสดีตอนเช้า") : hour < 17 ? L("Good afternoon", "สวัสดีตอนบ่าย") : L("Good evening", "สวัสดีตอนเย็น");
  const streak = streakInfo(state, now).current;
  const upNext = nextMission(state);
  const chapterId = currentChapter(state);
  const chapter = CHAPTERS[chapterId - 1];
  const prog = chapterProgress(state, chapterId);
  const daily = dailyMission(state, now);
  const dailyText = missionText(daily, lang);
  const due = dueReviews(state, now);
  const dueTitle = due.length ? missionText(due[0].def, lang).title : "";
  const askSurvey = Object.keys(state.records).length >= 4 && !state.surveys.some((x) => x.role === "student");
  const dailyDone = state.dailyDone === dayKey(now);
  const play = (def: MissionDef, isDaily = false) => router.push(missionHref(state, def, isDaily));

  const left = (
    <>
      {/* The next mission comes first: it is what a learner opens the app for. */}
      <FadeSlideIn delay={40}>
        <LinearGradient colors={["rgba(255,168,39,0.14)", "rgba(0,200,255,0.08)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.next}>
          <Kicker
            icon="rocket"
            text={upNext ? L("CONTINUE YOUR MISSION PATH", "เล่นต่อจากเดิม") : L("ALL MISSIONS CLEARED", "ผ่านครบทุกภารกิจแล้ว")}
            color={C.orange}
          />
          <Text style={s.nextTitle}>{upNext ? missionText(upNext, lang).title : L("Replay for three stars", "เล่นซ้ำเพื่อเก็บ 3 ดาว")}</Text>
          <Text style={s.dailyDesc}>
            {upNext
              ? `${L("Chapter", "บทที่")} ${upNext.chapter} · ${missionText(upNext, lang).tagline}`
              : L("Pick any mission from the chapters tab.", "เลือกภารกิจใดก็ได้จากแท็บบทเรียน")}
          </Text>
          <Btn
            label={upNext ? L("PLAY", "เล่นต่อ") : L("OPEN CHAPTERS", "ไปที่บทเรียน")}
            icon="play"
            tone="orange"
            onPress={() => (upNext ? play(upNext) : router.push(href("/chapters")))}
            style={{ marginTop: 14 }}
          />
        </LinearGradient>
      </FadeSlideIn>

      <FadeSlideIn delay={80}>
        <LinearGradient
          colors={["rgba(0,200,255,0.1)", "rgba(91,69,224,0.1)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.daily}
        >
          <Kicker icon="bolt" text={L("DAILY CHALLENGE · +50% XP", "ภารกิจประจำวัน · +50% XP")} color={C.orange} />
          <Text style={s.dailyTitle}>{dailyText.title}</Text>
          <Text style={s.dailyDesc}>
            {dailyDone
              ? L("Bonus claimed for today. A new challenge unlocks at midnight.", "รับโบนัสของวันนี้แล้ว ภารกิจใหม่จะเปิดตอนเที่ยงคืน")
              : L(`${daily.tagline}. Today's numbers are the same for every cadet.`, `${dailyText.tagline} ตัวเลขของวันนี้เหมือนกันสำหรับทุกคน`)}
          </Text>
          <View style={s.dailyFooter}>
            <View style={s.timer}>
              <Icon name="clock" size={14} color={C.orange} />
              <LiveText style={s.timerText} compute={(t) => L(`${fmtClock(msUntilMidnight(t))} LEFT`, `เหลือ ${fmtClock(msUntilMidnight(t))}`)} />
            </View>
            <Btn label={dailyDone ? L("REPLAY", "เล่นซ้ำ") : L("PLAY NOW", "เล่นเลย")} tone="outline" small onPress={() => play(daily, true)} />
          </View>
        </LinearGradient>
      </FadeSlideIn>

      <FadeSlideIn delay={160}>
        <Pressable
          style={(st) => [s.lab, (st as { hovered?: boolean }).hovered && { borderColor: C.purple }]}
          onPress={() => router.push(href("/lab"))}
          accessibilityRole="button"
          accessibilityHint={L("Opens the virtual lab", "เปิดห้องทดลองเสมือน")}
        >
          <View style={s.labIcon}>
            <Icon name="flask" size={22} color={C.purple} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.labTitle}>{L("VIRTUAL LAB", "ห้องทดลองเสมือน")}</Text>
            <Text style={s.labSub} numberOfLines={stacked ? 2 : undefined}>{L("Set mass and velocity freely and watch collisions play out.", "ตั้งค่ามวลและความเร็วได้อิสระ แล้วดูผลการชนที่เกิดขึ้น")}</Text>
          </View>
          <Icon name="chevron-right" size={20} color={C.dim} />
        </Pressable>
      </FadeSlideIn>

      {due.length ? (
        <FadeSlideIn delay={200}>
          <Pressable
            style={(st) => [s.lab, s.review, (st as { hovered?: boolean }).hovered && { borderColor: C.orange }]}
            onPress={() => router.push(href(`/mission/${due[0].def.id}?review=1`))}
            accessibilityRole="button"
          >
            <View style={[s.labIcon, { backgroundColor: "rgba(255,168,39,0.12)" }]}>
              <Icon name="hourglass" size={22} color={C.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.labTitle, { color: C.orange }]}>
                {L("RETENTION CHECK", "ทบทวนความจำ")}
                {due.length > 1 ? ` · ${due.length}` : ""}
              </Text>
              <Text style={s.labSub} numberOfLines={stacked ? 2 : undefined}>
                {L(
                  `You cleared "${dueTitle}" ${due[0].days} day${due[0].days === 1 ? "" : "s"} ago. Solve it again with new numbers and no hints.`,
                  `คุณผ่าน "${dueTitle}" มาแล้ว ${due[0].days} วัน ลองแก้อีกครั้งด้วยตัวเลขชุดใหม่โดยไม่มีคำใบ้`,
                )}
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={C.dim} />
          </Pressable>
        </FadeSlideIn>
      ) : null}

      {askSurvey ? (
        <FadeSlideIn delay={240}>
          <Pressable
            style={(st) => [s.lab, s.survey, (st as { hovered?: boolean }).hovered && { borderColor: C.cyan }]}
            onPress={() => router.push(href("/survey"))}
            accessibilityRole="button"
          >
            <View style={[s.labIcon, { backgroundColor: "rgba(0,200,255,0.1)" }]}>
              <Icon name="clipboard" size={22} color={C.cyan} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.labTitle, { color: C.cyan }]}>{L("TELL US WHAT YOU THINK", "บอกความคิดเห็นของคุณ")}</Text>
              <Text style={s.labSub} numberOfLines={stacked ? 2 : undefined}>{L("A two-minute survey about your experience so far.", "แบบสอบถามสองนาทีเกี่ยวกับประสบการณ์ที่ผ่านมาของคุณ")}</Text>
            </View>
            <Icon name="chevron-right" size={20} color={C.dim} />
          </Pressable>
        </FadeSlideIn>
      ) : null}
    </>
  );

  const right = (
    <>
      <FadeSlideIn delay={120}>
        <View style={s.sectionRow}>
          <Text style={s.section} role="heading" aria-level={2}>
            {L("YOUR MISSION PATH", "เส้นทางภารกิจของคุณ")}
          </Text>
          <Text style={s.sectionRight}>
            {L("CH", "บท")} {chapterId} · {prog.done}/{prog.total}
          </Text>
        </View>
        <View style={s.chapterCard}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[s.chapterKicker, { color: chapter.color }]}>{L("CHAPTER", "บทที่")} 0{chapterId}</Text>
            <Text style={s.chapterTitle}>{chapterText(chapter, lang).title}</Text>
            {upNext ? (
              <Text style={s.chapterSub}>{L("Support level", "ระดับการช่วยเหลือ")}: {tierName(tierFor(state, upNext), lang)}</Text>
            ) : (
              <Text style={[s.chapterSub, { color: C.green }]}>{L("All missions cleared. Replay for 3 stars.", "ผ่านครบทุกภารกิจแล้ว เล่นซ้ำเพื่อเก็บ 3 ดาว")}</Text>
            )}
          </View>
          <Btn label={L("BRIEFING", "สรุปบทเรียน")} icon="book" tone="outline" small onPress={() => router.push(href(`/briefing/${chapterId}`))} />
        </View>
      </FadeSlideIn>

      <View style={s.path}>
        {missionsOf(chapterId).map((def, i) => {
          const cleared = isCleared(state, def.id);
          const open = isUnlocked(state, def.id);
          const status: NodeState = cleared ? "complete" : open ? "current" : def.boss ? "boss" : "locked";
          return (
            <FadeSlideIn key={def.id} delay={200 + i * 50}>
              {i > 0 ? <View style={[s.connector, cleared && { backgroundColor: "rgba(0,255,159,0.4)" }]} /> : null}
              <Node def={def} status={status} stars={state.records[def.id]?.stars ?? 0} onPress={open ? () => play(def) : undefined} />
            </FadeSlideIn>
          );
        })}
      </View>
    </>
  );

  return (
    <Screen>
      <PageTitle title={L("Home", "หน้าหลัก")} />
      <View role="banner" style={[s.header, { paddingTop: insets.top + 14 }]}>
        <View style={s.headerInner}>
          <Text style={s.greeting}>{L(`${greeting}, Cadet`, greeting)}</Text>
          <Text style={s.name} role="heading" aria-level={1}>
            {state.profile?.name}
          </Text>
          <View style={s.pills}>
            <Pill icon="bolt" text={`${state.xp.toLocaleString("en-US")} XP`} />
            <Pill icon="flame" text={L(`${streak} day${streak === 1 ? "" : "s"}`, `${streak} วัน`)} color={C.orange} />
            <Pill icon="star" text={`${totalStars(state)}/${MISSIONS.length * 3}`} color={C.teal} />
          </View>
        </View>
      </View>
      <Page width="wide">
        <Split left={left} right={right} gap={32} />
      </Page>
    </Screen>
  );
}

const useStyles = makeStyles((sw) => ({
  header: { backgroundColor: C.panel, borderBottomWidth: 1, borderBottomColor: C.line, alignItems: "center" },
  headerInner: { width: "100%", maxWidth: PAGE.wide, paddingHorizontal: sw(20), paddingBottom: sw(16) },
  greeting: { fontSize: sw(13), color: C.muted },
  name: { fontSize: sw(22), fontWeight: "bold", color: C.text, marginTop: 2 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: sw(10), marginTop: sw(14) },

  next: { borderRadius: sw(18), borderWidth: 1, borderColor: "rgba(255,168,39,0.45)", padding: sw(16), marginTop: sw(20) },
  nextTitle: { fontSize: sw(21), fontWeight: "bold", color: C.text, marginTop: sw(8) },
  daily: { borderRadius: sw(18), borderWidth: 1, borderColor: "rgba(0,200,255,0.3)", padding: sw(16), marginTop: sw(14) },
  dailyTitle: { fontSize: sw(18), fontWeight: "bold", color: C.text, marginTop: sw(8) },
  dailyDesc: { fontSize: sw(12.5), color: C.muted, marginTop: sw(4), lineHeight: sw(19) },
  dailyFooter: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: sw(10), marginTop: sw(14) },
  timer: {
    flexDirection: "row",
    alignItems: "center",
    gap: sw(6),
    borderWidth: 1,
    borderColor: C.orange,
    borderRadius: 20,
    paddingHorizontal: sw(12),
    height: sw(34),
  },
  timerText: { fontFamily: MONO, fontSize: sw(12), color: C.orange, letterSpacing: 1 },

  lab: {
    flexDirection: "row",
    alignItems: "center",
    gap: sw(12),
    backgroundColor: "rgba(91,69,224,0.1)",
    borderWidth: 1,
    borderColor: "rgba(91,69,224,0.3)",
    borderRadius: sw(14),
    padding: sw(14),
    marginTop: sw(16),
  },
  labIcon: {
    width: sw(42),
    height: sw(42),
    borderRadius: sw(12),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.12)",
  },
  review: { backgroundColor: "rgba(255,168,39,0.06)", borderColor: "rgba(255,168,39,0.3)", marginTop: sw(12) },
  survey: { backgroundColor: "rgba(0,200,255,0.05)", borderColor: "rgba(0,200,255,0.25)", marginTop: sw(12) },
  labTitle: { fontFamily: MONO, fontSize: sw(11), color: C.purple, letterSpacing: 2 },
  labSub: { fontSize: sw(12.5), color: C.muted, marginTop: 2, lineHeight: sw(18) },

  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: sw(24), marginBottom: sw(10) },
  section: { fontFamily: MONO, fontSize: sw(13), color: C.muted, letterSpacing: 2 },
  sectionRight: { fontFamily: MONO, fontSize: sw(11), color: C.green, letterSpacing: 1 },
  chapterCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: sw(10),
    backgroundColor: C.cardSoft,
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.15)",
    borderRadius: sw(12),
    padding: sw(12),
  },
  chapterKicker: { fontFamily: MONO, fontSize: sw(9.5), letterSpacing: 2 },
  chapterTitle: { fontSize: sw(14.5), fontWeight: "600", color: C.text, marginTop: 2 },
  chapterSub: { fontSize: sw(11.5), color: C.muted, marginTop: 2 },

  path: { marginTop: sw(16) },
  connector: { width: 2, height: sw(14), marginLeft: sw(27), backgroundColor: "rgba(0,200,255,0.2)" },
  node: { flexDirection: "row", alignItems: "center", gap: sw(14), paddingVertical: sw(4), paddingRight: sw(6), borderRadius: sw(30) },
  nodeHover: { backgroundColor: "rgba(0,200,255,0.06)" },
  circle: { width: sw(56), height: sw(56), borderRadius: sw(28), alignItems: "center", justifyContent: "center", borderWidth: 3 },
  circleDone: { borderColor: C.green, boxShadow: "0 0 12px rgba(0,255,159,0.5)" },
  circleNow: { borderColor: C.cyan, backgroundColor: "rgba(0,200,255,0.15)", boxShadow: "0 0 18px rgba(0,200,255,0.7)" },
  circleLocked: { borderColor: C.lock, backgroundColor: "rgba(10,22,40,0.8)" },
  circleBoss: { borderColor: "rgba(255,71,87,0.35)", backgroundColor: "rgba(10,22,40,0.8)" },
  nodeText: { flex: 1, gap: 2, minWidth: 0 },
  nodeTitle: { fontSize: sw(14.5), fontWeight: "600", color: C.text },
  nodeSub: { fontSize: sw(11.5), color: C.muted },
}));
