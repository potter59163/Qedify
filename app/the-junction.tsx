import { useCountdown } from "@/hooks/use-countdown";
import { getPhoneFrameWindow } from "@/constants/device-frame";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W } = getPhoneFrameWindow();
const sw = (n: number) => (n / 388) * W;

const FONT_MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

// ── Learning Engine: Chapter 3 = fewer hints (2 max vs 3 in Ch.2) ──
// Higher chapter = less scaffolding = learner should recall prior knowledge
const MAX_HINTS = 2;

const JUNCTION_HINTS = [
  "HINT 1/2  Formula recall (Chapter 2 connects here)\n\nFrom Chapter 2 you learned: p = m \u00D7 v\n\nFor INELASTIC collision:\n  v_f = p_total \u00F7 (m1 + m2)\n\nFor ELASTIC collision:\n  v2f = (2\u00D7m1 / (m1+m2)) \u00D7 v1",
  "HINT 2/2  Worked numbers\n\np_total = 1500 \u00D7 8 = 12,000 kg\u00B7m/s\nTotal mass = 1500 + 1000 = 2,500 kg\n\nINELASTIC: v_f = 12,000 \u00F7 2,500 = 4.8 m/s\nELASTIC: v2f = (2\u00D7 1500 / 2500) \u00D7 8 = 9.6 m/s",
];

// ── Misconception Detection by Learning Outcome ──
function getJunctionMisconception(
  userVf: number,
  correctVf: number,
  collisionType: "inelastic" | "elastic",
  attempts: number,
  pTotal: number,
  totalMass: number,
  m1: number,
  m2: number,
  v1: number,
): { title: string; body: string } {
  if (isNaN(userVf)) {
    return {
      title: "NO ANSWER ENTERED",
      body: "Type the final velocity in m/s.\n\n\uD83D\uDD2C LO: You must apply the conservation law\nto find the unknown velocity.",
    };
  }

  const inelasticAns = pTotal / totalMass;
  const elasticAns = (2 * m1 / totalMass) * v1;

  if (collisionType === "inelastic" && Math.abs(userVf - elasticAns) < 0.3) {
    return {
      title: "WRONG COLLISION FORMULA",
      body: "You applied the ELASTIC formula for an INELASTIC collision!\n\n\uD83D\uDD2C Misconception: These formulas are different.\nINELASTIC (stick): v_f = p_total \u00F7 (m1+m2)\nELASTIC (bounce): v2f = (2m1/(m1+m2)) \u00D7 v1",
    };
  }
  if (collisionType === "elastic" && Math.abs(userVf - inelasticAns) < 0.3) {
    return {
      title: "WRONG COLLISION FORMULA",
      body: "You applied the INELASTIC formula for an ELASTIC collision!\n\n\uD83D\uDD2C Misconception: Elastic collisions bounce apart.\nv2f = (2\u00D7m1 / (m1+m2)) \u00D7 v1",
    };
  }

  if (Math.abs(userVf - pTotal / m1) < 0.3) {
    return {
      title: "WRONG DENOMINATOR",
      body: "You divided by m1 only, but after collision\nboth trains move together!\n\n\uD83D\uDD2C For inelastic: divide by COMBINED mass.\n\nv_f = p_total \u00F7 (m1 + m2) = 12,000 \u00F7 2,500",
    };
  }
  if (Math.abs(userVf - pTotal / m2) < 0.3) {
    return {
      title: "WRONG DENOMINATOR",
      body: "You divided by m2 only.\n\n\uD83D\uDD2C Use TOTAL combined mass: (m1 + m2) = 2,500 kg\n\nv_f = 12,000 \u00F7 2,500 = 4.8 m/s",
    };
  }

  if (userVf > v1) {
    return {
      title: "EXCEEDS INITIAL VELOCITY",
      body: "Final velocity can't be greater than v1 = 8 m/s!\n\n\uD83D\uDD2C LO: The stationary train absorbs momentum,\nso the moving train must slow down after collision.",
    };
  }

  if (userVf < 0) {
    return {
      title: "NEGATIVE VELOCITY",
      body: "Both trains travel in the same direction after collision.\n\n\uD83D\uDD2C Check your direction convention.\nFinal velocities here are positive.",
    };
  }

  const diff = Math.abs(userVf - correctVf);
  if (diff < 1.5) {
    return {
      title: "ALMOST CORRECT!",
      body: `Off by only ${diff.toFixed(2)} m/s — check arithmetic.\n\nTarget: ${correctVf.toFixed(2)} m/s\nYours: ${userVf.toFixed(2)} m/s\n\nTip: use exact fractions before rounding.`,
    };
  }

  if (attempts >= 2) {
    const formula =
      collisionType === "inelastic"
        ? `v_f = p_total \u00F7 (m1+m2)\n    = 12,000 \u00F7 2,500 = 4.8 m/s`
        : `v2f = (2\u00D7m1/(m1+m2)) \u00D7 v1\n    = (3000/2500) \u00D7 8 = 9.6 m/s`;
    return {
      title: "STILL INCORRECT",
      body: `Use HINT button for formula help.\n\n${formula}\n\nYours: ${userVf.toFixed(2)} m/s`,
    };
  }

  return {
    title: "INCORRECT v_final",
    body: `Target: ${correctVf.toFixed(2)} m/s\nYours: ${userVf.toFixed(2)} m/s\n\nApply momentum conservation:\np_before = p_after\n\nCheck you selected the right collision type.`,
  };
}

