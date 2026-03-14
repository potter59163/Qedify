import { FadeSlideIn } from "@/components/fade-slide-in";
import { getPhoneFrameWindow } from "@/constants/device-frame";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W } = getPhoneFrameWindow();
const sw = (n: number) => (n / 388) * W;

const FONT_MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

// ── Learning outcome status labels ──
type LOStatus = "mastered" | "partial" | "review" | undefined;

function LOBadge({ status }: { status: LOStatus }) {
  if (status === "mastered")
    return (
      <View style={s.loBadgeMastered}>
        <Text style={s.loBadgeMasteredText}>{"\u2605"} MASTERED</Text>
      </View>
    );
  if (status === "partial")
    return (
      <View style={s.loBadgePartial}>
        <Text style={s.loBadgePartialText}>{"\u25D0"} PARTIAL</Text>
      </View>
    );
  return (
    <View style={s.loBadgeReview}>
      <Text style={s.loBadgeReviewText}>{"\u26A0"} REVIEW</Text>
    </View>
  );
}

// Dynamic physics insight per mission + performance
function getInsight(
  missionId: string,
  attempts: number,
  hintsUsed: number,
): string {
  if (missionId === "orbital-rescue") {
    if (attempts === 0 && hintsUsed === 0) {
      return "Perfect execution! You correctly applied J = F\u00D7\u0394t without any hints. You have mastered impulse calculation and understand the relationship between force, time, and momentum change.";
    }
    if (attempts === 0) {
      return "Good work! You found the correct impulse. Remember: J = F\u00D7\u0394t. Many valid (F, t) combinations exist \u2014 this flexibility shows real understanding of the formula.";
    }
    return "You got there! Key takeaway: Impulse J = F\u00D7\u0394t. The force and time interval are MULTIPLIED (not added). Increasing either F or t increases the impulse applied to the spacecraft.";
  }
  if (missionId === "the-junction") {
    if (attempts === 0 && hintsUsed === 0) {
      return "Excellent mastery! You applied momentum conservation without any help: p_before = p_after. This is the foundation of all collision physics \u2014 momentum is always conserved in closed systems.";
    }
    if (attempts === 0) {
      return "Well done! You correctly identified the collision type and solved for final velocity. Momentum conservation (p_before = p_after) is a universal law \u2014 it applies to every collision in the universe.";
    }
    return "Keep practicing! The key insight: momentum is ALWAYS conserved. Identify the collision type first, then apply the correct formula: inelastic \u2192 v_f = p_total \u00F7 (m\u2081+m\u2082).";
  }
  return "Physics mission complete! Review the formulas and apply them to the next challenge.";
}

