import { FadeSlideIn } from "@/components/fade-slide-in";
import { getPhoneFrameWindow } from "@/constants/device-frame";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W } = getPhoneFrameWindow();
const sw = (n: number) => (n / 388) * W;

type Chapter = {
  number: number;
  status: "complete" | "in-progress" | "locked" | "expert";
  title: string;
  description: string;
  missions: number;
  completedMissions: number;
  difficulty: number;
  difficultyColor: string;
  statusColor: string;
  route?: string;
};

const CHAPTERS: Chapter[] = [
  {
    number: 1,
    status: "complete",
    title: "Momentum Fundamentals",
    description:
      "Master p = mv, vector directions, and momentum as a physical quantity.",
    missions: 6,
    completedMissions: 4,
    difficulty: 1,
    difficultyColor: "#00ff9f",
    statusColor: "#00ff9f",
    route: "/tutorial",
  },
  {
    number: 2,
    status: "in-progress",
    title: "Impulse & Force",
    description:
      "Explore J = F\u0394t and how impulse changes momentum in real scenarios.",
    missions: 6,
    completedMissions: 1,
    difficulty: 2,
    difficultyColor: "#00c8ff",
    statusColor: "#00c8ff",
    route: "/orbital-rescue",
  },
  {
    number: 3,
    status: "locked",
    title: "Conservation Laws",
    description: "Apply momentum conservation in complex multi-object systems.",
    missions: 6,
    completedMissions: 0,
    difficulty: 0,
    difficultyColor: "rgba(100,120,150,0.3)",
    statusColor: "#ffa827",
    route: "/the-junction",
  },
  {
    number: 4,
    status: "expert",
    title: "Collision Mastery",
    description:
      "Elastic vs inelastic collisions, kinetic energy analysis, crisis scenarios.",
    missions: 6,
    completedMissions: 0,
    difficulty: 0,
    difficultyColor: "rgba(100,120,150,0.3)",
    statusColor: "#ff4757",
  },
];

function getStatusLabel(ch: Chapter): string {
  switch (ch.status) {
    case "complete":
      return `CHAPTER 0${ch.number} \u00B7 COMPLETE ${ch.completedMissions}/${ch.missions}`;
    case "in-progress":
      return `CHAPTER 0${ch.number} \u00B7 IN PROGRESS`;
    case "locked":
      return `CHAPTER 0${ch.number} \u00B7 LOCKED`;
    case "expert":
      return `CHAPTER 0${ch.number} \u00B7 LOCKED \u00B7 EXPERT`;
  }
}

export default function ChaptersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={s.container}>
      <StatusBar style="light" />

      {/* ── Header ── */}
      <FadeSlideIn delay={0}>
        <View style={[s.header, { paddingTop: insets.top + 14 }]}>
          <Text style={s.headerTitle}>MISSION CHAPTERS</Text>
          <Text style={s.headerSub}>
            Choose your chapter · 4 worlds · 24 missions
          </Text>
        </View>
      </FadeSlideIn>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 20, paddingTop: sw(20) }}
        showsVerticalScrollIndicator={false}
      >
        {CHAPTERS.map((ch, idx) => {
          const isLocked = ch.status === "locked" || ch.status === "expert";
          const Wrapper = isLocked ? View : TouchableOpacity;
          return (
            <FadeSlideIn key={ch.number} delay={80 + idx * 80}>
              <Wrapper
                style={s.cardOuter}
                {...(!isLocked && {
                  activeOpacity: 0.85,
                  onPress: () => router.push((ch.route ?? "/tutorial") as any),
                })}
              >
                {ch.status === "complete" ? (
                  <LinearGradient
                    colors={["rgba(0,200,255,0.15)", "rgba(91,69,224,0.15)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      s.card,
                      {
                        borderColor: "#00c8ff",
                        shadowColor: "#00c8ff",
                        shadowOpacity: 0.1,
                        shadowRadius: sw(20),
                        elevation: 4,
                      },
                    ]}
                  >
                    {renderCardContent(ch, isLocked)}
                  </LinearGradient>
                ) : ch.status === "in-progress" ? (
                  <LinearGradient
                    colors={["rgba(0,200,255,0.08)", "rgba(13,78,170,0.12)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[s.card, { borderColor: "rgba(0,200,255,0.3)" }]}
                  >
                    {renderCardContent(ch, isLocked)}
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      s.card,
                      {
                        backgroundColor: "rgba(10,22,40,0.5)",
                        borderColor:
                          ch.status === "expert"
                            ? "rgba(255,71,87,0.1)"
                            : "rgba(100,120,150,0.15)",
                      },
                    ]}
                  >
                    {renderCardContent(ch, isLocked)}
                    <Text style={s.lockIcon}>
                      {ch.status === "expert" ? "💀" : "🔒"}
                    </Text>
                  </View>
                )}
              </Wrapper>
            </FadeSlideIn>
          );
        })}
      </ScrollView>
    </View>
  );
}

