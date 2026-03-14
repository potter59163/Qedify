import { useCountdown } from "@/hooks/use-countdown";
import { getPhoneFrameWindow } from "@/constants/device-frame";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
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
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W } = getPhoneFrameWindow();
const sw = (n: number) => (n / 388) * W;

const FONT_MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

// Deterministic star field (trig-based, no random — stable across re-renders)
const STARS = Array.from({ length: 22 }, (_, i) => ({
  x: (Math.sin(i * 2.39) * 0.5 + 0.5) * (W - 10) + 5,
  y: (Math.cos(i * 1.61) * 0.5 + 0.5) * sw(290),
  size: i % 4 === 0 ? 3 : i % 4 === 1 ? 1.5 : i % 4 === 2 ? 2.5 : 2,
  delay: i * 190,
}));

// ── Learning Engine: Progressive Hints (3 levels, most vague → most specific) ──
const HINTS = [
  "HINT 1/3  Concept recall\n\nImpulse is the product of force and time.\n\nJ = F \u00D7 \u0394t\n\nYour goal: find F and t so their product = 20,000 N\u00B7s.",
  "HINT 2/3  Work backwards\n\nRearrange for time: \u0394t = J \u00F7 F\n\nExample: if F = 5,000 N\nthen \u0394t = 20,000 \u00F7 5,000 = 4 s\n\nMany valid (F, t) pairs exist!",
  "HINT 3/3  Guided answer\n\nOne valid solution:\n  F = 4,000 N, t = 5 s\n  4,000 \u00D7 5 = 20,000 N\u00B7s \u2713\n\nOther solutions also accepted.\nTry to find your own combination!",
];