// What to study next based on LO performance
function getReviewItems(
  missionId: string,
  lo1: LOStatus,
  lo2: LOStatus,
  lo3: LOStatus,
): string[] {
  const items: string[] = [];
  if (missionId === "orbital-rescue") {
    if (lo1 === "review") items.push("Revisit: J = F \u00D7 \u0394t formula in Tutorial");
    if (lo2 === "review") items.push("Practice: Arithmetic with large numbers");
    if (lo3 === "review") items.push("Challenge: Solve without using hints next time");
  } else if (missionId === "the-junction") {
    if (lo1 === "review") items.push("Review: Elastic vs. inelastic collision definitions");
    if (lo2 === "review") items.push("Revisit: Momentum conservation law (p_before = p_after)");
    if (lo3 === "review") items.push("Practice: Calculate v_f from p_total and total mass");
  }
  return items;
}

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // ── Read performance params passed from mission screens ──
  const params = useLocalSearchParams<{
    missionId?: string;
    missionName?: string;
    chapter?: string;
    stars?: string;
    xp?: string;
    accuracy?: string;
    attempts?: string;
    hintsUsed?: string;
    maxHints?: string;
    lo1?: string;
    lo2?: string;
    lo3?: string;
  }>();

  const missionId = params.missionId ?? "orbital-rescue";
  const missionName = params.missionName ?? "Orbital Rescue";
  const chapter = params.chapter ?? "Chapter 2";
  const starsCount = parseInt(params.stars ?? "3", 10);
  const xpEarned = parseInt(params.xp ?? "320", 10);
  const accuracy = parseInt(params.accuracy ?? "87", 10);
  const attempts = parseInt(params.attempts ?? "0", 10);
  const hintsUsed = parseInt(params.hintsUsed ?? "0", 10);
  const maxHints = parseInt(params.maxHints ?? "3", 10);
  const lo1 = (params.lo1 as LOStatus) ?? "mastered";
  const lo2 = (params.lo2 as LOStatus) ?? "mastered";
  const lo3 = (params.lo3 as LOStatus) ?? "mastered";

  const overallMastered =
    [lo1, lo2, lo3].filter((s) => s === "mastered").length;
  const reviewItems = getReviewItems(missionId, lo1, lo2, lo3);
  const insight = getInsight(missionId, attempts, hintsUsed);

  // ── Star pop-in ──
  const star1Scale = useSharedValue(0);
  const star2Scale = useSharedValue(0);
  const star3Scale = useSharedValue(0);

  // ── XP count-up ──
  const [displayXP, setDisplayXP] = useState(0);

  useEffect(() => {
    star1Scale.value = withDelay(220, withSpring(1, { damping: 5, stiffness: 180 }));
    if (starsCount >= 2)
      star2Scale.value = withDelay(380, withSpring(1, { damping: 5, stiffness: 180 }));
    if (starsCount >= 3)
      star3Scale.value = withDelay(540, withSpring(1, { damping: 5, stiffness: 180 }));

    const startAt = Date.now() + 350;
    const tick = setInterval(() => {
      const now = Date.now();
      if (now < startAt) return;
      const t = Math.min((now - startAt) / 1400, 1);
      setDisplayXP(Math.round((1 - Math.pow(1 - t, 3)) * xpEarned));
      if (t >= 1) clearInterval(tick);
    }, 16);
    return () => clearInterval(tick);
  }, []);

  const star1Style = useAnimatedStyle(() => ({
    transform: [{ scale: star1Scale.value }],
  }));
  const star2Style = useAnimatedStyle(() => ({
    transform: [{ scale: star2Scale.value }],
  }));
  const star3Style = useAnimatedStyle(() => ({
    transform: [{ scale: star3Scale.value }],
  }));

  // LO labels per mission
  const loLabels =
    missionId === "orbital-rescue"
      ? [
          "\u26A1 Impulse formula (J = F\u00D7\u0394t)",
          "\uD83D\uDD22 Impulse calculation",
          "\uD83D\uDCA1 Independent reasoning",
        ]
      : [
          "\uD83D\uDE83 Collision type identification",
          "\u2696\uFE0F Momentum conservation law",
          "\uD83D\uDD22 Final velocity calculation",
        ];

  const nextMissionRoute =
    missionId === "orbital-rescue" ? "/the-junction" : "/(tabs)";
  const nextMissionLabel =
    missionId === "orbital-rescue" ? "NEXT MISSION \u2192" : "BACK TO BASE \uD83C\uDFE0";

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: sw(30) }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Celebration Header ── */}
        <FadeSlideIn delay={0} offsetY={-20}>
          <View style={[s.celebHeader, { paddingTop: insets.top + sw(40) }]}>
            <Text style={s.celebEmoji}>{"\uD83C\uDF89"}</Text>
            <Text style={s.celebTitle}>MISSION COMPLETE!</Text>
            <Text style={s.celebSub}>
              {missionName} {"\u00B7"} {chapter}
            </Text>
          </View>
        </FadeSlideIn>

        {/* ── Stars ── */}
        <FadeSlideIn delay={200} offsetY={0}>
          <View style={s.starsRow}>
            <Animated.Text
              style={[
                s.starFull,
                star1Style,
                starsCount < 1 && { color: "#2a3a4a" },
              ]}
            >
              {"\u2605"}
            </Animated.Text>
            <Animated.Text
              style={[
                s.starFull,
                star2Style,
                starsCount < 2 && { color: "#2a3a4a" },
              ]}
            >
              {"\u2605"}
            </Animated.Text>
            <Animated.Text
              style={[
                s.starFull,
                star3Style,
                starsCount < 3 && { color: "#2a3a4a" },
              ]}
            >
              {"\u2605"}
            </Animated.Text>
          </View>
          <Text style={s.starsLabel}>
            {starsCount === 3
              ? "PERFECT SCORE"
              : starsCount === 2
                ? "GOOD JOB"
                : "COMPLETED"}
          </Text>
        </FadeSlideIn>

        {/* ── Stats Row ── */}
        <FadeSlideIn delay={320}>
          <View style={s.statsCard}>
            <View style={s.statCol}>
              <Text style={s.statLabel}>XP EARNED</Text>
              <Text style={s.statValueCyan}>+{displayXP} XP</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statCol}>
              <Text style={s.statLabel}>ACCURACY</Text>
              <Text style={s.statValueCyan}>{accuracy}%</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statCol}>
              <Text style={s.statLabel}>MASTERY</Text>
              <Text style={s.statValueCyan}>{overallMastered}/3</Text>
            </View>
          </View>
        </FadeSlideIn>

        {/* ── Performance Breakdown ── */}
        <FadeSlideIn delay={420}>
          <View style={s.breakdownCard}>
            <View style={s.breakdownRow}>
              <Text style={s.breakdownLeft}>{"\u23F1"} Time / Attempts</Text>
              <Text style={s.breakdownRight}>
                {attempts === 0 ? "1st try!" : `${attempts + 1} tries`}
              </Text>
            </View>
            <View style={s.breakdownDivider} />
            <View style={s.breakdownRow}>
              <Text style={s.breakdownLeft}>{"\uD83D\uDCA1"} Hints Used</Text>
              <Text
                style={[
                  s.breakdownRight,
                  hintsUsed === 0 && { color: "#00ff9f" },
                ]}
              >
                {hintsUsed} / {maxHints}
                {hintsUsed === 0 ? "  \u2713" : ""}
              </Text>
            </View>
            <View style={s.breakdownDivider} />
            <View style={s.breakdownRow}>
              <Text style={s.breakdownLeft}>{"\u2b50"} Stars Earned</Text>
              <Text style={s.breakdownRight}>
                {starsCount} / 3{" "}
                {"\u2605".repeat(starsCount)}
                {"\u2606".repeat(3 - starsCount)}
              </Text>
            </View>
          </View>
        </FadeSlideIn>

        {/* ── Learning Outcomes Mastery Checklist ── */}
        <FadeSlideIn delay={480}>
          <View style={s.masteryCard}>
            <Text style={s.masteryTitle}>
              {"\uD83D\uDD2C"} LEARNING OUTCOMES
            </Text>
            {[lo1, lo2, lo3].map((status, i) => (
              <View key={i}>
                <View style={s.loRow}>
                  <Text style={s.loLabel}>{loLabels[i]}</Text>
                  <LOBadge status={status} />
                </View>
                {i < 2 && <View style={s.breakdownDivider} />}
              </View>
            ))}
          </View>
        </FadeSlideIn>

        {/* ── Needs Review Section (only if any LO needs review) ── */}
        {reviewItems.length > 0 && (
          <FadeSlideIn delay={520}>
            <View style={s.reviewCard}>
              <Text style={s.reviewTitle}>
                {"\uD83D\uDCDA"} TO REVIEW BEFORE NEXT MISSION
              </Text>
              {reviewItems.map((item, i) => (
                <Text key={i} style={s.reviewItem}>
                  {"\u25B8"} {item}
                </Text>
              ))}
            </View>
          </FadeSlideIn>
        )}

        {/* ── Physics Insight ── */}
        <FadeSlideIn delay={560}>
          <View style={s.insightCard}>
            <Text style={s.insightTitle}>{"\uD83D\uDD2C"} PHYSICS INSIGHT</Text>
            <Text style={s.insightText}>{insight}</Text>
          </View>
        </FadeSlideIn>

        {/* ── Action Buttons ── */}
        <FadeSlideIn delay={640}>
          <View style={s.actions}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push(nextMissionRoute as never)}
            >
              <LinearGradient
                colors={["#00c8ff", "#0d4eaa"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={s.primaryBtn}
              >
                <Text style={s.primaryBtnText}>{nextMissionLabel}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.secondaryBtn}
              activeOpacity={0.7}
              onPress={() => router.back()}
            >
              <Text style={s.secondaryBtnText}>REVIEW SOLUTION</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.homeBtn}
              activeOpacity={0.7}
              onPress={() => router.replace("/(tabs)")}
            >
              <Text style={s.homeBtnText}>{"\uD83C\uDFE0"} HOME</Text>
            </TouchableOpacity>
          </View>
        </FadeSlideIn>
      </ScrollView>
    </View>
  );
}

