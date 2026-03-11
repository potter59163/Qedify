import { FadeSlideIn } from "@/components/fade-slide-in";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    Dimensions,
    Image,
    ImageStyle,
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

const FIRE_IMG =
  "https://www.figma.com/api/mcp/asset/f6e8cac2-2ccc-41ab-b8b8-590b0349e95f";
const HEART_IMG =
  "https://www.figma.com/api/mcp/asset/d42c411e-3a95-43c6-9ada-293c00e231b6";
const ROCKET_IMG =
  "https://www.figma.com/api/mcp/asset/88ef8a9e-c336-4729-827d-d3b3fb20cddd";

type MissionNode = {
  label: string;
  stars: number;
  maxStars: number;
  status: "complete" | "current" | "locked" | "boss";
};

const MISSIONS: MissionNode[] = [
  { label: "p = mv Basics", stars: 3, maxStars: 3, status: "complete" },
  { label: "Vector Forces", stars: 2, maxStars: 3, status: "complete" },
  { label: "Orbital Rescue", stars: 0, maxStars: 3, status: "current" },
  { label: "The Junction", stars: 0, maxStars: 3, status: "locked" },
  { label: "Crash Test", stars: 0, maxStars: 3, status: "locked" },
  { label: "BOSS: Crisis Protocol", stars: 0, maxStars: 0, status: "boss" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <FadeSlideIn delay={0}>
          <View style={[s.header, { paddingTop: insets.top + 14 }]}>
            <Text style={s.greeting}>Good morning, Cadet 👋</Text>
            <Text style={s.userName}>Pariphat R.</Text>

            {/* Stat pills */}
            <View style={s.statsRow}>
              <View style={s.statPill}>
                <Text style={s.statEmoji}>⚡</Text>
                <Text style={s.statValue}>1,240 XP</Text>
              </View>
              <View style={s.statPill}>
                <Image
                  source={{ uri: FIRE_IMG }}
                  style={s.statIcon}
                  resizeMode="cover"
                />
                <Text style={[s.statValue, { color: "#ffa827" }]}>7day</Text>
              </View>
              <View style={s.statPill}>
                <Image
                  source={{ uri: HEART_IMG }}
                  style={s.statIcon}
                  resizeMode="cover"
                />
                <Text style={[s.statValue, { color: "#ff4757" }]}>4/5</Text>
              </View>
            </View>
          </View>
        </FadeSlideIn>

        {/* ── Daily Challenge ── */}
        <FadeSlideIn delay={100}>
          <View style={s.challengeOuter}>
            <LinearGradient
              colors={["rgba(0,200,255,0.1)", "rgba(91,69,224,0.1)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.challengeCard}
            >
              <Text style={s.challengeTag}>⚡ DAILY CHALLENGE</Text>
              <Text style={s.challengeTitle}>Impulse Overload</Text>
              <Text style={s.challengeDesc}>
                A 500 kg asteroid is heading toward the station at 20 m/s...
              </Text>
              <View style={s.challengeFooter}>
                <View style={s.timerPill}>
                  <Text style={s.timerText}>⏱ 23:45:12 LEFT</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push("/tutorial")}
                >
                  <LinearGradient
                    colors={["#ffa827", "#e67e00"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={s.playBtn}
                  >
                    <Text style={s.playBtnText}>PLAY NOW</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </FadeSlideIn>

        {/* ── Mission Path ── */}
        <FadeSlideIn delay={180}>
          <Text style={s.sectionTitle}>YOUR MISSION PATH</Text>
        </FadeSlideIn>

        <View style={s.missionPath}>
          {/* Mission nodes column */}
          <View style={s.missionColumn}>
            {MISSIONS.map((m, i) => {
              const tappable =
                m.status === "current" || m.status === "complete";
              return (
                <FadeSlideIn key={i} delay={230 + i * 60}>
                  <TouchableOpacity
                    style={s.missionNodeWrap}
                    activeOpacity={tappable ? 0.7 : 1}
                    onPress={
                      tappable ? () => router.push("/tutorial") : undefined
                    }
                  >
                    {i > 0 && (
                      <View
                        style={[
                          s.connector,
                          {
                            backgroundColor:
                              m.status === "complete"
                                ? "rgba(0,255,159,0.4)"
                                : m.status === "current"
                                  ? "rgba(0,200,255,0.3)"
                                  : "rgba(0,200,255,0.2)",
                          },
                        ]}
                      />
                    )}
                    {m.status === "complete" ? (
                      <LinearGradient
                        colors={["#00ff9f", "#00b870"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={s.nodeCircleComplete}
                      >
                        <Text style={s.nodeCheck}>✓</Text>
                      </LinearGradient>
                    ) : m.status === "current" ? (
                      <View style={s.nodeCircleCurrent}>
                        <Image
                          source={{ uri: ROCKET_IMG }}
                          style={s.rocketIcon}
                          resizeMode="contain"
                        />
                      </View>
                    ) : m.status === "boss" ? (
                      <View style={s.nodeCircleBoss}>
                        <Text style={s.nodeEmoji}>💀</Text>
                      </View>
                    ) : (
                      <View style={s.nodeCircleLocked}>
                        <Text style={s.nodeEmoji}>🔒</Text>
                      </View>
                    )}
                    {m.maxStars > 0 && (
                      <View style={s.starsRow}>
                        {Array.from({ length: m.maxStars }).map((_, si) => (
                          <Text
                            key={si}
                            style={[
                              s.star,
                              si < m.stars
                                ? { color: "#ffa827" }
                                : { color: "rgba(100,120,150,0.4)" },
                            ]}
                          >
                            ★
                          </Text>
                        ))}
                      </View>
                    )}
                    <Text
                      style={[
                        s.nodeLabel,
                        m.status === "boss" && { color: "#ff4757" },
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                </FadeSlideIn>
              );
            })}
          </View>

          {/* Chapter info card */}
          <FadeSlideIn delay={300} style={s.chapterCard}>
            <Text style={s.chapterCardTitle}>Chapter 1</Text>
            <Text style={s.chapterCardSub}>Momentum Fundamentals</Text>
            <Text style={s.chapterCardProgress}>4/6 complete</Text>
          </FadeSlideIn>
        </View>
      </ScrollView>
    </View>
  );
}

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  greeting: TextStyle;
  userName: TextStyle;
  statsRow: ViewStyle;
  statPill: ViewStyle;
  statEmoji: TextStyle;
  statIcon: ImageStyle;
  statValue: TextStyle;
  challengeOuter: ViewStyle;
  challengeCard: ViewStyle;
  challengeTag: TextStyle;
  challengeTitle: TextStyle;
  challengeDesc: TextStyle;
  challengeFooter: ViewStyle;
  timerPill: ViewStyle;
  timerText: TextStyle;
  playBtn: ViewStyle;
  playBtnText: TextStyle;
  sectionTitle: TextStyle;
  missionPath: ViewStyle;
  missionColumn: ViewStyle;
  missionNodeWrap: ViewStyle;
  connector: ViewStyle;
  nodeCircleComplete: ViewStyle;
  nodeCheck: TextStyle;
  nodeCircleCurrent: ViewStyle;
  rocketIcon: ImageStyle;
  nodeCircleLocked: ViewStyle;
  nodeCircleBoss: ViewStyle;
  nodeEmoji: TextStyle;
  starsRow: ViewStyle;
  star: TextStyle;
  nodeLabel: TextStyle;
  chapterCard: ViewStyle;
  chapterCardTitle: TextStyle;
  chapterCardSub: TextStyle;
  chapterCardProgress: TextStyle;
};

const FONT_MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

const s = StyleSheet.create<Styles>({
  container: { flex: 1, backgroundColor: "#060d1f" },

  header: {
    paddingHorizontal: sw(20),
    paddingBottom: sw(16),
    backgroundColor: "rgba(6,13,31,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,200,255,0.2)",
  },
  greeting: { fontSize: sw(13), color: "#8899aa" },
  userName: {
    fontSize: sw(20),
    fontWeight: "bold",
    color: "#e8f4ff",
    marginTop: 2,
  },

  statsRow: {
    flexDirection: "row",
    gap: sw(16),
    marginTop: sw(14),
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: sw(6),
    backgroundColor: "rgba(0,200,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.2)",
    borderRadius: 20,
    height: sw(35),
    paddingHorizontal: sw(13),
  },
  statEmoji: { fontSize: sw(16), color: "#e8f4ff" },
  statIcon: { width: sw(25), height: sw(25) },
  statValue: {
    fontFamily: FONT_MONO,
    fontSize: sw(14),
    fontWeight: "bold",
    color: "#00c8ff",
  },

  challengeOuter: { paddingHorizontal: sw(20), marginTop: sw(20) },
  challengeCard: {
    borderRadius: sw(18),
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.3)",
    padding: sw(16),
  },
  challengeTag: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#ffa827",
    letterSpacing: 2,
  },
  challengeTitle: {
    fontSize: sw(16),
    fontWeight: "bold",
    color: "#e8f4ff",
    marginTop: sw(6),
  },
  challengeDesc: {
    fontSize: sw(12),
    color: "#8899aa",
    marginTop: sw(4),
  },
  challengeFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: sw(12),
  },
  timerPill: {
    borderWidth: 1,
    borderColor: "#ffa827",
    borderRadius: 20,
    paddingHorizontal: sw(15),
    paddingVertical: sw(7),
  },
  timerText: {
    fontFamily: FONT_MONO,
    fontSize: sw(12),
    color: "#ffa827",
    letterSpacing: 1,
  },
  playBtn: {
    borderRadius: sw(10),
    paddingHorizontal: sw(18),
    paddingVertical: sw(8),
    shadowColor: "#ffa827",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: sw(12),
    elevation: 6,
  },
  playBtnText: {
    fontSize: sw(12),
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
  },

  sectionTitle: {
    fontFamily: FONT_MONO,
    fontSize: sw(13),
    color: "#8899aa",
    letterSpacing: 2,
    marginTop: sw(24),
    marginLeft: sw(20),
    textTransform: "uppercase",
  },

  missionPath: {
    flexDirection: "row",
    paddingHorizontal: sw(20),
    marginTop: sw(20),
  },
  missionColumn: {
    alignItems: "center",
    width: sw(100),
  },
  missionNodeWrap: {
    alignItems: "center",
    marginBottom: sw(16),
  },
  connector: {
    width: 2,
    height: sw(20),
    marginBottom: sw(8),
  },
  nodeCircleComplete: {
    width: sw(64),
    height: sw(64),
    borderRadius: sw(32),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#00ff9f",
    shadowColor: "#00ff9f",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: sw(12),
    elevation: 8,
  },
  nodeCheck: { fontSize: sw(24), color: "#e8f4ff" },
  nodeCircleCurrent: {
    width: sw(64),
    height: sw(64),
    borderRadius: sw(32),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#00c8ff",
    backgroundColor: "rgba(0,200,255,0.15)",
    shadowColor: "#00c8ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: sw(20),
    elevation: 8,
  },
  rocketIcon: {
    width: sw(34),
    height: sw(49),
    transform: [{ rotate: "6deg" }],
  },
  nodeCircleLocked: {
    width: sw(64),
    height: sw(64),
    borderRadius: sw(32),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(100,120,150,0.3)",
    backgroundColor: "rgba(10,22,40,0.8)",
  },
  nodeCircleBoss: {
    width: sw(64),
    height: sw(64),
    borderRadius: sw(32),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,71,87,0.2)",
    backgroundColor: "rgba(10,22,40,0.8)",
  },
  nodeEmoji: { fontSize: sw(24), color: "#8899aa" },
  starsRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: sw(6),
  },
  star: { fontSize: sw(12) },
  nodeLabel: {
    fontSize: sw(11),
    color: "#8899aa",
    letterSpacing: 1,
    textAlign: "center",
    marginTop: sw(4),
  },

  chapterCard: {
    marginLeft: sw(20),
    marginTop: sw(4),
    backgroundColor: "rgba(0,200,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.15)",
    borderRadius: sw(10),
    padding: sw(10),
    width: sw(150),
    height: sw(71),
  },
  chapterCardTitle: {
    fontSize: sw(11),
    fontWeight: "600",
    color: "#e8f4ff",
  },
  chapterCardSub: {
    fontSize: sw(11),
    color: "#8899aa",
    marginTop: 2,
  },
  chapterCardProgress: {
    fontSize: sw(11),
    color: "#00ff9f",
    marginTop: 2,
  },
});