// ── Misconception Detection by Learning Outcome ──
function getMisconceptionFeedback(
  impulse: number,
  fN: number,
  tN: number,
  attempts: number,
): { title: string; body: string } {
  // LO1: Both inputs must be non-zero
  if (fN === 0 && tN === 0) {
    return {
      title: "MISSING INPUTS",
      body: "Both Force (N) and Time (s) must be non-zero.\n\n\uD83D\uDD2C LO: Impulse requires an applied force over a duration.\n\nJ = F \u00D7 \u0394t \u2192 both variables matter!",
    };
  }
  if (fN === 0) {
    return {
      title: "FORCE IS ZERO",
      body: "A spacecraft needs thrust to change its momentum.\n\n\uD83D\uDD2C LO: Without force, no impulse is generated.\n\nJ = F \u00D7 \u0394t \u2192 F cannot be 0.",
    };
  }
  if (tN === 0) {
    return {
      title: "TIME IS ZERO",
      body: "Force must act over a time interval to create impulse.\n\n\uD83D\uDD2C LO: Instantaneous force produces zero impulse.\n\nJ = F \u00D7 \u0394t \u2192 \u0394t cannot be 0.",
    };
  }

  // LO2: Addition misconception (confusing J=F+t with J=F×t)
  const addResult = Math.round(fN + tN);
  if (Math.abs(impulse - addResult) < 5 && impulse !== Math.round(fN * tN)) {
    return {
      title: "ADDITION MISTAKE",
      body: `You added F + t = ${addResult.toLocaleString()} instead of multiplying!\n\n\uD83D\uDD2C Misconception: Impulse uses MULTIPLICATION.\n\nJ = F \u00D7 \u0394t (not F + \u0394t)\n${fN.toLocaleString()} \u00D7 ${tN.toLocaleString()} = ${Math.round(fN * tN).toLocaleString()} N\u00B7s`,
    };
  }

  // LO3: Confusing current momentum (p=mv) with target impulse
  const currentMomentum = 2000 * 5;
  if (Math.abs(impulse - currentMomentum) < 200) {
    return {
      title: "MOMENTUM \u2260 TARGET IMPULSE",
      body: `You calculated p = m\u00D7v = ${currentMomentum.toLocaleString()} kg\u00B7m/s\n(current spacecraft momentum)\n\n\uD83D\uDD2C Misconception: The mission needs an ADDITIONAL impulse of 20,000 N\u00B7s.\n\nJ = \u0394p = target change, not current p.`,
    };
  }

  // Close but not exact (within 15%)
  const diff = 20000 - impulse;
  if (Math.abs(diff) < 3000) {
    const direction = diff > 0 ? "increase" : "decrease";
    return {
      title: "ALMOST THERE!",
      body: `Your impulse: ${impulse.toLocaleString()} N\u00B7s\nTarget: 20,000 N\u00B7s\nOff by: ${Math.abs(diff).toLocaleString()} N\u00B7s\n\nTry to ${direction} F or t slightly.\nJ = F \u00D7 \u0394t must equal exactly 20,000.`,
    };
  }

  // After multiple attempts: offer more guidance
  if (attempts >= 2) {
    return {
      title: "STILL INCORRECT",
      body: `Target: 20,000 N\u00B7s\nYours: ${impulse.toLocaleString()} N\u00B7s\n\n\uD83D\uDCA1 Use the HINT button for step-by-step guidance.\n\nJ = F \u00D7 \u0394t\nEx: 4,000 N \u00D7 5 s = 20,000 N\u00B7s`,
    };
  }

  return {
    title: "INCORRECT IMPULSE",
    body: `Target: 20,000 N\u00B7s\nYours: ${impulse.toLocaleString()} N\u00B7s\n\nAdjust Force \u00D7 Time until the result equals 20,000 N\u00B7s.\n\nFormula: J = F \u00D7 \u0394t`,
  };
}

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
  const [force, setForce] = useState("");
  const [time, setTime] = useState("");
  const [showError, setShowError] = useState(false);
  const [hearts, setHearts] = useState(3);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isCrashing, setIsCrashing] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);

  // ── Learning scaffolding state ───────────────────────────────
  const [attempts, setAttempts] = useState(0);          // wrong submissions
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [hintLevel, setHintLevel] = useState(0);        // 0 = none revealed
  const [showHintModal, setShowHintModal] = useState(false);

  const { seconds, formatted: timerDisplay } = useCountdown(180, () =>
    setShowGameOver(true),
  );
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
  const fireBtnScale = useSharedValue(1);
  const resultShakeX = useSharedValue(0);
  const heartShakeX = useSharedValue(0);
  const crashFlyX = useSharedValue(0);
  const crashFlyY = useSharedValue(0);
  const explosionSc = useSharedValue(0.1);
  const explosionOp = useSharedValue(0);
  const scaffoldSlideY = useSharedValue(sw(20));
  const scaffoldOp = useSharedValue(0);
  const timerScale = useSharedValue(1);

  useEffect(() => {
    rocketY.value = withRepeat(
      withSequence(
        withTiming(-sw(9), { duration: 2100, easing: Easing.inOut(Easing.sin) }),
        withTiming(sw(9), { duration: 2100, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true,
    );
    rocketX.value = withRepeat(
      withSequence(
        withTiming(-sw(4), { duration: 3400, easing: Easing.inOut(Easing.sin) }),
        withTiming(sw(4), { duration: 3400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true,
    );
    thrusterOp.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 320 }),
        withTiming(0.25, { duration: 280 }),
        withTiming(0.85, { duration: 240 }),
        withTiming(0.1, { duration: 500 }),
      ),
      -1, false,
    );
    thrusterSy.value = withRepeat(
      withSequence(
        withTiming(1.45, { duration: 320 }),
        withTiming(0.65, { duration: 280 }),
        withTiming(1.2, { duration: 240 }),
        withTiming(0.6, { duration: 500 }),
      ),
      -1, false,
    );
    asteroidLeft.value = withRepeat(
      withTiming(-sw(70), { duration: 10000, easing: Easing.linear }),
      -1, false,
    );
    stationSc.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.88, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true,
    );
    stationGlowOp.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 700 }),
        withTiming(0.15, { duration: 700 }),
      ),
      -1, true,
    );
    velArrowOp.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0.35, { duration: 400 }),
      ),
      -1, true,
    );
  }, []);

  // Scaffold card entrance animation (slide up + fade in when it first appears)
  useEffect(() => {
    if (attempts === 1) {
      scaffoldSlideY.value = sw(20);
      scaffoldOp.value = 0;
      scaffoldSlideY.value = withSpring(0, { damping: 14, stiffness: 120 });
      scaffoldOp.value = withTiming(1, { duration: 350 });
    }
  }, [attempts]);

  // Timer low-time pulse (starts at 29 s remaining)
  useEffect(() => {
    if (seconds === 29) {
      timerScale.value = withRepeat(
        withSequence(
          withTiming(1.22, { duration: 270, easing: Easing.out(Easing.sin) }),
          withTiming(1, { duration: 270, easing: Easing.in(Easing.sin) }),
        ),
        -1,
        true,
      );
    }
  }, [seconds]);

  const triggerHeartShake = () => {
    heartShakeX.value = withSequence(
      withTiming(7, { duration: 45 }),
      withTiming(-7, { duration: 45 }),
      withTiming(6, { duration: 45 }),
      withTiming(-6, { duration: 45 }),
      withTiming(0, { duration: 45 }),
    );
  };

  const triggerCrash = () => {
    setIsCrashing(true);
    cancelAnimation(rocketY);
    cancelAnimation(rocketX);
    // Rocket flies toward asteroid (upper-right)
    crashFlyX.value = withTiming(W * 0.5, {
      duration: 500,
      easing: Easing.in(Easing.quad),
    });
    crashFlyY.value = withTiming(-sw(90), {
      duration: 500,
      easing: Easing.in(Easing.quad),
    });
    setTimeout(() => {
      setShowExplosion(true);
      explosionSc.value = withSpring(1.7, { damping: 5, stiffness: 160 });
      explosionOp.value = withSequence(
        withTiming(1, { duration: 80 }),
        withDelay(950, withTiming(0, { duration: 500 })),
      );
    }, 520);
    setTimeout(() => {
      setShowGameOver(true);
    }, 1900);
  };

  const rocketFloatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: rocketY.value + crashFlyY.value },
      { translateX: rocketX.value + crashFlyX.value },
    ],
  }));
  const thrusterStyle = useAnimatedStyle(() => ({
    opacity: thrusterOp.value,
    transform: [{ scaleY: thrusterSy.value }],
  }));
  const asteroidStyle = useAnimatedStyle(() => ({ left: asteroidLeft.value }));
  const stationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: stationSc.value }],
  }));
  const stationGlowStyle = useAnimatedStyle(() => ({ opacity: stationGlowOp.value }));
  const velArrowStyle = useAnimatedStyle(() => ({ opacity: velArrowOp.value }));
  const fireBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireBtnScale.value }],
  }));
  const resultShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: resultShakeX.value }],
  }));
  const heartShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: heartShakeX.value }],
  }));
  const explosionStyle = useAnimatedStyle(() => ({
    opacity: explosionOp.value,
    transform: [{ scale: explosionSc.value }],
  }));
  const scaffoldEntranceStyle = useAnimatedStyle(() => ({
    opacity: scaffoldOp.value,
    transform: [{ translateY: scaffoldSlideY.value }],
  }));
  const timerDisplayStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerScale.value }],
  }));

  // Pre-compute misconception feedback so modal JSX stays clean
  const errorFeedback = getMisconceptionFeedback(impulse, forceNum, timeNum, Math.max(0, attempts - 1));

  // Compute stars for results screen (3=perfect, 2=used hints/≤2 wrong, 1=struggled)
  const computeStars = () => {
    if (attempts === 0 && hintsRemaining === 3) return 3;
    if (attempts <= 1 || hintsRemaining >= 1) return 2;
    return 1;
  };

  const handleHintPress = () => {
    if (hintsRemaining <= 0) return;
    const nextLevel = hintLevel + 1;
    setHintLevel(nextLevel);
    setHintsRemaining((prev) => prev - 1);
    setShowHintModal(true);
  };

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
            <Animated.Text
              style={[
                s.topStatVal,
                timerDisplayStyle,
                seconds > 0 && seconds <= 29 ? { color: "#ff5555" } : {},
              ]}
            >
              {timerDisplay}
            </Animated.Text>
          </View>
          <View style={s.topStatItem}>
            <Text style={s.topStatLabel}>FUEL</Text>
            <Text style={s.topStatVal}>68%</Text>
          </View>
          <View style={s.topStatItem}>
            <Text style={s.topStatLabel}>HEARTS</Text>
            <Animated.View style={[s.heartsRow, heartShakeStyle]}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Text
                  key={i}
                  style={[s.heartFull, i >= hearts && { opacity: 0.2 }]}
                >
                  {"❤️"}
                </Text>
              ))}
            </Animated.View>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: sw(30) }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Space Scene (Animated Canvas) ── */}
        <View style={s.spaceScene}>
          {STARS.map((star, i) => (
            <StarDot key={i} {...star} />
          ))}

          <Animated.View style={[s.asteroidWrap, asteroidStyle]}>
            <Animated.View style={[s.velArrowRow, velArrowStyle]}>
              <Text style={s.velArrowTxt}>{"← "}v = 7 m/s</Text>
            </Animated.View>
            <Text style={s.asteroidEmoji}>{"\u2604\uFE0F"}</Text>
          </Animated.View>

          <Animated.View style={[s.stationWrap, stationStyle]}>
            <Animated.View style={[s.stationGlowRing, stationGlowStyle]} />
            <Text style={s.stationEmoji}>{"\uD83D\uDEF8"}</Text>
            <View style={s.targetTag}>
              <Text style={s.targetTagTxt}>TARGET</Text>
            </View>
          </Animated.View>

          <Animated.View style={[s.rocketWrap, rocketFloatStyle]}>
            <View style={s.rocketEmojiWrap}>
              <Animated.View style={[s.thrusterBlob, thrusterStyle]} />
              <Text style={s.spaceEmoji}>{"\uD83D\uDE80"}</Text>
            </View>
            <View style={s.velocityLabel}>
              <Text style={s.velocityText}>v{"\u20D7"} = 5 m/s</Text>
            </View>
          </Animated.View>

          <View style={s.missionBrief}>
            <Text style={s.briefTitle}>MISSION BRIEF</Text>
            <Text style={s.briefLine}>Spacecraft mass: 2,000 kg</Text>
            <Text style={s.briefLine}>Current velocity: 5 m/s</Text>
            <Text style={s.briefLine}>Target J: 20,000 N{"\u00B7"}s</Text>
          </View>

          <View style={s.momentumBox}>
            <Text style={s.momentumLabel}>p{"\u20D7"} CURRENT</Text>
            <Text style={s.momentumVal}>10,000</Text>
            <Text style={s.momentumUnit}>
              kg{"\u00B7"}m/s {"\u2192"}
            </Text>
          </View>

          {showExplosion && (
            <Animated.View style={[s.explosionOverlay, explosionStyle]}>
              <Text style={s.explosionEmoji}>{"💥"}</Text>
              <Text style={s.explosionText}>CRASH!</Text>
            </Animated.View>
          )}
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
                  placeholder="0"
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
                  placeholder="0"
                  placeholderTextColor="#8899aa"
                />
                <Text style={s.eqUnit}>s</Text>
              </View>
            </View>
            <Text style={s.eqOp}>=</Text>
            <View style={s.eqField}>
              <Text style={s.eqLabel}>IMPULSE</Text>
              <Animated.View
                style={[s.eqInput, s.eqInputResult, resultShakeStyle]}
              >
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
              </Animated.View>
            </View>
          </View>

          {/* Hint button (functional) + formula */}
          <View style={s.hintRow}>
            <TouchableOpacity
              style={[s.hintBtn, hintsRemaining === 0 && s.hintBtnDisabled]}
              activeOpacity={hintsRemaining > 0 ? 0.7 : 1}
              onPress={handleHintPress}
            >
              <Text style={[s.hintBtnText, hintsRemaining === 0 && s.hintBtnTextDisabled]}>
                {"\uD83D\uDCA1"} HINT ({hintsRemaining} left)
              </Text>
            </TouchableOpacity>
            <Text style={s.hintFormula}>
              J = F{"\u0394"}t = {"\u0394"}p
            </Text>
          </View>

          {/* ── Scaffolding Card (appears after first wrong attempt) ── */}
          {attempts >= 1 && (
            <Animated.View style={[s.scaffoldCard, scaffoldEntranceStyle]}>
              <Text style={s.scaffoldTitle}>
                {"\uD83D\uDCCB"} STEP-BY-STEP SCAFFOLD
              </Text>
              <Text style={s.scaffoldStep}>
                1{"\u25B8"} Identify target: J = 20,000 N{"\u00B7"}s
              </Text>
              <Text style={s.scaffoldStep}>
                2{"\u25B8"} Formula: J = F {"\u00D7"} {"\u0394"}t
              </Text>
              <Text style={s.scaffoldStep}>
                3{"\u25B8"} Choose any F, then solve: {"\u0394"}t = J {"\u00F7"} F
              </Text>
              <Text style={s.scaffoldStep}>
                4{"\u25B8"} Check: F {"\u00D7"} {"\u0394"}t = 20,000?
              </Text>
              {attempts >= 2 && (
                <Text style={[s.scaffoldStep, s.scaffoldExample]}>
                  {"\uD83D\uDD0D"} Example: 4,000 N {"\u00D7"} 5 s = 20,000 N
                  {"\u00B7"}s {"\u2713"}
                </Text>
              )}
            </Animated.View>
          )}

          {/* Fire button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (isCrashing) return;
              fireBtnScale.value = withSequence(
                withSpring(0.93, { damping: 12, stiffness: 300 }),
                withSpring(1, { damping: 8, stiffness: 200 }),
              );
              if (impulseCorrect) {
                const stars = computeStars();
                const xp = stars === 3 ? 320 : stars === 2 ? 220 : 120;
                const hintsUsed = 3 - hintsRemaining;
                const accuracy =
                  attempts === 0
                    ? 100
                    : Math.max(40, Math.round(100 - attempts * 15));
                router.push({
                  pathname: "/results",
                  params: {
                    missionId: "orbital-rescue",
                    missionName: "Orbital Rescue",
                    chapter: "Chapter 2",
                    stars: String(stars),
                    xp: String(xp),
                    accuracy: String(accuracy),
                    attempts: String(attempts),
                    hintsUsed: String(hintsUsed),
                    maxHints: "3",
                    lo1: attempts === 0 ? "mastered" : attempts <= 1 ? "partial" : "review",
                    lo2: impulseCorrect ? "mastered" : "review",
                    lo3: hintsUsed === 0 ? "mastered" : "partial",
                  },
                });
              } else {
                resultShakeX.value = withSequence(
                  withTiming(7, { duration: 55 }),
                  withTiming(-7, { duration: 55 }),
                  withTiming(7, { duration: 55 }),
                  withTiming(-7, { duration: 55 }),
                  withTiming(0, { duration: 55 }),
                );
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                const newHearts = hearts - 1;
                setHearts(newHearts);
                if (newHearts <= 0) {
                  triggerCrash();
                } else {
                  triggerHeartShake();
                  setShowError(true);
                }
              }
            }}
          >
            <Animated.View style={fireBtnStyle}>
              <LinearGradient
                colors={["#ffa827", "#e67e00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={s.fireBtn}
              >
                <Text style={s.fireBtnText}>
                  FIRE THRUSTERS {"\uD83D\uDE80"}
                </Text>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Try Again Modal (Misconception-targeted feedback) ── */}
      <Modal visible={showError} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalIcon}>{"\u274C"}</Text>
            <Text style={s.modalTitle}>{errorFeedback.title}</Text>
            <Text style={s.modalBody}>{errorFeedback.body}</Text>
            <Text style={s.modalHearts}>
              Hearts remaining: {hearts} {hearts > 0 ? "❤️" : "💔"}
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

      {/* ── Hint Modal (Progressive hints 1→2→3) ── */}
      <Modal visible={showHintModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, s.hintModalBox]}>
            <Text style={s.hintModalIcon}>{"\uD83D\uDCA1"}</Text>
            <Text style={s.hintModalTitle}>SCAFFOLDING HINT</Text>
            <Text style={s.hintModalBody}>
              {hintLevel > 0 ? HINTS[hintLevel - 1] : ""}
            </Text>
            <TouchableOpacity
              style={[s.modalBtn, s.hintModalBtn]}
              activeOpacity={0.8}
              onPress={() => setShowHintModal(false)}
            >
              <Text style={[s.modalBtnText, { color: "#00c8ff" }]}>
                GOT IT {"\u2192"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Game Over Modal ── */}
      <Modal visible={showGameOver} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalIcon}>{"\uD83D\uDC94"}</Text>
            <Text style={s.modalTitle}>MISSION FAILED</Text>
            <Text style={s.modalBody}>
              {hearts <= 0
                ? "You ran out of hearts!\n\nKey formula to review:\nJ = F \u00D7 \u0394t\n\nTarget was 20,000 N\u00B7s.\nTry: F=4,000 N, t=5 s"
                : "Time's up! The crew couldn't be rescued.\n\nRemember:\nJ = F \u00D7 \u0394t = 20,000 N\u00B7s\n\nPractice in Tutorial before retrying."}
            </Text>
            <TouchableOpacity
              style={s.modalBtn}
              activeOpacity={0.8}
              onPress={() => router.replace("/(tabs)")}
            >
              <Text style={s.modalBtnText}>RETURN TO BASE</Text>
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
  hintBtnDisabled: ViewStyle;
  hintBtnText: TextStyle;
  hintBtnTextDisabled: TextStyle;
  hintFormula: TextStyle;
  scaffoldCard: ViewStyle;
  scaffoldTitle: TextStyle;
  scaffoldStep: TextStyle;
  scaffoldExample: TextStyle;
  fireBtn: ViewStyle;
  fireBtnText: TextStyle;
  eqInputField: TextStyle;
  modalOverlay: ViewStyle;
  modalBox: ViewStyle;
  modalIcon: TextStyle;
  modalTitle: TextStyle;
  modalBody: TextStyle;
  modalHearts: TextStyle;
  modalBtn: ViewStyle;
  modalBtnText: TextStyle;
  hintModalBox: ViewStyle;
  hintModalIcon: TextStyle;
  hintModalTitle: TextStyle;
  hintModalBody: TextStyle;
  hintModalBtn: ViewStyle;
  explosionOverlay: ViewStyle;
  explosionEmoji: TextStyle;
  explosionText: TextStyle;
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
  asteroidWrap: {
    position: "absolute",
    top: sw(90),
    alignItems: "center",
  },
  velArrowRow: { marginBottom: sw(2) },
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
  hintBtnDisabled: {
    backgroundColor: "rgba(136,153,170,0.08)",
    borderColor: "rgba(136,153,170,0.2)",
  },
  hintBtnText: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#ffa827",
    letterSpacing: 1,
  },
  hintBtnTextDisabled: {
    color: "#556677",
  },
  hintFormula: {
    fontFamily: FONT_MONO,
    fontSize: sw(13),
    color: "#e8f4ff",
  },

  /* Scaffolding Card */
  scaffoldCard: {
    backgroundColor: "rgba(91,69,224,0.08)",
    borderWidth: 1,
    borderColor: "rgba(91,69,224,0.25)",
    borderRadius: sw(10),
    padding: sw(14),
    marginBottom: sw(16),
  },
  scaffoldTitle: {
    fontFamily: FONT_MONO,
    fontSize: sw(9),
    color: "#a78bfa",
    letterSpacing: 1,
    marginBottom: sw(8),
  },
  scaffoldStep: {
    fontFamily: FONT_MONO,
    fontSize: sw(12),
    color: "#c4b5fd",
    lineHeight: sw(20),
  },
  scaffoldExample: {
    color: "#00ff9f",
    marginTop: sw(4),
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

  /* Modals */
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
    fontSize: sw(12),
    color: "#e8f4ff",
    textAlign: "center",
    lineHeight: sw(20),
    marginBottom: sw(8),
  },
  modalHearts: {
    fontFamily: FONT_MONO,
    fontSize: sw(11),
    color: "#8899aa",
    marginBottom: sw(16),
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

  /* Explosion overlay */
  explosionOverlay: {
    position: "absolute",
    top: sw(45),
    right: sw(20),
    alignItems: "center",
    zIndex: 20,
  },
  explosionEmoji: { fontSize: sw(70) },
  explosionText: {
    fontFamily: FONT_MONO,
    fontSize: sw(18),
    color: "#ff5555",
    fontWeight: "bold",
    letterSpacing: 2,
    marginTop: sw(4),
  },

  /* Hint Modal */
  hintModalBox: {
    borderColor: "rgba(0,200,255,0.4)",
  },
  hintModalIcon: { fontSize: sw(32), marginBottom: sw(6) },
  hintModalTitle: {
    fontFamily: FONT_MONO,
    fontSize: sw(11),
    color: "#00c8ff",
    letterSpacing: 2,
    marginBottom: sw(14),
  },
  hintModalBody: {
    fontFamily: FONT_MONO,
    fontSize: sw(12),
    color: "#e8f4ff",
    textAlign: "left",
    lineHeight: sw(21),
    marginBottom: sw(20),
    width: "100%",
  },
  hintModalBtn: {
    backgroundColor: "rgba(0,200,255,0.12)",
    borderColor: "rgba(0,200,255,0.4)",
  },
});
