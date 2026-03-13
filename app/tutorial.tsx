import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { getPhoneFrameWindow } from "@/constants/device-frame";
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
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W } = getPhoneFrameWindow();
const sw = (n: number) => (n / 388) * W;

const FONT_MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

// Slider config
const SLIDER_TRACK_W = sw(186);
const THUMB_SIZE = sw(16);
const MASS_MIN = 100;
const MASS_MAX = 1000;
const VEL_MIN = 1;
const VEL_MAX = 20;

function clamp(val: number, min: number, max: number) {
  "worklet";
  return Math.min(Math.max(val, min), max);
}

function InteractiveSlider({
  label,
  unit,
  color,
  min,
  max,
  initial,
  onValueChange,
}: {
  label: string;
  unit: string;
  color: string;
  min: number;
  max: number;
  initial: number;
  onValueChange: (v: number) => void;
}) {
  const initFrac = (initial - min) / (max - min);
  const offsetX = useSharedValue(initFrac * SLIDER_TRACK_W);
  const startX = useSharedValue(initFrac * SLIDER_TRACK_W);
  const [displayVal, setDisplayVal] = useState(initial);

  const updateVal = useCallback(
    (px: number) => {
      const frac = px / SLIDER_TRACK_W;
      const raw = min + frac * (max - min);
      const rounded = Math.round(raw);
      setDisplayVal(rounded);
      onValueChange(rounded);
    },
    [min, max, onValueChange],
  );

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = offsetX.value;
    })
    .onUpdate((e) => {
      const next = clamp(startX.value + e.translationX, 0, SLIDER_TRACK_W);
      offsetX.value = next;
      runOnJS(updateVal)(next);
    })
    .hitSlop({ top: 20, bottom: 20, left: 10, right: 10 });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value - THUMB_SIZE / 2 }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: offsetX.value,
  }));

  return (
    <View style={s.sliderRow}>
      <Text style={[s.sliderLabel, { color }]}>{label}</Text>
      <View style={s.sliderTrackOuter}>
        <View style={s.sliderTrackBg}>
          <Animated.View
            style={[s.sliderFill, { backgroundColor: color }, fillStyle]}
          />
          <GestureDetector gesture={pan}>
            <Animated.View
              style={[
                s.sliderThumb,
                { backgroundColor: color, borderColor: color },
                thumbStyle,
              ]}
            />
          </GestureDetector>
        </View>
      </View>
      <Text style={[s.sliderValText, { color }]}>
        {displayVal}
        <Text style={s.sliderUnit}>{unit}</Text>
      </Text>
    </View>
  );
}

const MCQ_OPTIONS = [
  { label: "A", text: "16.7 kg·m/s" },
  { label: "B", text: "530 kg·m/s" },
  { label: "C", text: "15,000 kg·m/s" },
  { label: "D", text: "6,000 kg·m/s" },
];