function renderCardContent(ch: Chapter, isLocked: boolean) {
  return (
    <>
      <Text style={[s.chapterStatus, { color: ch.statusColor }]}>
        {getStatusLabel(ch)}
      </Text>
      <Text style={[s.chapterTitle, isLocked && { color: "#8899aa" }]}>
        {ch.title}
      </Text>
      <Text style={[s.chapterDesc, isLocked && { opacity: 0.6 }]}>
        {ch.description}
      </Text>

      {/* Mission dots (only for non-locked chapters) */}
      {!isLocked && (
        <View style={s.missionDots}>
          {Array.from({ length: ch.missions }).map((_, i) => {
            const completed = i < ch.completedMissions;
            const inProgress =
              !completed &&
              ch.status === "in-progress" &&
              i < ch.completedMissions + 2;
            return (
              <View
                key={i}
                style={[
                  s.missionDot,
                  completed
                    ? { backgroundColor: "#00ff9f" }
                    : inProgress
                      ? {
                          backgroundColor: "rgba(0,200,255,0.15)",
                          borderWidth: 1,
                          borderColor: "rgba(0,200,255,0.3)",
                        }
                      : {
                          backgroundColor: "rgba(100,120,150,0.1)",
                          borderWidth: 1,
                          borderColor: "rgba(100,120,150,0.15)",
                        },
                ]}
              >
                {completed ? (
                  <Text style={s.dotCheck}>✓</Text>
                ) : inProgress ? (
                  <Text style={s.dotNumber}>{i + 1}</Text>
                ) : (
                  <Text style={s.dotLock}>🔒</Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Difficulty */}
      <View style={s.difficultyRow}>
        <Text
          style={[
            s.difficultyLabel,
            ch.status === "expert" && { color: "#ff4757", opacity: 0.7 },
          ]}
        >
          DIFFICULTY
        </Text>
        <View style={s.difficultyDots}>
          {[1, 2, 3, 4].map((level) => (
            <View
              key={level}
              style={[
                s.difficultyDot,
                {
                  backgroundColor:
                    level <= ch.difficulty
                      ? ch.difficultyColor
                      : "rgba(100,120,150,0.3)",
                },
              ]}
            />
          ))}
        </View>
      </View>
    </>
  );
}

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  headerTitle: TextStyle;
  headerSub: TextStyle;
  cardOuter: ViewStyle;
  card: ViewStyle;
  chapterStatus: TextStyle;
  chapterTitle: TextStyle;
  chapterDesc: TextStyle;
  missionDots: ViewStyle;
  missionDot: ViewStyle;
  dotCheck: TextStyle;
  dotNumber: TextStyle;
  dotLock: TextStyle;
  difficultyRow: ViewStyle;
  difficultyLabel: TextStyle;
  difficultyDots: ViewStyle;
  difficultyDot: ViewStyle;
  lockIcon: TextStyle;
};

const FONT_MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

const s = StyleSheet.create<Styles>({
  container: { flex: 1, backgroundColor: "#060d1f" },

  header: {
    paddingHorizontal: sw(20),
    paddingBottom: sw(12),
    backgroundColor: "rgba(6,13,31,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,200,255,0.2)",
  },
  headerTitle: {
    fontFamily: FONT_MONO,
    fontSize: sw(16),
    color: "#00c8ff",
    letterSpacing: 3,
  },
  headerSub: {
    fontSize: sw(12),
    color: "#8899aa",
    marginTop: sw(4),
  },

  cardOuter: {
    paddingHorizontal: sw(20),
    marginBottom: sw(14),
  },
  card: {
    borderRadius: sw(18),
    borderWidth: 1,
    overflow: "hidden",
    padding: sw(18),
  },
  chapterStatus: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    letterSpacing: 2,
  },
  chapterTitle: {
    fontSize: sw(17),
    fontWeight: "bold",
    color: "#e8f4ff",
    marginTop: sw(4),
  },
  chapterDesc: {
    fontSize: sw(12),
    color: "#8899aa",
    lineHeight: sw(18),
    marginTop: sw(4),
  },

  missionDots: {
    flexDirection: "row",
    gap: sw(6),
    marginTop: sw(10),
  },
  missionDot: {
    width: sw(28),
    height: sw(28),
    borderRadius: sw(14),
    alignItems: "center",
    justifyContent: "center",
  },
  dotCheck: {
    fontSize: sw(12),
    fontWeight: "bold",
    color: "#060d1f",
  },
  dotNumber: {
    fontSize: sw(12),
    fontWeight: "bold",
    color: "#00c8ff",
  },
  dotLock: {
    fontSize: sw(12),
    color: "#8899aa",
  },

  difficultyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: sw(10),
  },
  difficultyLabel: {
    fontSize: sw(11),
    color: "#8899aa",
    marginRight: sw(8),
  },
  difficultyDots: {
    flexDirection: "row",
    gap: sw(3),
  },
  difficultyDot: {
    width: sw(10),
    height: sw(10),
    borderRadius: sw(5),
  },

  lockIcon: {
    position: "absolute",
    right: sw(18),
    top: sw(22),
    fontSize: sw(28),
    opacity: 0.4,
  },
});