export default function TheJunctionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [collisionType, setCollisionType] = useState<"inelastic" | "elastic">(
    "inelastic",
  );
  const [vFinalInput, setVFinalInput] = useState("");
  const [showError, setShowError] = useState(false);
  const [hearts, setHearts] = useState(3);
  const [showGameOver, setShowGameOver] = useState(false);

  // ── Learning scaffolding state (Chapter 3 = harder, less upfront help) ──
  const [attempts, setAttempts] = useState(0);
  const [hintsRemaining, setHintsRemaining] = useState(MAX_HINTS);
  const [hintLevel, setHintLevel] = useState(0);
  const [showHintModal, setShowHintModal] = useState(false);

  const { formatted: timerDisplay } = useCountdown(150, () =>
    setShowGameOver(true),
  );

  const m1 = 1500, v1 = 8, m2 = 1000;
  const pTotal = m1 * v1;
  const totalMass = m1 + m2;
  const correctVf =
    collisionType === "inelastic"
      ? pTotal / totalMass
      : ((2 * m1) / totalMass) * v1;

  const userVf = parseFloat(vFinalInput);
  const isAnswerCorrect = !isNaN(userVf) && Math.abs(userVf - correctVf) < 0.15;

  const computedPAfter = isNaN(userVf)
    ? null
    : collisionType === "inelastic"
      ? totalMass * userVf
      : m1 * ((m1 - m2) / totalMass) * v1 + m2 * userVf;

  // Pre-compute misconception feedback so modal JSX stays clean
  const errorFeedback = getJunctionMisconception(userVf, correctVf, collisionType, Math.max(0, attempts - 1), pTotal, totalMass, m1, m2, v1);

  const computeStars = () => {
    if (attempts === 0 && hintsRemaining === MAX_HINTS) return 3;
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
              THE JUNCTION {"\u00B7"} MOMENTUM TRANSFER
            </Text>
            <Text style={s.missionSub}>
              Chapter 3 {"\u00B7"} Conservation Laws
            </Text>
          </View>
        </View>
        <View style={s.topStats}>
          <View style={s.topStatItem}>
            <Text style={s.topStatLabel}>TIME</Text>
            <Text style={s.topStatVal}>{timerDisplay}</Text>
          </View>
          <View style={s.topStatItem}>
            <Text style={s.topStatLabel}>HEARTS</Text>
            <View style={s.heartsRow}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Text
                  key={i}
                  style={[s.heartFull, i >= hearts && { opacity: 0.2 }]}
                >
                  {"❤️"}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: sw(30) }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Collision Scene ── */}
        <View style={s.scene}>
          {/* Prior knowledge reminder — links to Chapter 2 content (constructivism) */}
          <View style={s.priorKnowledgeBanner}>
            <Text style={s.priorKnowledgeText}>
              {"\uD83D\uDD17"} Builds on Ch.2: p = m{"\u00D7"}v (Impulse &
              Forces)
            </Text>
          </View>

          {/* Conservation Check */}
          <View style={s.conserveCard}>
            <Text style={s.conserveTitle}>CONSERVATION CHECK</Text>
            <View style={s.conserveRow}>
              <View style={s.conserveCol}>
                <Text style={s.conserveLabel}>p_before</Text>
                <Text style={s.conserveVal}>12,000 kg{"\u00B7"}m/s</Text>
              </View>
              <Text style={s.conserveEq}>=</Text>
              <View style={s.conserveCol}>
                <Text style={s.conserveLabel}>p_after</Text>
                <Text
                  style={[
                    s.conserveValQ,
                    isAnswerCorrect && { color: "#00ff9f" },
                  ]}
                >
                  {computedPAfter !== null
                    ? `${Math.round(computedPAfter).toLocaleString()} kg\u00B7m/s`
                    : "??? kg\u00B7m/s"}
                </Text>
              </View>
            </View>
          </View>

          {/* Train collision visualization */}
          <View style={s.trainScene}>
            <View style={s.trainWrap}>
              <Text style={s.trainEmoji}>{"\uD83D\uDE83"}</Text>
              <Text style={s.trainInfo}>
                m=1500 kg {"\u00B7"} v=8 m/s {"\u2192"}
              </Text>
            </View>

            <View style={s.collisionJunction}>
              <View style={s.junctionCircle}>
                <Text style={s.junctionText}>J</Text>
              </View>
              <View style={s.junctionLine} />
            </View>

            <View style={s.trainWrap}>
              <Text style={s.trainEmoji}>{"\uD83D\uDE83"}</Text>
              <Text style={s.trainInfo}>
                m=1000 kg {"\u00B7"} v=0 {"\u2192"}
              </Text>
            </View>
          </View>

          {/* Unknown velocity */}
          <View style={s.unknownBox}>
            <Text
              style={[s.unknownText, isAnswerCorrect && { color: "#00ff9f" }]}
            >
              {collisionType === "elastic" ? "v2f" : "v_f"} ={" "}
              {vFinalInput || "???"}
            </Text>
          </View>

          {/* Collision type selector */}
          <View style={s.collisionTypeWrap}>
            <Text style={s.collisionTypeTitle}>SELECT COLLISION TYPE:</Text>
            <View style={s.collisionTypes}>
              <TouchableOpacity
                style={[
                  s.typeCard,
                  collisionType === "inelastic" && s.typeCardActive,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setCollisionType("inelastic");
                  setVFinalInput("");
                }}
              >
                <Text style={s.typeEmoji}>{"\uD83D\uDCA5"}</Text>
                <Text
                  style={[
                    s.typeName,
                    collisionType === "inelastic" && s.typeNameActive,
                  ]}
                >
                  INELASTIC
                </Text>
                <Text style={s.typeDesc}>Stick together</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.typeCard,
                  collisionType === "elastic" && s.typeCardActive,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setCollisionType("elastic");
                  setVFinalInput("");
                }}
              >
                <Text style={s.typeEmoji}>{"\u2194\uFE0F"}</Text>
                <Text
                  style={[
                    s.typeName,
                    collisionType === "elastic" && s.typeNameActive,
                  ]}
                >
                  ELASTIC
                </Text>
                <Text style={s.typeDesc}>Bounce apart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Controls ── */}
        <View style={s.controlPanel}>
          {/* Reference values */}
          <View style={s.equationRow}>
            <View style={s.eqField}>
              <Text style={s.eqLabel}>TOTAL MASS</Text>
              <View style={s.eqInput}>
                <Text style={s.eqValue}>{totalMass.toLocaleString()}</Text>
                <Text style={s.eqUnit}>kg</Text>
              </View>
            </View>
            <Text style={s.eqOp}>{"\u00B7"}</Text>
            <View style={s.eqField}>
              <Text style={s.eqLabel}>p_total</Text>
              <View style={s.eqInput}>
                <Text style={s.eqValue}>{pTotal.toLocaleString()}</Text>
                <Text style={s.eqUnit}>kg{"\u00B7"}m/s</Text>
              </View>
            </View>
          </View>

          {/* v_final input */}
          <View style={s.vfInputWrap}>
            <Text style={s.eqLabel}>
              YOUR ANSWER: {collisionType === "elastic" ? "v2f" : "v_f"}{" "}
              (m/s)
            </Text>
            <View
              style={[
                s.eqInput,
                s.vfInputBox,
                isAnswerCorrect && { borderColor: "rgba(0,255,159,0.4)" },
              ]}
            >
              <TextInput
                style={[s.eqValue, s.vfInputField]}
                value={vFinalInput}
                onChangeText={setVFinalInput}
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor="#556677"
              />
              <Text style={s.eqUnit}>m/s</Text>
            </View>
          </View>

          {/* Hint button (Chapter 3: only 2 hints — less support than Chapter 2) */}
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
            <Text style={s.hintNote}>Ch.3: fewer hints</Text>
          </View>

          {/* ── Scaffolding Card (appears only after attempt 2 — harder threshold than Ch.2) ── */}
          {attempts >= 2 && (
            <View style={s.scaffoldCard}>
              <Text style={s.scaffoldTitle}>
                {"\uD83D\uDCCB"} SCAFFOLD (unlocked after 2 wrong attempts)
              </Text>
              <Text style={s.scaffoldStep}>
                1{"\u25B8"} p_before = m1{"\u00D7"}v1 = 1500{"\u00D7"}8 = 12,000
              </Text>
              <Text style={s.scaffoldStep}>
                2{"\u25B8"} Momentum conserved: p_before = p_after
              </Text>
              {collisionType === "inelastic" ? (
                <>
                  <Text style={s.scaffoldStep}>
                    3{"\u25B8"} INELASTIC: v_f = p_total {"\u00F7"} (m1+m2)
                  </Text>
                  <Text style={s.scaffoldStep}>
                    4{"\u25B8"} v_f = 12,000 {"\u00F7"} 2,500 = ?
                  </Text>
                </>
              ) : (
                <>
                  <Text style={s.scaffoldStep}>
                    3{"\u25B8"} ELASTIC: v2f = (2m1/(m1+m2)) {"\u00D7"} v1
                  </Text>
                  <Text style={s.scaffoldStep}>
                    4{"\u25B8"} v2f = (3000/2500) {"\u00D7"} 8 = ?
                  </Text>
                </>
              )}
              {attempts >= 3 && (
                <Text style={[s.scaffoldStep, s.scaffoldExample]}>
                  {"\uD83D\uDD0D"} Answer:{" "}
                  {collisionType === "inelastic" ? "4.8 m/s" : "9.6 m/s"}{" "}
                  {"\u2713"}
                </Text>
              )}
            </View>
          )}

          {/* Calculate button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (isAnswerCorrect) {
                const stars = computeStars();
                const xp = stars === 3 ? 380 : stars === 2 ? 240 : 140;
                const hintsUsed = MAX_HINTS - hintsRemaining;
                const accuracy =
                  attempts === 0
                    ? 100
                    : Math.max(40, Math.round(100 - attempts * 15));
                router.push({
                  pathname: "/results",
                  params: {
                    missionId: "the-junction",
                    missionName: "The Junction",
                    chapter: "Chapter 3",
                    stars: String(stars),
                    xp: String(xp),
                    accuracy: String(accuracy),
                    attempts: String(attempts),
                    hintsUsed: String(hintsUsed),
                    maxHints: String(MAX_HINTS),
                    lo1: collisionType === "inelastic" ? "mastered" : "partial",
                    lo2: attempts <= 1 ? "mastered" : "partial",
                    lo3:
                      hintsUsed === 0 && attempts === 0
                        ? "mastered"
                        : "partial",
                  },
                });
              } else {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                const newHearts = hearts - 1;
                setHearts(newHearts);
                if (newHearts <= 0) setShowGameOver(true);
                else setShowError(true);
              }
            }}
          >
            <LinearGradient
              colors={["#00c8ff", "#0d4eaa"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={s.calcBtn}
            >
              <Text style={s.calcBtnText}>CALCULATE v_final {"\u26A1"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Error Modal (Misconception-targeted feedback) ── */}
      <Modal visible={showError} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalIcon}>{"\u26A0\uFE0F"}</Text>
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

      {/* ── Hint Modal ── */}
      <Modal visible={showHintModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, s.hintModalBox]}>
            <Text style={s.hintModalIcon}>{"\uD83D\uDCA1"}</Text>
            <Text style={s.hintModalTitle}>SCAFFOLDING HINT</Text>
            <Text style={s.hintModalBody}>
              {hintLevel > 0 ? JUNCTION_HINTS[hintLevel - 1] : ""}
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
                ? "No hearts left!\n\nReview Chapter 2 (Impulse) first,\nthen apply momentum conservation:\np_before = p_after\n\nFor inelastic: v_f = p_total \u00F7 (m1+m2)"
                : "Time's up! Train collision not solved.\n\nRemember:\np_before = p_after (conservation law)\nFor inelastic: v_f = 12,000 \u00F7 2,500 = 4.8 m/s"}
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
  scene: ViewStyle;
  priorKnowledgeBanner: ViewStyle;
  priorKnowledgeText: TextStyle;
  conserveCard: ViewStyle;
  conserveTitle: TextStyle;
  conserveRow: ViewStyle;
  conserveCol: ViewStyle;
  conserveLabel: TextStyle;
  conserveVal: TextStyle;
  conserveValQ: TextStyle;
  conserveEq: TextStyle;
  trainScene: ViewStyle;
  trainWrap: ViewStyle;
  trainEmoji: TextStyle;
  trainInfo: TextStyle;
  collisionJunction: ViewStyle;
  junctionCircle: ViewStyle;
  junctionText: TextStyle;
  junctionLine: ViewStyle;
  unknownBox: ViewStyle;
  unknownText: TextStyle;
  collisionTypeWrap: ViewStyle;
  collisionTypeTitle: TextStyle;
  collisionTypes: ViewStyle;
  typeCard: ViewStyle;
  typeCardActive: ViewStyle;
  typeEmoji: TextStyle;
  typeName: TextStyle;
  typeNameActive: TextStyle;
  typeDesc: TextStyle;
  controlPanel: ViewStyle;
  equationRow: ViewStyle;
  eqField: ViewStyle;
  eqLabel: TextStyle;
  eqInput: ViewStyle;
  eqValue: TextStyle;
  eqUnit: TextStyle;
  eqOp: TextStyle;
  calcBtn: ViewStyle;
  calcBtnText: TextStyle;
  vfInputWrap: ViewStyle;
  vfInputBox: ViewStyle;
  vfInputField: TextStyle;
  hintRow: ViewStyle;
  hintBtn: ViewStyle;
  hintBtnDisabled: ViewStyle;
  hintBtnText: TextStyle;
  hintBtnTextDisabled: TextStyle;
  hintNote: TextStyle;
  scaffoldCard: ViewStyle;
  scaffoldTitle: TextStyle;
  scaffoldStep: TextStyle;
  scaffoldExample: TextStyle;
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
    fontSize: sw(10),
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

  /* Scene */
  scene: {
    paddingHorizontal: sw(16),
    paddingTop: sw(16),
  },

  /* Prior Knowledge Banner (Constructivism link) */
  priorKnowledgeBanner: {
    backgroundColor: "rgba(91,69,224,0.08)",
    borderWidth: 1,
    borderColor: "rgba(91,69,224,0.2)",
    borderRadius: sw(8),
    paddingVertical: sw(7),
    paddingHorizontal: sw(12),
    marginBottom: sw(12),
    flexDirection: "row",
    alignItems: "center",
  },
  priorKnowledgeText: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#a78bfa",
    letterSpacing: 0.5,
  },

  conserveCard: {
    backgroundColor: "rgba(0,200,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.15)",
    borderRadius: sw(12),
    padding: sw(14),
    marginBottom: sw(16),
  },
  conserveTitle: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#00c8ff",
    letterSpacing: 2,
    marginBottom: sw(10),
  },
  conserveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  conserveCol: { alignItems: "center" },
  conserveLabel: {
    fontFamily: FONT_MONO,
    fontSize: sw(11),
    color: "#8899aa",
    marginBottom: 2,
  },
  conserveVal: {
    fontFamily: FONT_MONO,
    fontSize: sw(15),
    color: "#e8f4ff",
    fontWeight: "bold",
  },
  conserveValQ: {
    fontFamily: FONT_MONO,
    fontSize: sw(15),
    color: "#ffa827",
    fontWeight: "bold",
  },
  conserveEq: {
    fontFamily: FONT_MONO,
    fontSize: sw(22),
    color: "#8899aa",
    marginHorizontal: sw(20),
  },

  /* Trains */
  trainScene: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: sw(20),
    gap: sw(8),
  },
  trainWrap: { alignItems: "center" },
  trainEmoji: { fontSize: sw(32) },
  trainInfo: {
    fontFamily: FONT_MONO,
    fontSize: sw(8),
    color: "#8899aa",
    marginTop: sw(4),
    textAlign: "center",
    width: sw(100),
  },
  collisionJunction: { alignItems: "center" },
  junctionCircle: {
    width: sw(28),
    height: sw(28),
    borderRadius: sw(14),
    backgroundColor: "rgba(255,168,39,0.2)",
    borderWidth: 1,
    borderColor: "#ffa827",
    alignItems: "center",
    justifyContent: "center",
  },
  junctionText: {
    fontFamily: FONT_MONO,
    fontSize: sw(12),
    color: "#ffa827",
    fontWeight: "bold",
  },
  junctionLine: {
    width: sw(60),
    height: 2,
    backgroundColor: "rgba(0,200,255,0.3)",
    marginTop: sw(4),
  },
  unknownBox: {
    alignItems: "center",
    marginBottom: sw(16),
  },
  unknownText: {
    fontFamily: FONT_MONO,
    fontSize: sw(14),
    color: "#ffa827",
    fontWeight: "bold",
  },

  /* Collision Types */
  collisionTypeWrap: { marginBottom: sw(16) },
  collisionTypeTitle: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#8899aa",
    letterSpacing: 1,
    marginBottom: sw(10),
  },
  collisionTypes: { flexDirection: "row", gap: sw(8) },
  typeCard: {
    flex: 1,
    backgroundColor: "rgba(0,200,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.15)",
    borderRadius: sw(12),
    padding: sw(12),
    alignItems: "center",
  },
  typeCardActive: {
    borderColor: "#00c8ff",
    backgroundColor: "rgba(0,200,255,0.12)",
  },
  typeEmoji: { fontSize: sw(20), marginBottom: sw(6) },
  typeName: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#8899aa",
    letterSpacing: 1,
  },
  typeNameActive: { color: "#00c8ff" },
  typeDesc: {
    fontSize: sw(11),
    color: "#8899aa",
    marginTop: 2,
  },

  /* Controls */
  controlPanel: { paddingHorizontal: sw(16), paddingTop: sw(8) },
  equationRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: sw(8),
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
    paddingHorizontal: sw(12),
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
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
  calcBtn: {
    borderRadius: sw(14),
    height: sw(47),
    alignItems: "center",
    justifyContent: "center",
  },
  calcBtnText: {
    fontFamily: FONT_MONO,
    fontSize: sw(14),
    color: "#e8f4ff",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  vfInputWrap: { marginBottom: sw(16) },
  vfInputBox: { marginTop: sw(4) },
  vfInputField: { flex: 1, padding: 0, margin: 0 },

  /* Hint Row */
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: sw(12),
    marginBottom: sw(14),
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
  hintBtnTextDisabled: { color: "#556677" },
  hintNote: {
    fontFamily: FONT_MONO,
    fontSize: sw(9),
    color: "#556677",
    fontStyle: "italic",
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

  /* Hint Modal */
  hintModalBox: { borderColor: "rgba(0,200,255,0.4)" },
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
