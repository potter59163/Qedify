import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W } = Dimensions.get("window");
const sw = (n: number) => (n / 388) * W;

const FONT_MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

// Deterministic star field (trig-based, no random — stable across re-renders)
const STARS = Array.from({ length: 22 }, (_, i) => ({
  x: (Math.sin(i * 2.39) * 0.5 + 0.5) * (W - 10) + 5,
  y: (Math.cos(i * 1.61) * 0.5 + 0.5) * sw(290),
  size: i % 4 === 0 ? 3 : i % 4 === 1 ? 1.5 : i % 4 === 2 ? 2.5 : 2,
  delay: i * 190,
}));

function StarDot({
  x,
  y,
  size,
  delay,
}: {
  x: number;
  y: number;
  size: number;
  delay: number;
}) {
  const opacity = useSharedValue(0.12);
  useEffect(() => {
    const dur = 900 + ((delay * 7) % 700);
    opacity.value = withDelay(
      delay % 1600,
      withRepeat(
        withSequence(
          withTiming(0.88, { duration: dur }),
          withTiming(0.08, { duration: dur }),
        ),
        -1,
        false,
      ),
    );
  }, []);
  const aStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#e8f4ff",
        },
        aStyle,
      ]}
    />
  );
}

export default function OrbitalRescueScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // ── Game state ──────────────────────────────────────────────────
  const [force, setForce] = useState("4000");
  const [time, setTime] = useState("5");
  const [showError, setShowError] = useState(false);
  const forceNum = parseFloat(force) || 0;
  const timeNum = parseFloat(time) || 0;
  const impulse = Math.round(forceNum * timeNum);
  const impulseCorrect = impulse === 20000;

  // ── Animation shared values ────────────────────────────────────
  const rocketY = useSharedValue(0);
  const rocketX = useSharedValue(0);
  const thrusterOp = useSharedValue(0.5);
  const thrusterSy = useSharedValue(1);
  const asteroidLeft = useSharedValue(W * 0.72);
  const stationSc = useSharedValue(1);
  const stationGlowOp = useSharedValue(0.35);
  const velArrowOp = useSharedValue(0.7);

  useEffect(() => {
    // Rocket gentle float
    rocketY.value = withRepeat(
      withSequence(
        withTiming(-sw(9), {
          duration: 2100,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(sw(9), {
          duration: 2100,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      true,
    );
    rocketX.value = withRepeat(
      withSequence(
        withTiming(-sw(4), {
          duration: 3400,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(sw(4), {
          duration: 3400,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      true,
    );

    // Thruster exhaust flicker
    thrusterOp.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 320 }),
        withTiming(0.25, { duration: 280 }),
        withTiming(0.85, { duration: 240 }),
        withTiming(0.1, { duration: 500 }),
      ),
      -1,
      false,
    );
    thrusterSy.value = withRepeat(
      withSequence(
        withTiming(1.45, { duration: 320 }),
        withTiming(0.65, { duration: 280 }),
        withTiming(1.2, { duration: 240 }),
        withTiming(0.6, { duration: 500 }),
      ),
      -1,
      false,
    );

    // Asteroid sweeping left — loops back automatically with withRepeat
    asteroidLeft.value = withRepeat(
      withTiming(-sw(70), { duration: 10000, easing: Easing.linear }),
      -1,
      false,
    );

    // Target station pulse
    stationSc.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.88, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    stationGlowOp.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 700 }),
        withTiming(0.15, { duration: 700 }),
      ),
      -1,
      true,
    );

    // Velocity arrow flicker
    velArrowOp.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0.35, { duration: 400 }),
      ),
      -1,
      true,
    );
  }, []);

  const rocketFloatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: rocketY.value }, { translateX: rocketX.value }],
  }));
  const thrusterStyle = useAnimatedStyle(() => ({
    opacity: thrusterOp.value,
    transform: [{ scaleY: thrusterSy.value }],
  }));
  const asteroidStyle = useAnimatedStyle(() => ({
    left: asteroidLeft.value,
  }));
  const stationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: stationSc.value }],
  }));
  const stationGlowStyle = useAnimatedStyle(() => ({
    opacity: stationGlowOp.value,
  }));
  const velArrowStyle = useAnimatedStyle(() => ({
    opacity: velArrowOp.value,
  }));

  return (
    <View style={s.container}>
      <StatusBar style="light" />

      {/* ── Top Bar ── */}
      <View style={[s.topBar, { paddingTop: insets.top + sw(8) }]}>
        <View style={s.topBarLeft}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={s.backArrow}>{"\u2190"}</Text>
          </TouchableOpacity>
          <View>
            <Text style={s.missionTitle}>
              ORBITAL RESCUE {"\u00B7"} MISSION 3
            </Text>
            <Text style={s.missionSub}>
              Chapter 2 {"\u00B7"} Impulse & Forces
            </Text>
          </View>
        </View>
        <View style={s.topStats}>
          <View style={s.topStatItem}>
            <Text style={s.topStatLabel}>TIME</Text>
            <Text style={s.topStatVal}>01:24</Text>
          </View>
          <View style={s.topStatItem}>
            <Text style={s.topStatLabel}>FUEL</Text>
            <Text style={s.topStatVal}>68%</Text>
          </View>
          <View style={s.topStatItem}>
            <Text style={s.topStatLabel}>HEARTS</Text>
            <View style={s.heartsRow}>
              <Text style={s.heartFull}>{"\u2764\uFE0F"}</Text>
              <Text style={s.heartFull}>{"\u2764\uFE0F"}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: sw(30) }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Space Scene (Animated Canvas) ── */}
        <View style={s.spaceScene}>
          {/* Twinkling star field */}
          {STARS.map((star, i) => (
            <StarDot key={i} {...star} />
          ))}

          {/* Asteroid sweeping left with velocity label */}
          <Animated.View style={[s.asteroidWrap, asteroidStyle]}>
            <Animated.View style={[s.velArrowRow, velArrowStyle]}>
              <Text style={s.velArrowTxt}>{"← "}v = 7 m/s</Text>
            </Animated.View>
            <Text style={s.asteroidEmoji}>{"\u2604\uFE0F"}</Text>
          </Animated.View>

          {/* Target station — bottom-right, pulsing */}
          <Animated.View style={[s.stationWrap, stationStyle]}>
            <Animated.View style={[s.stationGlowRing, stationGlowStyle]} />
            <Text style={s.stationEmoji}>{"\uD83D\uDEF8"}</Text>
            <View style={s.targetTag}>
              <Text style={s.targetTagTxt}>TARGET</Text>
            </View>
          </Animated.View>

          {/* Rocket with float animation + thruster exhaust */}
          <Animated.View style={[s.rocketWrap, rocketFloatStyle]}>
            <View style={s.rocketEmojiWrap}>
              <Animated.View style={[s.thrusterBlob, thrusterStyle]} />
              <Text style={s.spaceEmoji}>{"\uD83D\uDE80"}</Text>
            </View>
            <View style={s.velocityLabel}>
              <Text style={s.velocityText}>v{"\u20D7"} = 5 m/s</Text>
            </View>
          </Animated.View>

          {/* Mission Brief Card — rendered last so it's always on top */}
          <View style={s.missionBrief}>
            <Text style={s.briefTitle}>MISSION BRIEF</Text>
            <Text style={s.briefLine}>Spacecraft mass: 2,000 kg</Text>
            <Text style={s.briefLine}>Current velocity: 5 m/s</Text>
            <Text style={s.briefLine}>Target {"\u0394"}p: ???</Text>
          </View>

          {/* Momentum display — on top */}
          <View style={s.momentumBox}>
            <Text style={s.momentumLabel}>p{"\u20D7"} CURRENT</Text>
            <Text style={s.momentumVal}>10,000</Text>
            <Text style={s.momentumUnit}>
              kg{"\u00B7"}m/s {"\u2192"}
            </Text>
          </View>
        </View>

        {/* ── Controls Panel ── */}
        <View style={s.controlPanel}>
          <Text style={s.controlDesc}>
            Apply impulse to change spacecraft velocity. Target the rescue
            coordinates to save the stranded crew.
          </Text>

          {/* Force × Time = Impulse */}
          <View style={s.equationRow}>
            <View style={s.eqField}>
              <Text style={s.eqLabel}>FORCE (N)</Text>
              <View style={[s.eqInput, { alignItems: "center" }]}>
                <TextInput
                  style={[s.eqValue, s.eqInputField]}
                  value={force}
                  onChangeText={setForce}
                  keyboardType="numeric"
                  keyboardAppearance="dark"
                  selectTextOnFocus
                  returnKeyType="done"
                  placeholderTextColor="#8899aa"
                />
                <Text style={s.eqUnit}>N</Text>
              </View>
            </View>
            <Text style={s.eqOp}>{"\u00D7"}</Text>
            <View style={s.eqField}>
              <Text style={s.eqLabel}>TIME (s)</Text>
              <View style={[s.eqInput, { alignItems: "center" }]}>
                <TextInput
                  style={[s.eqValue, s.eqInputField]}
                  value={time}
                  onChangeText={setTime}
                  keyboardType="numeric"
                  keyboardAppearance="dark"
                  selectTextOnFocus
                  returnKeyType="done"
                  placeholderTextColor="#8899aa"
                />
                <Text style={s.eqUnit}>s</Text>
              </View>
            </View>
            <Text style={s.eqOp}>=</Text>
            <View style={s.eqField}>
              <Text style={s.eqLabel}>IMPULSE</Text>
              <View style={[s.eqInput, s.eqInputResult]}>
                <Text
                  style={[
                    s.eqValue,
                    { color: impulseCorrect ? "#00ff9f" : "#ffa827" },
                  ]}
                >
                  {impulse > 0 ? impulse.toLocaleString() : "—"}
                </Text>
                <Text
                  style={[
                    s.eqUnit,
                    { color: impulseCorrect ? "#00ff9f" : "#ffa827" },
                  ]}
                >
                  N{"\u00B7"}s
                </Text>
              </View>
            </View>
          </View>

          {/* Hint + formula */}
          <View style={s.hintRow}>
            <View style={s.hintBtn}>
              <Text style={s.hintBtnText}>{"\uD83D\uDCA1"} HINT (2 left)</Text>
            </View>
            <Text style={s.hintFormula}>
              J = F{"\u0394"}t = {"\u0394"}p
            </Text>
          </View>

          {/* Fire button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (impulseCorrect) {
                router.push("/results");
              } else {
                setShowError(true);
              }
            }}
          >
            <LinearGradient
              colors={["#ffa827", "#e67e00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={s.fireBtn}
            >
              <Text style={s.fireBtnText}>FIRE THRUSTERS {"\uD83D\uDE80"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Try Again Modal ── */}
      <Modal visible={showError} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalIcon}>{"\u274C"}</Text>
            <Text style={s.modalTitle}>INCORRECT IMPULSE</Text>
            <Text style={s.modalBody}>
              {`Target: 20,000 N\u00B7s\nYour result: ${impulse.toLocaleString()} N\u00B7s\n\nAdjust FORCE \u00D7 TIME to reach the target.`}
            </Text>
            <TouchableOpacity
              style={s.modalBtn}
              activeOpacity={0.8}
              onPress={() => setShowError(false)}
            >
              <Text style={s.modalBtnText}>TRY AGAIN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

