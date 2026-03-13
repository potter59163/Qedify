import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { getPhoneFrameWindow } from "@/constants/device-frame";
import {
    Image,
    ImageStyle,
    Platform,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

// Design frame: 388 x 812
// Outer: paddingTop=60, paddingLeft=28, paddingBottom=40
// Illustration section (flex:1 in design): 413.812px
// Bottom panel: 298.188px
const { width: W, height: H } = getPhoneFrameWindow();
const sw = (n: number) => (n / 388) * W;
const sh = (n: number) => (n / 812) * H;

const WORLD_IMG = require("../assets/images/world.png");
const ROCKET_IMG = require("../assets/images/rocket.png");

// Bottom panel height + bottom padding (fixed portion)
const PANEL_DESIGN_H = 298.188 + 40;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Actual illustration section height at runtime
  const illustrationH = H - insets.top - insets.bottom - sh(PANEL_DESIGN_H);

  // Converts design-space y (relative to 413.812px illustration) to pixels
  const ip = (n: number) => (n / 413.812) * illustrationH;

  const pos = {
    worldTop: ip(108),
    worldLeft: sw(-16),
    glowTop: ip(161.91),
    levelUpTop: ip(101.91),
    rocketTop: ip(84),
    formulaTop: ip(287.91),
    xpTop: ip(315.91),
  };

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      <StatusBar style="light" />

      <View style={s.illustration}>
        <View style={[s.globeGlow, { top: pos.glowTop }]} />
        <Image
          source={WORLD_IMG}
          style={[s.worldImage, { top: pos.worldTop, left: pos.worldLeft }]}
          resizeMode="cover"
        />
        <View style={[s.levelUpBadge, { top: pos.levelUpTop }]}>
          <Text style={s.levelUpText}>⭐ LEVEL UP</Text>
        </View>
        <Image
          source={ROCKET_IMG}
          style={[s.rocketImage, { top: pos.rocketTop }]}
          resizeMode="contain"
        />
        <View style={[s.formulaWrap, { top: pos.formulaTop }]}>
          <Text style={s.formulaText}>p⃗ = mv</Text>
        </View>
        <View style={[s.xpBadge, { top: pos.xpTop }]}>
          <Text style={s.xpText}>+250 XP</Text>
        </View>
      </View>

      <View style={s.panel}>
        <Text style={s.missionLabel}>MISSION 01 OF 03</Text>
        <Text style={[s.title, { marginTop: sh(12) }]}>
          {"Physics becomes a "}
          <Text style={s.titleCyan}>Space Mission</Text>
        </Text>
        <Text style={[s.description, { marginTop: sh(12) }]}>
          Solve real momentum problems to rescue spacecraft and unlock the
          secrets of the universe.
        </Text>
        <View style={[s.dotsRow, { marginTop: sh(20) }]}>
          <View style={[s.dot, s.dotActive]} />
          <View style={[s.dot, s.dotInactive]} />
          <View style={[s.dot, s.dotInactive]} />
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.replace("/login" as any)}
          style={[s.nextOuter, { marginTop: sh(24) }]}
        >
          <LinearGradient
            colors={["#00c8ff", "#0d4eaa"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={s.nextBtn}
          >
            <Text style={s.nextBtnText}>NEXT →</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ marginTop: sh(12) }}
          onPress={() => router.replace("/login" as any)}
        >
          <Text style={s.footerText}>
            Already have an account? <Text style={s.footerLink}>LOG IN</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

type Styles = {
  container: ViewStyle;
  illustration: ViewStyle;
  worldImage: ImageStyle;
  globeGlow: ViewStyle;
  levelUpBadge: ViewStyle;
  levelUpText: TextStyle;
  rocketImage: ImageStyle;
  formulaWrap: ViewStyle;
  formulaText: TextStyle;
  xpBadge: ViewStyle;
  xpText: TextStyle;
  panel: ViewStyle;
  missionLabel: TextStyle;
  title: TextStyle;
  titleCyan: TextStyle;
  description: TextStyle;
  dotsRow: ViewStyle;
  dot: ViewStyle;
  dotActive: ViewStyle;
  dotInactive: ViewStyle;
  nextOuter: ViewStyle;
  nextBtn: ViewStyle;
  nextBtnText: TextStyle;
  footerText: TextStyle;
  footerLink: TextStyle;
};

const s = StyleSheet.create<Styles>({
  container: { flex: 1, backgroundColor: "#060d1e" },

  illustration: { flex: 1, overflow: "hidden" },

  worldImage: { position: "absolute", width: sw(419), height: sw(228) },

  globeGlow: {
    position: "absolute",
    left: sw(134),
    width: sw(120),
    height: sw(120),
    borderRadius: sw(60),
    backgroundColor: "#0a4a9e",
    shadowColor: "#00c8ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: sw(40),
    elevation: 6,
  },

  levelUpBadge: {
    position: "absolute",
    left: sw(64),
    height: sw(36),
    paddingHorizontal: sw(16),
    justifyContent: "center",
    backgroundColor: "rgba(0,200,255,0.1)",
    borderWidth: 1,
    borderColor: "#00c8ff",
    borderRadius: sw(12),
    shadowColor: "#00c8ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: sw(12),
    elevation: 8,
  },
  levelUpText: {
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontSize: sw(13),
    color: "#00c8ff",
  },

  rocketImage: {
    position: "absolute",
    left: sw(215),
    width: sw(74),
    height: sw(107),
  },

  formulaWrap: { position: "absolute", left: sw(84) },
  formulaText: {
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontSize: sw(12),
    color: "#00c8ff",
  },

  xpBadge: {
    position: "absolute",
    left: sw(251.78),
    paddingHorizontal: sw(13),
    paddingVertical: sw(7),
    backgroundColor: "rgba(0,255,213,0.08)",
    borderWidth: 1,
    borderColor: "#00ffd5",
    borderRadius: sw(10),
  },
  xpText: {
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontSize: sw(11),
    color: "#00ffd5",
  },

  panel: {
    paddingLeft: sw(28),
    paddingRight: sw(28),
    paddingBottom: sh(40),
  },

  missionLabel: {
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontSize: sw(11),
    color: "#00c8ff",
    letterSpacing: sw(3),
  },

  title: {
    fontSize: sw(26),
    fontWeight: "800",
    color: "#e8f4ff",
    lineHeight: sw(33.8),
  },
  titleCyan: { color: "#00c8ff" },

  description: {
    fontSize: sw(14),
    color: "#8899aa",
    lineHeight: sw(23.8),
  },

  dotsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { height: 8, borderRadius: 4 },
  dotActive: {
    width: 24,
    backgroundColor: "#00c8ff",
    shadowColor: "#00c8ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 4,
  },
  dotInactive: { width: 8, backgroundColor: "rgba(0,200,255,0.25)" },

  nextOuter: {
    borderRadius: sw(12),
    overflow: "hidden",
    shadowColor: "#00c8ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: sw(28),
    elevation: 10,
  },
  nextBtn: {
    height: sh(47),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: sw(12),
  },
  nextBtnText: {
    fontSize: sw(14),
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: sw(1),
  },

  footerText: { fontSize: sw(12), color: "#8899aa", textAlign: "center" },
  footerLink: { color: "#00c8ff" },
});
