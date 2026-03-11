import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W } = Dimensions.get("window");
const sw = (n: number) => (n / 388) * W;

const FONT_MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

export default function TutorialScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: sw(30) }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={[s.header, { paddingTop: insets.top + sw(12) }]}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={s.backArrow}>{"\u2190"}</Text>
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>PRE-MISSION BRIEFING</Text>
              <Text style={s.headerSub}>Understanding Momentum Vectors</Text>
            </View>
            <View style={s.progressPill}>
              <Text style={s.progressText}>2/5</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={s.progressBarBg}>
            <LinearGradient
              colors={["#00c8ff", "#5b45e0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[s.progressBarFill, { width: "40%" }]}
            />
          </View>
        </View>

        {/* ── Momentum Formula Card ── */}
        <View style={s.cardWrap}>
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardHeaderText}>MOMENTUM FORMULA</Text>
            </View>
            <View style={s.formulaBox}>
              <Text style={s.formulaMain}>
                p{"\u20D7"} = m {"\u00B7"} v{"\u20D7"}
              </Text>
            </View>
            <Text style={s.formulaDesc}>
              Momentum is a <Text style={s.highlight}>vector quantity</Text>{" "}
              {"\u2014"} it has both magnitude and direction. The direction of
              momentum is always the same as the direction of velocity.
            </Text>
          </View>
        </View>

        {/* ── Vector Diagram Card ── */}
        <View style={s.cardWrap}>
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardHeaderText}>VECTOR DIAGRAM</Text>
            </View>

            <View style={s.diagramWrap}>
              {/* Object A */}
              <View style={s.diagramObj}>
                <View style={s.objectCircle}>
                  <Text style={s.objectEmoji}>{"\uD83D\uDE80"}</Text>
                </View>
                <Text style={s.objectLabel}>Object A</Text>
                <Text style={s.objectMass}>2,000 kg</Text>
              </View>

              {/* Arrow */}
              <View style={s.arrowWrap}>
                <View style={s.arrowLine} />
                <Text style={s.arrowHead}>{"\u25B6"}</Text>
                <Text style={s.arrowLabel}>v = 10 m/s {"\u2192"}</Text>
              </View>

              {/* Object B */}
              <View style={s.diagramObj}>
                <View
                  style={[
                    s.objectCircle,
                    { backgroundColor: "rgba(255,71,87,0.15)" },
                  ]}
                >
                  <Text style={s.objectEmoji}>{"\u2B50"}</Text>
                </View>
                <Text style={s.objectLabel}>Object B</Text>
                <Text style={s.objectMass}>500 kg</Text>
              </View>
            </View>

            <View style={s.momentumResult}>
              <Text style={s.momentumLabel}>
                p{"\u20D7"}_A = m {"\u00D7"} v
              </Text>
              <Text style={s.momentumValue}>
                p{"\u20D7"}_A = 20,000 kg{"\u00B7"}m/s
              </Text>
            </View>
          </View>
        </View>

        {/* ── Try It Yourself Card ── */}
        <View style={s.cardWrap}>
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardHeaderText}>TRY IT YOURSELF</Text>
            </View>

            {/* Mass slider */}
            <View style={s.sliderGroup}>
              <Text style={s.sliderLabel}>MASS (kg)</Text>
              <View style={s.sliderTrack}>
                <View style={[s.sliderFill, { width: "60%" }]} />
                <View style={[s.sliderThumb, { left: "58%" }]} />
              </View>
              <Text style={s.sliderValue}>m = 600 kg</Text>
            </View>

            {/* Velocity slider */}
            <View style={s.sliderGroup}>
              <Text style={s.sliderLabel}>VELOCITY (m/s)</Text>
              <View style={s.sliderTrack}>
                <View style={[s.sliderFill, { width: "40%" }]} />
                <View style={[s.sliderThumb, { left: "38%" }]} />
              </View>
              <Text style={s.sliderValue}>v = 8 m/s</Text>
            </View>

            {/* Result */}
            <View style={s.tryResultBox}>
              <Text style={s.tryResultLabel}>MOMENTUM</Text>
              <Text style={s.tryResultValue}>
                p{"\u20D7"} = 4,800 kg{"\u00B7"}m/s
              </Text>
            </View>
          </View>
        </View>

        {/* ── Tip Box ── */}
        <View style={s.cardWrap}>
          <View style={s.tipBox}>
            <Text style={s.tipEmoji}>{"\uD83D\uDCA1"}</Text>
            <Text style={s.tipText}>
              Remember: Direction is everything in momentum problems. Two
              objects with the same speed but opposite directions have opposite
              momenta!
            </Text>
          </View>
        </View>

        {/* ── Continue Button ── */}
        <View style={s.cardWrap}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/orbital-rescue")}
          >
            <LinearGradient
              colors={["#00c8ff", "#0d4eaa"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={s.continueBtn}
            >
              <Text style={s.continueBtnText}>
                NEXT: Impulse {"\u2192"} CONTINUE
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  headerRow: ViewStyle;
  backArrow: TextStyle;
  headerCenter: ViewStyle;
  headerTitle: TextStyle;
  headerSub: TextStyle;
  progressPill: ViewStyle;
  progressText: TextStyle;
  progressBarBg: ViewStyle;
  progressBarFill: ViewStyle;
  cardWrap: ViewStyle;
  card: ViewStyle;
  cardHeader: ViewStyle;
  cardHeaderText: TextStyle;
  formulaBox: ViewStyle;
  formulaMain: TextStyle;
  formulaDesc: TextStyle;
  highlight: TextStyle;
  diagramWrap: ViewStyle;
  diagramObj: ViewStyle;
  objectCircle: ViewStyle;
  objectEmoji: TextStyle;
  objectLabel: TextStyle;
  objectMass: TextStyle;
  arrowWrap: ViewStyle;
  arrowLine: ViewStyle;
  arrowHead: TextStyle;
  arrowLabel: TextStyle;
  momentumResult: ViewStyle;
  momentumLabel: TextStyle;
  momentumValue: TextStyle;
  sliderGroup: ViewStyle;
  sliderLabel: TextStyle;
  sliderTrack: ViewStyle;
  sliderFill: ViewStyle;
  sliderThumb: ViewStyle;
  sliderValue: TextStyle;
  tryResultBox: ViewStyle;
  tryResultLabel: TextStyle;
  tryResultValue: TextStyle;
  tipBox: ViewStyle;
  tipEmoji: TextStyle;
  tipText: TextStyle;
  continueBtn: ViewStyle;
  continueBtnText: TextStyle;
};

const s = StyleSheet.create<Styles>({
  container: { flex: 1, backgroundColor: "#060d1f" },

  /* Header */
  header: {
    paddingHorizontal: sw(16),
    paddingBottom: sw(12),
    backgroundColor: "rgba(6,13,31,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,200,255,0.2)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: sw(10),
  },
  backArrow: { fontSize: sw(22), color: "#e8f4ff", marginRight: sw(10) },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontFamily: FONT_MONO,
    fontSize: sw(12),
    color: "#00c8ff",
    letterSpacing: 2,
  },
  headerSub: {
    fontSize: sw(11),
    color: "#8899aa",
    marginTop: 2,
  },
  progressPill: {
    backgroundColor: "rgba(0,200,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.3)",
    borderRadius: 12,
    paddingHorizontal: sw(10),
    paddingVertical: sw(4),
  },
  progressText: {
    fontFamily: FONT_MONO,
    fontSize: sw(12),
    color: "#00c8ff",
  },
  progressBarBg: {
    height: sw(4),
    backgroundColor: "rgba(0,200,255,0.15)",
    borderRadius: 2,
  },
  progressBarFill: {
    height: sw(4),
    borderRadius: 2,
  },

  /* Cards */
  cardWrap: { paddingHorizontal: sw(20), marginTop: sw(16) },
  card: {
    backgroundColor: "rgba(0,200,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.15)",
    borderRadius: sw(16),
    overflow: "hidden",
  },
  cardHeader: {
    backgroundColor: "rgba(0,200,255,0.1)",
    paddingVertical: sw(10),
    paddingHorizontal: sw(15),
  },
  cardHeaderText: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#00c8ff",
    letterSpacing: 2,
  },

  /* Formula */
  formulaBox: {
    alignItems: "center",
    paddingVertical: sw(20),
    marginHorizontal: sw(15),
    marginTop: sw(12),
    backgroundColor: "rgba(0,200,255,0.08)",
    borderRadius: sw(12),
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.2)",
  },
  formulaMain: {
    fontFamily: FONT_MONO,
    fontSize: sw(28),
    color: "#e8f4ff",
    fontWeight: "bold",
  },
  formulaDesc: {
    fontSize: sw(13),
    color: "#8899aa",
    lineHeight: sw(20),
    paddingHorizontal: sw(15),
    paddingVertical: sw(12),
  },
  highlight: { color: "#00c8ff", fontWeight: "bold" },

  /* Vector Diagram */
  diagramWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: sw(20),
    paddingHorizontal: sw(10),
  },
  diagramObj: { alignItems: "center" },
  objectCircle: {
    width: sw(56),
    height: sw(56),
    borderRadius: sw(28),
    backgroundColor: "rgba(0,200,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  objectEmoji: { fontSize: sw(24) },
  objectLabel: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#00c8ff",
    marginTop: sw(6),
    letterSpacing: 1,
  },
  objectMass: {
    fontSize: sw(12),
    color: "#8899aa",
    marginTop: 2,
  },
  arrowWrap: { alignItems: "center", paddingHorizontal: sw(8) },
  arrowLine: {
    width: sw(40),
    height: 2,
    backgroundColor: "#00c8ff",
    marginBottom: sw(4),
  },
  arrowHead: { fontSize: sw(10), color: "#00c8ff", marginTop: -sw(6) },
  arrowLabel: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#e8f4ff",
    marginTop: sw(4),
  },
  momentumResult: {
    paddingHorizontal: sw(15),
    paddingBottom: sw(15),
  },
  momentumLabel: {
    fontFamily: FONT_MONO,
    fontSize: sw(11),
    color: "#8899aa",
  },
  momentumValue: {
    fontFamily: FONT_MONO,
    fontSize: sw(16),
    color: "#00ff9f",
    fontWeight: "bold",
    marginTop: 2,
  },

  /* Sliders */
  sliderGroup: {
    paddingHorizontal: sw(15),
    marginTop: sw(14),
  },
  sliderLabel: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#8899aa",
    letterSpacing: 1,
    marginBottom: sw(8),
  },
  sliderTrack: {
    height: sw(6),
    backgroundColor: "rgba(0,200,255,0.15)",
    borderRadius: 3,
    position: "relative",
  },
  sliderFill: {
    height: sw(6),
    backgroundColor: "#00c8ff",
    borderRadius: 3,
  },
  sliderThumb: {
    position: "absolute",
    top: -sw(5),
    width: sw(16),
    height: sw(16),
    borderRadius: sw(8),
    backgroundColor: "#00c8ff",
    borderWidth: 2,
    borderColor: "#e8f4ff",
  },
  sliderValue: {
    fontFamily: FONT_MONO,
    fontSize: sw(14),
    color: "#e8f4ff",
    marginTop: sw(10),
  },

  tryResultBox: {
    margin: sw(15),
    padding: sw(14),
    backgroundColor: "rgba(0,255,159,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,255,159,0.3)",
    borderRadius: sw(12),
    alignItems: "center",
  },
  tryResultLabel: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#8899aa",
    letterSpacing: 2,
  },
  tryResultValue: {
    fontFamily: FONT_MONO,
    fontSize: sw(20),
    color: "#00ff9f",
    fontWeight: "bold",
    marginTop: sw(4),
  },

  /* Tip */
  tipBox: {
    flexDirection: "row",
    backgroundColor: "rgba(255,168,39,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,168,39,0.3)",
    borderRadius: sw(14),
    padding: sw(14),
    alignItems: "flex-start",
  },
  tipEmoji: { fontSize: sw(18), marginRight: sw(10) },
  tipText: {
    flex: 1,
    fontSize: sw(13),
    color: "#e8f4ff",
    lineHeight: sw(20),
  },

  /* Continue */
  continueBtn: {
    borderRadius: sw(14),
    height: sw(51),
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtnText: {
    fontFamily: FONT_MONO,
    fontSize: sw(14),
    color: "#e8f4ff",
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