type Styles = {
  container: ViewStyle;
  topBar: ViewStyle;
  topBarLeft: ViewStyle;
  backArrow: TextStyle;
  missionTitle: TextStyle;
  missionSub: TextStyle;
  topStats: ViewStyle;
  topStatItem: ViewStyle;
  topStatLabel: TextStyle;
  topStatVal: TextStyle;
  heartsRow: ViewStyle;
  heartFull: TextStyle;
  spaceScene: ViewStyle;
  missionBrief: ViewStyle;
  briefTitle: TextStyle;
  briefLine: TextStyle;
  momentumBox: ViewStyle;
  momentumLabel: TextStyle;
  momentumVal: TextStyle;
  momentumUnit: TextStyle;
  // animated space scene elements
  asteroidWrap: ViewStyle;
  velArrowRow: ViewStyle;
  velArrowTxt: TextStyle;
  asteroidEmoji: TextStyle;
  stationWrap: ViewStyle;
  stationGlowRing: ViewStyle;
  stationEmoji: TextStyle;
  targetTag: ViewStyle;
  targetTagTxt: TextStyle;
  rocketWrap: ViewStyle;
  rocketEmojiWrap: ViewStyle;
  thrusterBlob: ViewStyle;
  spaceEmoji: TextStyle;
  velocityLabel: ViewStyle;
  velocityText: TextStyle;
  controlPanel: ViewStyle;
  controlDesc: TextStyle;
  equationRow: ViewStyle;
  eqField: ViewStyle;
  eqLabel: TextStyle;
  eqInput: ViewStyle;
  eqInputResult: ViewStyle;
  eqValue: TextStyle;
  eqUnit: TextStyle;
  eqOp: TextStyle;
  hintRow: ViewStyle;
  hintBtn: ViewStyle;
  hintBtnText: TextStyle;
  hintFormula: TextStyle;
  fireBtn: ViewStyle;
  fireBtnText: TextStyle;
  eqInputField: TextStyle;
  modalOverlay: ViewStyle;
  modalBox: ViewStyle;
  modalIcon: TextStyle;
  modalTitle: TextStyle;
  modalBody: TextStyle;
  modalBtn: ViewStyle;
  modalBtnText: TextStyle;
};

