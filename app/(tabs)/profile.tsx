import { FadeSlideIn } from "@/components/fade-slide-in";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import {
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W } = Dimensions.get("window");
const sw = (n: number) => (n / 388) * W;

const FONT_MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_ACTIVE = [true, true, true, true, true, true, true];

const BADGES = [
  { emoji: "\u26A1", label: "First Impulse" },
  { emoji: "\uD83D\uDE80", label: "Orbital Pro" },
  { emoji: "\uD83C\uDFAF", label: "Sharpshooter" },
  { emoji: "\uD83D\uDD25", label: "7 Day Streak" },
  { emoji: "\uD83D\uDC80", label: "Crisis Expert" },
  { emoji: "\uD83C\uDF1F", label: "Space Master" },
  { emoji: "\uD83E\uDDEA", label: "Physics God" },
  { emoji: "\uD83D\uDC51", label: "Champion" },
];

const BAR_HEIGHTS = [48, 32, 64, 44, 72, 56, 36];
const BAR_DAYS_LABEL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  // Animated progress bar (0 → 73%)
  const progressBarWidth = useSharedValue(0);
  const barStyle = useAnimatedStyle(() => ({
    width: `${progressBarWidth.value}%` as `${number}%`,
  }));
  // Start after the card fades in
  useEffect(() => {
    progressBarWidth.value = withDelay(
      500,
      withTiming(73, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: sw(20) }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header / Avatar Section ── */}
        <FadeSlideIn delay={0}>
          <View style={[s.header, { paddingTop: insets.top + sw(14) }]}>
            <View style={s.avatarRow}>
              <View style={s.avatarCircle}>
                <Text style={s.avatarEmoji}>
                  {"\uD83D\uDC68\u200D\uD83D\uDE80"}
                </Text>
              </View>
              <View style={s.avatarInfo}>
                <Text style={s.userName}>Pariphat R.</Text>
                <Text style={s.handle}>@cadet_pariphat {"\u00B7"} KBSW</Text>
                <View style={s.badgeRow}>
                  <View style={s.cadetBadge}>
                    <Text style={s.cadetBadgeText}>{"\u2B50"} CADET II</Text>
                  </View>
                  <Text style={s.topPercent}>Top 12%</Text>
                </View>
              </View>
              <Text style={s.settingsIcon}>{"\u2699\uFE0F"}</Text>
            </View>

            {/* Quick Stats */}
            <View style={s.quickStats}>
              <View style={s.qStat}>
                <Text style={s.qStatVal}>1,240</Text>
                <Text style={s.qStatLabel}>Total XP</Text>
              </View>
              <View style={s.qStat}>
                <Text style={s.qStatVal}>{"\uD83D\uDD25"} 7</Text>
                <Text style={s.qStatLabel}>Day Streak</Text>
              </View>
              <View style={s.qStat}>
                <Text style={s.qStatVal}>87%</Text>
                <Text style={s.qStatLabel}>Accuracy</Text>
              </View>
              <View style={s.qStat}>
                <Text style={s.qStatVal}>14</Text>
                <Text style={s.qStatLabel}>Missions</Text>
              </View>
            </View>
          </View>
        </FadeSlideIn>

        <View style={s.body}>
          {/* ── Level Progress ── */}
          <FadeSlideIn delay={100}>
            <Text style={s.sectionLabel}>LEVEL PROGRESS</Text>
            <View style={s.card}>
              <View style={s.levelRow}>
                <Text style={s.levelText}>Silver II {"\u2192"} Silver III</Text>
                <Text style={s.levelXp}>1,240 / 1,700 XP</Text>
              </View>
              <View style={s.levelBarBg}>
                <Animated.View style={[s.levelBarFill, barStyle]} />
              </View>
            </View>
          </FadeSlideIn>

          {/* ── Streak Tracker ── */}
          <FadeSlideIn delay={200}>
            <Text style={s.sectionLabel}>STREAK TRACKER</Text>
            <View style={s.card}>
              <View style={s.streakTopRow}>
                <View>
                  <Text style={s.streakSubLabel}>Current Streak</Text>
                  <View style={s.streakBigRow}>
                    <Text style={s.streakBigNum}>7</Text>
                    <Text style={s.streakFire}>{"\uD83D\uDD25"}</Text>
                  </View>
                </View>
                <View style={s.streakBestWrap}>
                  <Text style={s.streakSubLabel}>Best Streak</Text>
                  <Text style={s.streakBestNum}>14</Text>
                </View>
              </View>
              <View style={s.daysRow}>
                {DAYS.map((d, i) => (
                  <View
                    key={i}
                    style={[s.dayCircle, DAY_ACTIVE[i] && s.dayCircleActive]}
                  >
                    <Text style={[s.dayText, DAY_ACTIVE[i] && s.dayTextActive]}>
                      {d}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeSlideIn>

          {/* ── Badges ── */}
          <FadeSlideIn delay={300}>
            <Text style={s.sectionLabel}>BADGES EARNED</Text>
            <View style={s.card}>
              <View style={s.badgesGrid}>
                {BADGES.map((b, i) => (
                  <View key={i} style={s.badgeItem}>
                    <View style={s.badgeCircle}>
                      <Text style={s.badgeEmoji}>{b.emoji}</Text>
                    </View>
                    <Text style={s.badgeName}>{b.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeSlideIn>

          {/* ── Accuracy This Week ── */}
          <FadeSlideIn delay={380}>
            <Text style={s.sectionLabel}>ACCURACY THIS WEEK</Text>
            <View style={s.card}>
              <View style={s.perfRow}>
                <Text style={s.perfLabel}>Performance Trend</Text>
                <Text style={s.perfUp}>{"\u2191"} +12%</Text>
              </View>
              <View style={s.chartRow}>
                {BAR_HEIGHTS.map((h, i) => (
                  <View key={i} style={s.chartCol}>
                    <View
                      style={[
                        s.chartBar,
                        { height: sw(h) },
                        i === BAR_HEIGHTS.length - 1 && s.chartBarToday,
                      ]}
                    />
                    <Text style={s.chartDayLabel}>{BAR_DAYS_LABEL[i]}</Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeSlideIn>

          {/* ── AI Learning Insights ── */}
          <FadeSlideIn delay={460}>
            <Text style={s.sectionLabel}>AI LEARNING INSIGHTS</Text>
            <View style={s.card}>
              <Text style={s.insightSub}>Common mistakes detected:</Text>
              <View style={s.insightList}>
                <View style={s.insightItem}>
                  <View style={s.dot} />
                  <Text style={s.insightText}>
                    Vector direction errors {"\u00D7"}3
                  </Text>
                </View>
                <View style={s.insightItem}>
                  <View style={s.dot} />
                  <Text style={s.insightText}>
                    Force vs Impulse confusion {"\u00D7"}1
                  </Text>
                </View>
                <View style={s.insightItem}>
                  <View style={[s.dot, { backgroundColor: "#00ff9f" }]} />
                  <Text style={s.insightText}>
                    Conservation law {"\u2713"} mastered
                  </Text>
                </View>
              </View>
            </View>
          </FadeSlideIn>
        </View>
      </ScrollView>
    </View>
  );
}

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  avatarRow: ViewStyle;
  avatarCircle: ViewStyle;
  avatarEmoji: TextStyle;
  avatarInfo: ViewStyle;
  userName: TextStyle;
  handle: TextStyle;
  badgeRow: ViewStyle;
  cadetBadge: ViewStyle;
  cadetBadgeText: TextStyle;
  topPercent: TextStyle;
  settingsIcon: TextStyle;
  quickStats: ViewStyle;
  qStat: ViewStyle;
  qStatVal: TextStyle;
  qStatLabel: TextStyle;
  body: ViewStyle;
  sectionLabel: TextStyle;
  card: ViewStyle;
  levelRow: ViewStyle;
  levelText: TextStyle;
  levelXp: TextStyle;
  levelBarBg: ViewStyle;
  levelBarFill: ViewStyle;
  streakTopRow: ViewStyle;
  streakSubLabel: TextStyle;
  streakBigRow: ViewStyle;
  streakBigNum: TextStyle;
  streakFire: TextStyle;
  streakBestWrap: ViewStyle;
  streakBestNum: TextStyle;
  daysRow: ViewStyle;
  dayCircle: ViewStyle;
  dayCircleActive: ViewStyle;
  dayText: TextStyle;
  dayTextActive: TextStyle;
  badgesGrid: ViewStyle;
  badgeItem: ViewStyle;
  badgeCircle: ViewStyle;
  badgeEmoji: TextStyle;
  badgeName: TextStyle;
  perfRow: ViewStyle;
  perfLabel: TextStyle;
  perfUp: TextStyle;
  chartRow: ViewStyle;
  chartCol: ViewStyle;
  chartBar: ViewStyle;
  chartBarToday: ViewStyle;
  chartDayLabel: TextStyle;
  insightSub: TextStyle;
  insightList: ViewStyle;
  insightItem: ViewStyle;
  dot: ViewStyle;
  insightText: TextStyle;
};

const s = StyleSheet.create<Styles>({
  container: { flex: 1, backgroundColor: "#060d1f" },

  /* Header */
  header: {
    paddingHorizontal: sw(20),
    paddingBottom: sw(16),
    backgroundColor: "rgba(6,13,31,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,200,255,0.2)",
  },
  avatarRow: { flexDirection: "row", alignItems: "center" },
  avatarCircle: {
    width: sw(60),
    height: sw(60),
    borderRadius: sw(30),
    backgroundColor: "rgba(0,200,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: sw(28) },
  avatarInfo: { flex: 1, marginLeft: sw(14) },
  userName: {
    fontSize: sw(18),
    fontWeight: "bold",
    color: "#e8f4ff",
  },
  handle: {
    fontSize: sw(12),
    color: "#8899aa",
    marginTop: 2,
  },
  badgeRow: { flexDirection: "row", alignItems: "center", marginTop: sw(6) },
  cadetBadge: {
    backgroundColor: "rgba(255,168,39,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,168,39,0.3)",
    borderRadius: 10,
    paddingHorizontal: sw(8),
    paddingVertical: sw(3),
  },
  cadetBadgeText: {
    fontFamily: FONT_MONO,
    fontSize: sw(9),
    color: "#ffa827",
    letterSpacing: 1,
  },
  topPercent: {
    fontSize: sw(11),
    color: "#8899aa",
    marginLeft: sw(8),
  },
  settingsIcon: { fontSize: sw(22), marginLeft: sw(8) },

  quickStats: {
    flexDirection: "row",
    marginTop: sw(16),
    backgroundColor: "rgba(0,200,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.15)",
    borderRadius: sw(12),
  },
  qStat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: sw(12),
  },
  qStatVal: {
    fontFamily: FONT_MONO,
    fontSize: sw(16),
    color: "#e8f4ff",
    fontWeight: "bold",
  },
  qStatLabel: {
    fontSize: sw(10),
    color: "#8899aa",
    marginTop: 2,
  },

  /* Body */
  body: { paddingHorizontal: sw(20) },

  sectionLabel: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#8899aa",
    letterSpacing: 2,
    marginTop: sw(16),
    marginBottom: sw(8),
  },

  card: {
    backgroundColor: "rgba(0,200,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.15)",
    borderRadius: sw(14),
    padding: sw(15),
  },

  /* Level */
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: sw(10),
  },
  levelText: { fontSize: sw(13), color: "#e8f4ff" },
  levelXp: {
    fontFamily: FONT_MONO,
    fontSize: sw(12),
    color: "#8899aa",
  },
  levelBarBg: {
    height: sw(8),
    backgroundColor: "rgba(0,200,255,0.15)",
    borderRadius: 4,
  },
  levelBarFill: {
    height: sw(8),
    backgroundColor: "#00c8ff",
    borderRadius: 4,
  },

  /* Streak */
  streakTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: sw(14),
  },
  streakSubLabel: {
    fontSize: sw(12),
    color: "#8899aa",
  },
  streakBigRow: { flexDirection: "row", alignItems: "center", gap: sw(6) },
  streakBigNum: {
    fontFamily: FONT_MONO,
    fontSize: sw(32),
    color: "#e8f4ff",
    fontWeight: "bold",
  },
  streakFire: { fontSize: sw(28) },
  streakBestWrap: { alignItems: "flex-end" },
  streakBestNum: {
    fontFamily: FONT_MONO,
    fontSize: sw(22),
    color: "#e8f4ff",
    fontWeight: "bold",
  },
  daysRow: { flexDirection: "row", justifyContent: "space-between" },
  dayCircle: {
    width: sw(34),
    height: sw(34),
    borderRadius: sw(17),
    backgroundColor: "rgba(0,200,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleActive: {
    backgroundColor: "rgba(0,200,255,0.2)",
    borderColor: "#00c8ff",
  },
  dayText: {
    fontFamily: FONT_MONO,
    fontSize: sw(11),
    color: "#8899aa",
  },
  dayTextActive: { color: "#00c8ff" },

  /* Badges */
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: sw(14),
  },
  badgeItem: {
    width: "24%",
    alignItems: "center",
  },
  badgeCircle: {
    width: sw(48),
    height: sw(48),
    borderRadius: sw(24),
    backgroundColor: "rgba(0,200,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeEmoji: { fontSize: sw(20) },
  badgeName: {
    fontSize: sw(9),
    color: "#8899aa",
    marginTop: sw(4),
    textAlign: "center",
  },

  /* Chart */
  perfRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: sw(12),
  },
  perfLabel: { fontSize: sw(13), color: "#e8f4ff" },
  perfUp: {
    fontFamily: FONT_MONO,
    fontSize: sw(12),
    color: "#00ff9f",
  },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  chartCol: { alignItems: "center" },
  chartBar: {
    width: sw(30),
    backgroundColor: "rgba(0,200,255,0.25)",
    borderRadius: sw(4),
  },
  chartBarToday: { backgroundColor: "#00c8ff" },
  chartDayLabel: {
    fontSize: sw(9),
    color: "#8899aa",
    marginTop: sw(6),
  },

  /* Insights */
  insightSub: {
    fontSize: sw(13),
    color: "#e8f4ff",
    marginBottom: sw(10),
  },
  insightList: { gap: sw(8) },
  insightItem: { flexDirection: "row", alignItems: "center", gap: sw(10) },
  dot: {
    width: sw(8),
    height: sw(8),
    borderRadius: sw(4),
    backgroundColor: "#ff4757",
  },
  insightText: { fontSize: sw(13), color: "#e8f4ff" },
});