type Styles = {
  container: ViewStyle;
  celebHeader: ViewStyle;
  celebEmoji: TextStyle;
  celebTitle: TextStyle;
  celebSub: TextStyle;
  starsRow: ViewStyle;
  starsLabel: TextStyle;
  starFull: TextStyle;
  statsCard: ViewStyle;
  statCol: ViewStyle;
  statDivider: ViewStyle;
  statLabel: TextStyle;
  statValueCyan: TextStyle;
  breakdownCard: ViewStyle;
  breakdownRow: ViewStyle;
  breakdownDivider: ViewStyle;
  breakdownLeft: TextStyle;
  breakdownRight: TextStyle;
  masteryCard: ViewStyle;
  masteryTitle: TextStyle;
  loRow: ViewStyle;
  loLabel: TextStyle;
  loBadgeMastered: ViewStyle;
  loBadgeMasteredText: TextStyle;
  loBadgePartial: ViewStyle;
  loBadgePartialText: TextStyle;
  loBadgeReview: ViewStyle;
  loBadgeReviewText: TextStyle;
  reviewCard: ViewStyle;
  reviewTitle: TextStyle;
  reviewItem: TextStyle;
  insightCard: ViewStyle;
  insightTitle: TextStyle;
  insightText: TextStyle;
  actions: ViewStyle;
  primaryBtn: ViewStyle;
  primaryBtnText: TextStyle;
  secondaryBtn: ViewStyle;
  secondaryBtnText: TextStyle;
  homeBtn: ViewStyle;
  homeBtnText: TextStyle;
};