const s = StyleSheet.create<Styles>({
  container: { flex: 1, backgroundColor: "#060d1f" },

  /* Top Bar */
  topBar: {
    paddingHorizontal: sw(16),
    paddingBottom: sw(10),
    backgroundColor: "rgba(6,13,31,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,200,255,0.2)",
  },
  topBarLeft: { flexDirection: "row", alignItems: "center", gap: sw(10) },
  backArrow: { fontSize: sw(22), color: "#e8f4ff" },
  missionTitle: {
    fontFamily: FONT_MONO,
    fontSize: sw(11),
    color: "#00c8ff",
    letterSpacing: 1,
  },
  missionSub: { fontSize: sw(10), color: "#8899aa", marginTop: 1 },
  topStats: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: sw(16),
    marginTop: sw(8),
  },
  topStatItem: { alignItems: "center" },
  topStatLabel: {
    fontFamily: FONT_MONO,
    fontSize: sw(9),
    color: "#8899aa",
    letterSpacing: 1,
  },
  topStatVal: {
    fontFamily: FONT_MONO,
    fontSize: sw(14),
    color: "#e8f4ff",
    fontWeight: "bold",
  },
  heartsRow: { flexDirection: "row", gap: 2 },
  heartFull: { fontSize: sw(12) },

  /* Space Scene */
  spaceScene: {
    height: sw(320),
    backgroundColor: "rgba(0,200,255,0.03)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,200,255,0.1)",
    position: "relative",
    overflow: "hidden",
  },
  missionBrief: {
    position: "absolute",
    top: sw(16),
    left: sw(16),
    backgroundColor: "rgba(0,200,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.2)",
    borderRadius: sw(10),
    padding: sw(12),
    width: sw(160),
  },
  briefTitle: {
    fontFamily: FONT_MONO,
    fontSize: sw(9),
    color: "#00c8ff",
    letterSpacing: 1,
    marginBottom: sw(6),
  },
  briefLine: {
    fontFamily: FONT_MONO,
    fontSize: sw(11),
    color: "#e8f4ff",
    lineHeight: sw(18),
  },
  momentumBox: {
    position: "absolute",
    top: sw(16),
    right: sw(16),
    backgroundColor: "rgba(0,200,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.2)",
    borderRadius: sw(10),
    padding: sw(12),
  },
  momentumLabel: {
    fontFamily: FONT_MONO,
    fontSize: sw(9),
    color: "#00c8ff",
    letterSpacing: 1,
  },
  momentumVal: {
    fontFamily: FONT_MONO,
    fontSize: sw(18),
    color: "#e8f4ff",
    fontWeight: "bold",
  },
  momentumUnit: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#8899aa",
  },
  spaceEmoji: { fontSize: sw(46), zIndex: 2 },
  velocityLabel: {
    marginTop: sw(4),
    backgroundColor: "rgba(0,200,255,0.15)",
    paddingHorizontal: sw(8),
    paddingVertical: sw(3),
    borderRadius: sw(6),
  },
  velocityText: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#e8f4ff",
  },
  // ── Animated space scene styles ──────────────────────────────
  asteroidWrap: {
    position: "absolute",
    top: sw(90),
    alignItems: "center",
  },
  velArrowRow: {
    marginBottom: sw(2),
  },
  velArrowTxt: {
    fontFamily: FONT_MONO,
    fontSize: sw(9),
    color: "#ffa827",
    letterSpacing: 0.5,
  },
  asteroidEmoji: { fontSize: sw(26) },
  stationWrap: {
    position: "absolute",
    right: sw(22),
    bottom: sw(48),
    alignItems: "center",
  },
  stationGlowRing: {
    position: "absolute",
    width: sw(52),
    height: sw(52),
    borderRadius: sw(26),
    borderWidth: 1.5,
    borderColor: "#00c8ff",
    backgroundColor: "rgba(0,200,255,0.08)",
  },
  stationEmoji: { fontSize: sw(30) },
  targetTag: {
    marginTop: sw(36),
    backgroundColor: "rgba(0,200,255,0.15)",
    paddingHorizontal: sw(6),
    paddingVertical: sw(2),
    borderRadius: sw(4),
  },
  targetTagTxt: {
    fontFamily: FONT_MONO,
    fontSize: sw(8),
    color: "#00c8ff",
    letterSpacing: 1,
  },
  rocketWrap: {
    position: "absolute",
    top: sw(138),
    left: 0,
    right: 0,
    alignItems: "center",
  },
  rocketEmojiWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: sw(54),
    height: sw(58),
  },
  thrusterBlob: {
    position: "absolute",
    bottom: sw(1),
    width: sw(14),
    height: sw(26),
    borderRadius: sw(7),
    backgroundColor: "#ffa827",
    shadowColor: "#ffa827",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 10,
  },

  /* Controls */
  controlPanel: {
    paddingHorizontal: sw(16),
    paddingTop: sw(16),
  },
  controlDesc: {
    fontSize: sw(13),
    color: "#8899aa",
    lineHeight: sw(20),
    marginBottom: sw(14),
  },
  equationRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: sw(6),
    marginBottom: sw(16),
  },
  eqField: { flex: 1 },
  eqLabel: {
    fontFamily: FONT_MONO,
    fontSize: sw(8),
    color: "#8899aa",
    letterSpacing: 1,
    marginBottom: sw(4),
  },
  eqInput: {
    backgroundColor: "rgba(0,200,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.2)",
    borderRadius: sw(8),
    paddingVertical: sw(10),
    paddingHorizontal: sw(10),
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  eqInputResult: {
    borderColor: "rgba(0,255,159,0.3)",
    backgroundColor: "rgba(0,255,159,0.06)",
  },
  eqValue: {
    fontFamily: FONT_MONO,
    fontSize: sw(14),
    color: "#e8f4ff",
    fontWeight: "bold",
  },
  eqUnit: {
    fontFamily: FONT_MONO,
    fontSize: sw(9),
    color: "#8899aa",
  },
  eqOp: {
    fontFamily: FONT_MONO,
    fontSize: sw(16),
    color: "#8899aa",
    marginBottom: sw(10),
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: sw(12),
    marginBottom: sw(16),
  },
  hintBtn: {
    backgroundColor: "rgba(255,168,39,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,168,39,0.3)",
    borderRadius: sw(8),
    paddingVertical: sw(8),
    paddingHorizontal: sw(14),
  },
  hintBtnText: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#ffa827",
    letterSpacing: 1,
  },
  hintFormula: {
    fontFamily: FONT_MONO,
    fontSize: sw(13),
    color: "#e8f4ff",
  },
  fireBtn: {
    borderRadius: sw(14),
    height: sw(47),
    alignItems: "center",
    justifyContent: "center",
  },
  fireBtnText: {
    fontFamily: FONT_MONO,
    fontSize: sw(14),
    color: "#e8f4ff",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  eqInputField: { flex: 1, padding: 0, margin: 0 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: sw(36),
  },
  modalBox: {
    backgroundColor: "#0d1b2e",
    borderWidth: 1,
    borderColor: "rgba(255,168,39,0.45)",
    borderRadius: sw(18),
    padding: sw(24),
    alignItems: "center",
    width: "100%",
  },
  modalIcon: { fontSize: sw(36), marginBottom: sw(8) },
  modalTitle: {
    fontFamily: FONT_MONO,
    fontSize: sw(14),
    color: "#ffa827",
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: sw(12),
  },
  modalBody: {
    fontFamily: FONT_MONO,
    fontSize: sw(13),
    color: "#e8f4ff",
    textAlign: "center",
    lineHeight: sw(22),
    marginBottom: sw(20),
  },
  modalBtn: {
    backgroundColor: "rgba(255,168,39,0.15)",
    borderWidth: 1,
    borderColor: "#ffa827",
    borderRadius: sw(10),
    paddingVertical: sw(11),
    paddingHorizontal: sw(32),
  },
  modalBtnText: {
    fontFamily: FONT_MONO,
    fontSize: sw(13),
    color: "#ffa827",
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