function MCQOption({
  opt,
  i,
  selectedOption,
  CORRECT_IDX,
  quizPassed,
  onSelect,
}: {
  opt: { label: string; text: string };
  i: number;
  selectedOption: number | null;
  CORRECT_IDX: number;
  quizPassed: boolean;
  onSelect: (i: number) => void;
}) {
  const scale = useSharedValue(1);
  const isSelected = selectedOption === i;
  const isCorrect = i === CORRECT_IDX;
  const answered = selectedOption !== null;

  let borderColor = "rgba(0,200,255,0.2)";
  let bgColor = "rgba(10,22,40,0.8)";
  let textColor = "#e8f4ff";
  if (answered) {
    if (isSelected && isCorrect) {
      borderColor = "#00ff9f";
      bgColor = "rgba(0,255,159,0.12)";
      textColor = "#00ff9f";
    } else if (isSelected && !isCorrect) {
      borderColor = "#ff4757";
      bgColor = "rgba(255,71,87,0.12)";
      textColor = "#ff4757";
    } else if (!isSelected && isCorrect) {
      borderColor = "rgba(0,255,159,0.4)";
      bgColor = "rgba(0,255,159,0.05)";
      textColor = "#00ff9f";
    }
  }

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.92, { damping: 14, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    onSelect(i);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      disabled={quizPassed}
    >
      <Animated.View
        style={[
          s.mcqOption,
          { borderColor, backgroundColor: bgColor },
          animStyle,
        ]}
      >
        <View style={[s.mcqLabel, { borderColor }]}>
          <Text style={[s.mcqLabelText, { color: textColor }]}>
            {opt.label}
          </Text>
        </View>
        <Text style={[s.mcqText, { color: textColor }]}>{opt.text}</Text>
        {answered && isCorrect && <Text style={s.mcqCheck}>✓</Text>}
        {answered && isSelected && !isCorrect && (
          <Text style={s.mcqCross}>✕</Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function TutorialScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [mass, setMass] = useState(600);
  const [velocity, setVelocity] = useState(8);
  const momentum = mass * velocity;
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const CORRECT_IDX = 2;
  const quizPassed = selectedOption === CORRECT_IDX;

  return (
    <View style={s.container}>
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: insets.top }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={s.backArrow}>{"\u2190"}</Text>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>PRE-MISSION BRIEFING</Text>
            <Text style={s.headerSub}>Understanding Momentum Vectors</Text>
          </View>
          <View style={s.progressPill}>
            <Text style={s.progressText}>2 / 5</Text>
          </View>
        </View>
      </View>

      {/* Progress bar */}
      <View style={s.progressBarWrap}>
        <View style={s.progressBarBg}>
          <LinearGradient
            colors={["#00c8ff", "#00ffd5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[s.progressBarFill, { width: "40%" }]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Momentum Formula Card ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>MOMENTUM FORMULA</Text>
          <View style={s.formulaBox}>
            <Text style={s.formulaMain}>
              p{"\u20D7"} = m {"\u00B7"} v{"\u20D7"}
            </Text>
            <Text style={s.formulaSub}>
              momentum = mass × velocity · Direction matters!
            </Text>
          </View>
          <Text style={s.cardBody}>
            Momentum is a <Text style={s.bold}>vector quantity</Text> — it has
            both magnitude and direction. Doubling mass or velocity doubles the
            momentum.{" "}
          </Text>
        </View>

        {/* ── Vector Diagram Card ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>VECTOR DIAGRAM</Text>
          <View style={s.diagramBox}>
            {/* Object A */}
            <View style={s.objA}>
              <Text style={s.objLabel}>A</Text>
              <Text style={s.objMass}>2000 kg</Text>
            </View>
            {/* Arrow */}
            <View style={s.arrowWrap}>
              <Text style={s.arrowVLabel}>v = 10 m/s →</Text>
              <View style={s.arrowRow}>
                <View style={s.arrowLine} />
                <View style={s.arrowHead} />
              </View>
            </View>
            {/* Object B */}
            <View style={s.objB}>
              <Text style={s.objLabelB}>B</Text>
              <Text style={s.objMassB}>500 kg</Text>
            </View>
          </View>
          <Text style={s.diagramResult}>p_A = 20,000 kg·m/s</Text>
        </View>

        {/* ── Try It Yourself Card ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🧪 TRY IT YOURSELF</Text>
          <View style={s.tryBox}>
            <InteractiveSlider
              label="m"
              unit="kg"
              color="#00c8ff"
              min={MASS_MIN}
              max={MASS_MAX}
              initial={600}
              onValueChange={setMass}
            />
            <InteractiveSlider
              label="v"
              unit="m/s"
              color="#00ffd5"
              min={VEL_MIN}
              max={VEL_MAX}
              initial={8}
              onValueChange={setVelocity}
            />
            <View style={s.momentumRow}>
              <Text style={s.momentumLabel}>p⃗ =</Text>
              <Text style={s.momentumValue}>
                {momentum.toLocaleString()}{" "}
                <Text style={s.momentumUnit}>kg·m/s</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* ── Tip Box ── */}
        <View style={s.tipBox}>
          <Text style={s.tipEmoji}>💡</Text>
          <Text style={s.tipText}>
            <Text style={s.tipBold}>Remember:</Text> Direction is everything in
            momentum problems. A spacecraft moving left has negative momentum
            compared to one moving right!
          </Text>
        </View>

        {/* ── Mission Check: MCQ ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🎯 MISSION CHECK</Text>
          <Text style={s.mcqQuestion}>
            A rocket of mass <Text style={s.bold}>500 kg</Text> accelerates to{" "}
            <Text style={s.bold}>30 m/s</Text>.{"\n"}
            What is its momentum?
          </Text>
          <View style={s.mcqOptions}>
            {MCQ_OPTIONS.map((opt, i) => (
              <MCQOption
                key={i}
                opt={opt}
                i={i}
                selectedOption={selectedOption}
                CORRECT_IDX={CORRECT_IDX}
                quizPassed={quizPassed}
                onSelect={setSelectedOption}
              />
            ))}
          </View>
          {selectedOption !== null && !quizPassed && (
            <Text style={s.mcqHint}>
              ❗ Not quite! Use p = m × v: 500 × 30 = 15,000 kg·m/s
            </Text>
          )}
          {quizPassed && (
            <Text style={s.mcqSuccess}>
              ✓ Correct! Ready for the next mission.
            </Text>
          )}
        </View>

        {/* ── Continue Button ── */}
        <TouchableOpacity
          activeOpacity={quizPassed ? 0.85 : 1}
          onPress={() => {
            if (quizPassed) router.push("/orbital-rescue");
          }}
          style={{ opacity: quizPassed ? 1 : 0.4 }}
        >
          <LinearGradient
            colors={quizPassed ? ["#00c8ff", "#0d4eaa"] : ["#334", "#223"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={s.continueBtn}
          >
            <Text style={s.continueBtnText}>
              {quizPassed ? "NEXT MISSION →" : "ANSWER THE QUIZ TO CONTINUE"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060d1f" } as ViewStyle,

  /* ── Header ── */
  header: {
    flexDirection: "column",
    paddingHorizontal: sw(20),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,200,255,0.2)",
    paddingBottom: sw(12),
  } as ViewStyle,
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: sw(12),
    height: sw(50),
  } as ViewStyle,
  backArrow: {
    fontSize: sw(20),
    color: "#00c8ff",
  } as TextStyle,
  headerCenter: { flex: 1 } as ViewStyle,
  headerTitle: {
    fontFamily: FONT_MONO,
    fontSize: sw(14),
    color: "#e8f4ff",
    letterSpacing: 2,
  } as TextStyle,
  headerSub: {
    fontSize: sw(11),
    color: "#8899aa",
    marginTop: 1,
  } as TextStyle,
  progressPill: {
    borderWidth: 1,
    borderColor: "#00c8ff",
    borderRadius: sw(20),
    paddingHorizontal: sw(15),
    paddingVertical: sw(7),
  } as ViewStyle,
  progressText: {
    fontFamily: FONT_MONO,
    fontSize: sw(12),
    color: "#00c8ff",
    letterSpacing: 1,
  } as TextStyle,

  /* ── Progress Bar ── */
  progressBarWrap: {
    paddingHorizontal: sw(40),
    paddingTop: 0,
  } as ViewStyle,
  progressBarBg: {
    height: sw(4),
    backgroundColor: "rgba(0,200,255,0.15)",
    borderRadius: sw(2),
    overflow: "hidden",
  } as ViewStyle,
  progressBarFill: {
    height: sw(4),
    borderRadius: sw(2),
    shadowColor: "#00c8ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 4,
  } as ViewStyle,

  /* ── Scroll ── */
  scrollContent: {
    paddingHorizontal: sw(20),
    paddingTop: sw(20),
    paddingBottom: sw(40),
    gap: sw(16),
  } as ViewStyle,

  /* ── Cards ── */
  card: {
    backgroundColor: "rgba(10,22,40,0.85)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.2)",
    borderRadius: sw(18),
    paddingTop: sw(21),
    paddingHorizontal: sw(21),
    paddingBottom: sw(16),
  } as ViewStyle,
  cardTitle: {
    fontFamily: FONT_MONO,
    fontSize: sw(12),
    color: "#00c8ff",
    letterSpacing: 2,
    marginBottom: sw(12),
  } as TextStyle,

  /* ── Formula ── */
  formulaBox: {
    backgroundColor: "rgba(0,200,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.2)",
    borderRadius: sw(12),
    paddingVertical: sw(17),
    paddingHorizontal: sw(17),
    alignItems: "center",
    gap: sw(6),
  } as ViewStyle,
  formulaMain: {
    fontFamily: FONT_MONO,
    fontSize: sw(22),
    color: "#00eeff",
    textAlign: "center",
    letterSpacing: 4,
  } as TextStyle,
  formulaSub: {
    fontSize: sw(11),
    color: "#8899aa",
    textAlign: "center",
  } as TextStyle,
  cardBody: {
    fontSize: sw(13),
    color: "#8899aa",
    lineHeight: sw(22),
    marginTop: sw(12),
  } as TextStyle,
  bold: {
    fontWeight: "bold",
    color: "#e8f4ff",
  } as TextStyle,

  /* ── Vector Diagram ── */
  diagramBox: {
    backgroundColor: "rgba(5,10,25,0.8)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.2)",
    borderRadius: sw(12),
    height: sw(140),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: sw(20),
  } as ViewStyle,
  objA: {
    backgroundColor: "rgba(0,200,255,0.15)",
    borderWidth: 1,
    borderColor: "#00c8ff",
    borderRadius: sw(8),
    width: sw(72),
    height: sw(46),
    justifyContent: "center",
    paddingLeft: sw(14),
  } as ViewStyle,
  objLabel: {
    fontFamily: FONT_MONO,
    fontSize: sw(12),
    color: "#00c8ff",
  } as TextStyle,
  objMass: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#00c8ff",
    marginTop: 2,
  } as TextStyle,
  arrowWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  } as ViewStyle,
  arrowVLabel: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#00c8ff",
    marginBottom: sw(4),
  } as TextStyle,
  arrowRow: {
    flexDirection: "row",
    alignItems: "center",
  } as ViewStyle,
  arrowLine: {
    flex: 1,
    height: sw(3),
    backgroundColor: "#00c8ff",
    shadowColor: "#00c8ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 4,
  } as ViewStyle,
  arrowHead: {
    width: 0,
    height: 0,
    borderTopWidth: sw(6),
    borderBottomWidth: sw(6),
    borderLeftWidth: sw(10),
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#00c8ff",
  } as ViewStyle,
  objB: {
    backgroundColor: "rgba(0,200,255,0.15)",
    borderWidth: 1,
    borderColor: "#ffa827",
    borderRadius: sw(8),
    width: sw(66),
    height: sw(46),
    justifyContent: "center",
    paddingLeft: sw(14),
  } as ViewStyle,
  objLabelB: {
    fontFamily: FONT_MONO,
    fontSize: sw(12),
    color: "#ffa827",
  } as TextStyle,
  objMassB: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#ffa827",
    marginTop: 2,
  } as TextStyle,
  diagramResult: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#8899aa",
    marginTop: sw(12),
  } as TextStyle,

  /* ── Try It Yourself ── */
  tryBox: {
    backgroundColor: "rgba(5,10,25,0.9)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.2)",
    borderRadius: sw(12),
    paddingVertical: sw(17),
    paddingLeft: sw(17),
    paddingRight: sw(10),
    gap: sw(10),
  } as ViewStyle,
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    height: sw(16),
  } as ViewStyle,
  sliderLabel: {
    fontFamily: FONT_MONO,
    fontSize: sw(11),
    width: sw(30),
  } as TextStyle,
  sliderTrackOuter: {
    flex: 1,
  } as ViewStyle,
  sliderTrackBg: {
    height: sw(4),
    backgroundColor: "rgba(0,200,255,0.15)",
    borderRadius: sw(2),
    justifyContent: "center",
  } as ViewStyle,
  sliderFill: {
    position: "absolute",
    left: 0,
    top: 0,
    height: sw(4),
    borderRadius: sw(2),
  } as ViewStyle,
  sliderThumb: {
    position: "absolute",
    top: sw(-6),
    left: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
  } as ViewStyle,
  sliderValText: {
    fontFamily: FONT_MONO,
    fontSize: sw(12),
    textAlign: "right",
    width: sw(50),
  } as TextStyle,
  sliderUnit: {
    fontSize: sw(9),
  } as TextStyle,
  momentumRow: {
    backgroundColor: "rgba(0,200,255,0.08)",
    borderRadius: sw(8),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: sw(14),
    paddingVertical: sw(10),
    marginRight: sw(7),
  } as ViewStyle,
  momentumLabel: {
    fontFamily: FONT_MONO,
    fontSize: sw(11),
    color: "#8899aa",
  } as TextStyle,
  momentumValue: {
    fontFamily: FONT_MONO,
    fontSize: sw(18),
    color: "#00eeff",
    fontWeight: "bold",
  } as TextStyle,
  momentumUnit: {
    fontFamily: FONT_MONO,
    fontSize: sw(12),
    color: "#8899aa",
    fontWeight: "normal",
  } as TextStyle,

  /* ── Tip ── */
  tipBox: {
    flexDirection: "row",
    backgroundColor: "rgba(255,168,39,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,168,39,0.2)",
    borderRadius: sw(10),
    paddingVertical: sw(13),
    paddingHorizontal: sw(13),
    gap: sw(10),
    alignItems: "flex-start",
  } as ViewStyle,
  tipEmoji: {
    fontSize: sw(18),
  } as TextStyle,
  tipText: {
    flex: 1,
    fontSize: sw(12),
    color: "rgba(232,244,255,0.8)",
    lineHeight: sw(19),
  } as TextStyle,
  tipBold: {
    fontWeight: "bold",
    color: "#ffa827",
  } as TextStyle,

  /* ── Continue ── */
  continueBtn: {
    borderRadius: sw(14),
    height: sw(51),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00c8ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: sw(28),
    elevation: 10,
  } as ViewStyle,
  continueBtnText: {
    fontWeight: "bold",
    fontSize: sw(14),
    color: "#ffffff",
    letterSpacing: 1,
  } as TextStyle,

  /* ── MCQ Quiz ── */
  mcqQuestion: {
    fontSize: sw(14),
    color: "#e8f4ff",
    lineHeight: sw(22),
    marginBottom: sw(16),
  } as TextStyle,
  mcqOptions: {
    gap: sw(10),
  } as ViewStyle,
  mcqOption: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: sw(12),
    paddingVertical: sw(12),
    paddingHorizontal: sw(14),
    gap: sw(10),
  } as ViewStyle,
  mcqLabel: {
    width: sw(26),
    height: sw(26),
    borderRadius: sw(13),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  } as ViewStyle,
  mcqLabelText: {
    fontFamily: FONT_MONO,
    fontSize: sw(12),
    fontWeight: "bold",
  } as TextStyle,
  mcqText: {
    flex: 1,
    fontSize: sw(14),
  } as TextStyle,
  mcqCheck: {
    fontSize: sw(16),
    color: "#00ff9f",
    fontWeight: "bold",
  } as TextStyle,
  mcqCross: {
    fontSize: sw(16),
    color: "#ff4757",
    fontWeight: "bold",
  } as TextStyle,
  mcqHint: {
    fontSize: sw(12),
    color: "#ffa827",
    marginTop: sw(12),
    lineHeight: sw(20),
  } as TextStyle,
  mcqSuccess: {
    fontSize: sw(13),
    color: "#00ff9f",
    fontWeight: "bold",
    marginTop: sw(12),
    textAlign: "center",
  } as TextStyle,
});