const s = StyleSheet.create<Styles>({
  container: { flex: 1, backgroundColor: "#060d1f" },

  /* Celebration */
  celebHeader: { alignItems: "center", paddingBottom: sw(10) },
  celebEmoji: { fontSize: sw(60) },
  celebTitle: {
    fontFamily: FONT_MONO,
    fontSize: sw(20),
    color: "#e8f4ff",
    fontWeight: "bold",
    letterSpacing: 2,
    marginTop: sw(12),
  },
  celebSub: {
    fontSize: sw(14),
    color: "#8899aa",
    marginTop: sw(4),
  },

  /* Stars */
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: sw(8),
    paddingTop: sw(16),
    paddingBottom: sw(4),
  },
  starsLabel: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#ffa827",
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: sw(8),
  },
  starFull: { fontSize: sw(36), color: "#ffa827" },

  /* Stats */
  statsCard: {
    flexDirection: "row",
    marginHorizontal: sw(24),
    backgroundColor: "rgba(0,200,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.15)",
    borderRadius: sw(14),
    paddingVertical: sw(16),
  },
  statCol: { flex: 1, alignItems: "center" },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(0,200,255,0.12)",
    marginVertical: sw(4),
  },
  statLabel: {
    fontFamily: FONT_MONO,
    fontSize: sw(9),
    color: "#8899aa",
    letterSpacing: 1,
  },
  statValueCyan: {
    fontFamily: FONT_MONO,
    fontSize: sw(16),
    color: "#00c8ff",
    fontWeight: "bold",
    marginTop: sw(4),
  },

  /* Breakdown */
  breakdownCard: {
    marginHorizontal: sw(24),
    marginTop: sw(16),
    backgroundColor: "rgba(0,200,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.15)",
    borderRadius: sw(14),
    overflow: "hidden",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: sw(17),
    paddingVertical: sw(13),
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: "rgba(0,200,255,0.08)",
  },
  breakdownLeft: {
    fontSize: sw(13),
    color: "#e8f4ff",
  },
  breakdownRight: {
    fontFamily: FONT_MONO,
    fontSize: sw(12),
    color: "#8899aa",
  },

  /* Mastery Checklist */
  masteryCard: {
    marginHorizontal: sw(24),
    marginTop: sw(16),
    backgroundColor: "rgba(0,200,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.15)",
    borderRadius: sw(14),
    overflow: "hidden",
    paddingTop: sw(14),
  },
  masteryTitle: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#00c8ff",
    letterSpacing: 1,
    marginBottom: sw(10),
    paddingHorizontal: sw(17),
  },
  loRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: sw(17),
    paddingVertical: sw(11),
  },
  loLabel: {
    fontSize: sw(12),
    color: "#e8f4ff",
    flex: 1,
    paddingRight: sw(8),
  },
  loBadgeMastered: {
    backgroundColor: "rgba(0,255,159,0.12)",
    borderRadius: sw(6),
    paddingHorizontal: sw(7),
    paddingVertical: sw(3),
  },
  loBadgeMasteredText: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#00ff9f",
    fontWeight: "bold",
  },
  loBadgePartial: {
    backgroundColor: "rgba(255,168,39,0.12)",
    borderRadius: sw(6),
    paddingHorizontal: sw(7),
    paddingVertical: sw(3),
  },
  loBadgePartialText: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#ffa827",
    fontWeight: "bold",
  },
  loBadgeReview: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderRadius: sw(6),
    paddingHorizontal: sw(7),
    paddingVertical: sw(3),
  },
  loBadgeReviewText: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#f87171",
    fontWeight: "bold",
  },

  /* Review Card */
  reviewCard: {
    marginHorizontal: sw(24),
    marginTop: sw(16),
    backgroundColor: "rgba(239,68,68,0.06)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    borderRadius: sw(14),
    padding: sw(16),
  },
  reviewTitle: {
    fontFamily: FONT_MONO,
    fontSize: sw(9),
    color: "#f87171",
    letterSpacing: 1,
    marginBottom: sw(10),
  },
  reviewItem: {
    fontFamily: FONT_MONO,
    fontSize: sw(12),
    color: "#fca5a5",
    lineHeight: sw(20),
  },

  /* Insight */
  insightCard: {
    marginHorizontal: sw(24),
    marginTop: sw(16),
    backgroundColor: "rgba(91,69,224,0.1)",
    borderWidth: 1,
    borderColor: "rgba(91,69,224,0.3)",
    borderRadius: sw(14),
    padding: sw(16),
  },
  insightTitle: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#a78bfa",
    letterSpacing: 1,
    marginBottom: sw(8),
  },
  insightText: {
    fontSize: sw(13),
    color: "#e8f4ff",
    lineHeight: sw(21),
  },

  /* Actions */
  actions: {
    marginHorizontal: sw(24),
    marginTop: sw(20),
    gap: sw(10),
  },
  primaryBtn: {
    borderRadius: sw(14),
    height: sw(47),
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontFamily: FONT_MONO,
    fontSize: sw(14),
    color: "#e8f4ff",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  secondaryBtn: {
    borderRadius: sw(14),
    height: sw(43),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.3)",
  },
  secondaryBtnText: {
    fontFamily: FONT_MONO,
    fontSize: sw(13),
    color: "#8899aa",
    letterSpacing: 1,
  },
  homeBtn: {
    borderRadius: sw(14),
    height: sw(43),
    alignItems: "center",
    justifyContent: "center",
  },
  homeBtnText: {
    fontFamily: FONT_MONO,
    fontSize: sw(13),
    color: "rgba(136,153,170,0.6)",
    letterSpacing: 1,
  },
});
