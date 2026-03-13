import { FadeSlideIn } from "@/components/fade-slide-in";
import { getPhoneFrameWindow } from "@/constants/device-frame";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // ── Star pop-in ──
  const star1Scale = useSharedValue(0);
  const star2Scale = useSharedValue(0);
  const star3Scale = useSharedValue(0);

  // ── XP count-up ──
  const [displayXP, setDisplayXP] = useState(0);

  useEffect(() => {
    // Staggered spring pop-in for each star
    star1Scale.value = withDelay(
      220,
      withSpring(1, { damping: 5, stiffness: 180 }),
    );
    star2Scale.value = withDelay(
      380,
      withSpring(1, { damping: 5, stiffness: 180 }),
    );
    star3Scale.value = withDelay(
      540,
      withSpring(1, { damping: 5, stiffness: 180 }),
    );

    // XP count-up starting at 350ms
    const startAt = Date.now() + 350;
    const tick = setInterval(() => {
      const now = Date.now();
      if (now < startAt) return;
      const t = Math.min((now - startAt) / 1400, 1);
      setDisplayXP(Math.round((1 - Math.pow(1 - t, 3)) * 320));
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
            <Text style={s.celebSub}>Orbital Rescue {"\u00B7"} Chapter 2</Text>
          </View>
        </FadeSlideIn>

        {/* ── Stars ── */}
        <FadeSlideIn delay={200} offsetY={0}>
          <View style={s.starsRow}>
            <Animated.Text style={[s.starFull, star1Style]}>
              {"\u2605"}
            </Animated.Text>
            <Animated.Text style={[s.starFull, star2Style]}>
              {"\u2605"}
            </Animated.Text>
            <Animated.Text style={[s.starFull, star3Style]}>
              {"\u2605"}
            </Animated.Text>
          </View>
        </FadeSlideIn>

        {/* ── Stats Row ── */}
        <FadeSlideIn delay={320}>
          <View style={s.statsCard}>
            <View style={s.statCol}>
              <Text style={s.statLabel}>XP EARNED</Text>
              <Text style={s.statValueCyan}>+{displayXP} XP</Text>
            </View>
            <View style={s.statCol}>
              <Text style={s.statLabel}>ACCURACY</Text>
              <Text style={s.statValueCyan}>87%</Text>
            </View>
          </View>
        </FadeSlideIn>

        {/* ── Breakdown ── */}
        <FadeSlideIn delay={420}>
          <View style={s.breakdownCard}>
            <View style={s.breakdownRow}>
              <Text style={s.breakdownLeft}>
                {"\u26A1"} Impulse Calculation
              </Text>
              <View style={s.correctBadge}>
                <Text style={s.correctText}>{"\u2713"} CORRECT</Text>
              </View>
            </View>
            <View style={s.breakdownDivider} />
            <View style={s.breakdownRow}>
              <Text style={s.breakdownLeft}>{"\u2197"} Vector Direction</Text>
              <View style={s.correctBadge}>
                <Text style={s.correctText}>{"\u2713"} CORRECT</Text>
              </View>
            </View>
            <View style={s.breakdownDivider} />
            <View style={s.breakdownRow}>
              <Text style={s.breakdownLeft}>{"\u23F1"} Time Taken</Text>
              <Text style={s.breakdownRight}>1:36 min</Text>
            </View>
            <View style={s.breakdownDivider} />
            <View style={s.breakdownRow}>
              <Text style={s.breakdownLeft}>{"\uD83D\uDCA1"} Hints Used</Text>
              <Text style={s.breakdownRight}>1 / 3</Text>
            </View>
          </View>
        </FadeSlideIn>

        {/* ── Physics Insight ── */}
        <FadeSlideIn delay={520}>
          <View style={s.insightCard}>
            <Text style={s.insightTitle}>{"\uD83D\uDD2C"} PHYSICS INSIGHT</Text>
            <Text style={s.insightText}>
              You correctly applied J = F{"\u0394"}t = {"\u0394"}p. Increasing
              thrust force while maintaining direction allowed efficient
              momentum transfer to match rescue trajectory.
            </Text>
          </View>
        </FadeSlideIn>

        {/* ── Action Buttons ── */}
        <FadeSlideIn delay={620}>
          <View style={s.actions}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/the-junction")}
            >
              <LinearGradient
                colors={["#00c8ff", "#0d4eaa"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={s.primaryBtn}
              >
                <Text style={s.primaryBtnText}>NEXT MISSION {"\u2192"}</Text>
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
  starFull: TextStyle;
  statsCard: ViewStyle;
  statCol: ViewStyle;
  statLabel: TextStyle;
  statValueCyan: TextStyle;
  breakdownCard: ViewStyle;
  breakdownRow: ViewStyle;
  breakdownDivider: ViewStyle;
  breakdownLeft: TextStyle;
  correctBadge: ViewStyle;
  correctText: TextStyle;
  breakdownRight: TextStyle;
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
    paddingVertical: sw(16),
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
  statLabel: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#8899aa",
    letterSpacing: 1,
  },
  statValueCyan: {
    fontFamily: FONT_MONO,
    fontSize: sw(20),
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
    paddingVertical: sw(14),
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: "rgba(0,200,255,0.1)",
  },
  breakdownLeft: {
    fontSize: sw(13),
    color: "#e8f4ff",
  },
  correctBadge: {
    backgroundColor: "rgba(0,255,159,0.12)",
    borderRadius: sw(6),
    paddingHorizontal: sw(8),
    paddingVertical: sw(3),
  },
  correctText: {
    fontFamily: FONT_MONO,
    fontSize: sw(11),
    color: "#00ff9f",
    fontWeight: "bold",
  },
  breakdownRight: {
    fontFamily: FONT_MONO,
    fontSize: sw(13),
    color: "#8899aa",
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
    lineHeight: sw(20),
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
