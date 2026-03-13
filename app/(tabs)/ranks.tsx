import { FadeSlideIn } from "@/components/fade-slide-in";
import { getPhoneFrameWindow } from "@/constants/device-frame";
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

const FONT_MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

type RankEntry = {
  rank: number;
  name: string;
  emoji: string;
  chapter: string;
  accuracy: string;
  xp: string;
  isYou?: boolean;
};

const RANK_LIST: RankEntry[] = [
  {
    rank: 4,
    name: "Arisa T.",
    emoji: "\uD83E\uDDD1",
    chapter: "Chapter 3",
    accuracy: "94% acc",
    xp: "1,980",
  },
  {
    rank: 5,
    name: "Beam W.",
    emoji: "\uD83D\uDC69",
    chapter: "Chapter 2",
    accuracy: "89% acc",
    xp: "1,740",
  },
  {
    rank: 7,
    name: "You \u00B7 Pariphat R.",
    emoji: "\uD83D\uDC68\u200D\uD83D\uDE80",
    chapter: "Chapter 2",
    accuracy: "87% acc",
    xp: "1,240",
    isYou: true,
  },
  {
    rank: 8,
    name: "Krit M.",
    emoji: "\uD83E\uDDD1",
    chapter: "Chapter 2",
    accuracy: "82% acc",
    xp: "1,120",
  },
  {
    rank: 9,
    name: "Fah P.",
    emoji: "\uD83D\uDC67",
    chapter: "Chapter 1",
    accuracy: "91% acc",
    xp: "980",
  },
];

const TABS = ["GLOBAL", "SCHOOL", "FRIENDS"];

export default function RanksScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: sw(20) }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <FadeSlideIn delay={0}>
          <View style={[s.header, { paddingTop: insets.top + sw(14) }]}>
            <Text style={s.headerTitle}>MISSION CONTROL RANKS</Text>

            {/* Tab bar */}
            <View style={s.tabRow}>
              {TABS.map((tab, i) => (
                <TouchableOpacity
                  key={tab}
                  style={[s.tab, i === 0 && s.tabActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[s.tabText, i === 0 && s.tabTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </FadeSlideIn>

        {/* ── Podium ── */}
        <FadeSlideIn delay={80} offsetY={40}>
          <View style={s.podium}>
            {/* Silver (2nd) */}
            <View style={s.podiumPlace}>
              <View style={s.podiumAvatar}>
                <Text style={s.podiumEmoji}>
                  {"\uD83D\uDC69\u200D\uD83D\uDE80"}
                </Text>
              </View>
              <Text style={s.podiumName}>ippee</Text>
              <Text style={s.podiumXp}>2,840 XP</Text>
              <View style={[s.podiumPedestal, { height: sw(45) }]}>
                <Text style={s.podiumMedal}>{"\uD83E\uDD48"}</Text>
              </View>
            </View>

            {/* Gold (1st) */}
            <View style={s.podiumPlace}>
              <View style={[s.podiumAvatar, s.podiumAvatarGold]}>
                <Text style={s.podiumEmojiGold}>
                  {"\uD83E\uDDD1\u200D\uD83D\uDE80"}
                </Text>
              </View>
              <Text style={s.podiumName}>Pudis</Text>
              <Text style={s.podiumXp}>3,520 XP</Text>
              <View
                style={[
                  s.podiumPedestal,
                  s.podiumPedestalGold,
                  { height: sw(60) },
                ]}
              >
                <Text style={s.podiumMedal}>{"\uD83E\uDD47"}</Text>
              </View>
            </View>

            {/* Bronze (3rd) */}
            <View style={s.podiumPlace}>
              <View style={s.podiumAvatar}>
                <Text style={s.podiumEmoji}>
                  {"\uD83D\uDC68\u200D\uD83D\uDE80"}
                </Text>
              </View>
              <Text style={s.podiumName}>Namo K.</Text>
              <Text style={s.podiumXp}>2,110 XP</Text>
              <View style={[s.podiumPedestal, { height: sw(35) }]}>
                <Text style={s.podiumMedal}>{"\uD83E\uDD49"}</Text>
              </View>
            </View>
          </View>
        </FadeSlideIn>

        {/* ── Rank List ── */}
        <View style={s.rankList}>
          {RANK_LIST.map((r, i) => (
            <FadeSlideIn key={r.rank} delay={180 + i * 70}>
              <View style={[s.rankRow, r.isYou && s.rankRowYou]}>
                <Text style={s.rankNum}>{r.rank}</Text>
                <View style={s.rankAvatar}>
                  <Text style={s.rankEmoji}>{r.emoji}</Text>
                </View>
                <View style={s.rankInfo}>
                  <Text style={[s.rankName, r.isYou && s.rankNameYou]}>
                    {r.name}
                  </Text>
                  <Text style={s.rankSub}>
                    {r.chapter} {"\u00B7"} {r.accuracy}
                  </Text>
                </View>
                <Text style={s.rankXp}>{r.xp}</Text>
              </View>
            </FadeSlideIn>
          ))}
        </View>

        {/* ── Weekly Challenge ── */}
        <FadeSlideIn delay={550}>
          <View style={s.weeklyCard}>
            <Text style={s.weeklyTag}>{"\u26A1"} WEEKLY CHALLENGE</Text>
            <Text style={s.weeklyTitle}>Top 5 this week wins</Text>
            <Text style={s.weeklyBadge}>
              Bonus badge: {"\uD83C\uDFC5"} Weekly Champion
            </Text>
            <View style={s.weeklyFooter}>
              <Text style={s.weeklyTimer}>Ends in: 2d 14h</Text>
              <Text style={s.weeklyClimb}>460 XP to climb {"\u2191"}</Text>
            </View>
          </View>
        </FadeSlideIn>
      </ScrollView>
    </View>
  );
}

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  headerTitle: TextStyle;
  tabRow: ViewStyle;
  tab: ViewStyle;
  tabActive: ViewStyle;
  tabText: TextStyle;
  tabTextActive: TextStyle;
  podium: ViewStyle;
  podiumPlace: ViewStyle;
  podiumAvatar: ViewStyle;
  podiumAvatarGold: ViewStyle;
  podiumEmoji: TextStyle;
  podiumEmojiGold: TextStyle;
  podiumName: TextStyle;
  podiumXp: TextStyle;
  podiumPedestal: ViewStyle;
  podiumPedestalGold: ViewStyle;
  podiumMedal: TextStyle;
  rankList: ViewStyle;
  rankRow: ViewStyle;
  rankRowYou: ViewStyle;
  rankNum: TextStyle;
  rankAvatar: ViewStyle;
  rankEmoji: TextStyle;
  rankInfo: ViewStyle;
  rankName: TextStyle;
  rankNameYou: TextStyle;
  rankSub: TextStyle;
  rankXp: TextStyle;
  weeklyCard: ViewStyle;
  weeklyTag: TextStyle;
  weeklyTitle: TextStyle;
  weeklyBadge: TextStyle;
  weeklyFooter: ViewStyle;
  weeklyTimer: TextStyle;
  weeklyClimb: TextStyle;
};

const s = StyleSheet.create<Styles>({
  container: { flex: 1, backgroundColor: "#060d1f" },

  /* Header */
  header: {
    paddingHorizontal: sw(20),
    paddingBottom: sw(14),
    backgroundColor: "rgba(6,13,31,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,200,255,0.2)",
  },
  headerTitle: {
    fontFamily: FONT_MONO,
    fontSize: sw(15),
    color: "#e8f4ff",
    fontWeight: "bold",
    letterSpacing: 2,
  },
  tabRow: {
    flexDirection: "row",
    marginTop: sw(12),
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.2)",
    borderRadius: sw(8),
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: sw(8),
    alignItems: "center",
    backgroundColor: "rgba(0,200,255,0.04)",
  },
  tabActive: {
    backgroundColor: "rgba(0,200,255,0.15)",
    borderColor: "#00c8ff",
  },
  tabText: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#8899aa",
    letterSpacing: 1,
  },
  tabTextActive: { color: "#00c8ff" },

  /* Podium */
  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingTop: sw(24),
    paddingBottom: sw(16),
    paddingHorizontal: sw(20),
  },
  podiumPlace: {
    alignItems: "center",
    width: sw(80),
  },
  podiumAvatar: {
    width: sw(48),
    height: sw(48),
    borderRadius: sw(24),
    backgroundColor: "rgba(0,200,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  podiumAvatarGold: {
    width: sw(56),
    height: sw(56),
    borderRadius: sw(28),
    borderColor: "#ffa827",
    backgroundColor: "rgba(255,168,39,0.12)",
  },
  podiumEmoji: { fontSize: sw(18) },
  podiumEmojiGold: { fontSize: sw(20) },
  podiumName: {
    fontSize: sw(11),
    color: "#e8f4ff",
    marginTop: sw(6),
  },
  podiumXp: {
    fontFamily: FONT_MONO,
    fontSize: sw(11),
    color: "#8899aa",
    marginTop: 2,
  },
  podiumPedestal: {
    width: sw(72),
    backgroundColor: "rgba(0,200,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.2)",
    borderTopLeftRadius: sw(6),
    borderTopRightRadius: sw(6),
    marginTop: sw(8),
    alignItems: "center",
    justifyContent: "center",
  },
  podiumPedestalGold: {
    backgroundColor: "rgba(255,168,39,0.1)",
    borderColor: "rgba(255,168,39,0.3)",
  },
  podiumMedal: { fontSize: sw(18) },

  /* Rank list */
  rankList: {
    paddingHorizontal: sw(20),
    gap: sw(8),
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,200,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.1)",
    borderRadius: sw(12),
    paddingVertical: sw(12),
    paddingHorizontal: sw(14),
  },
  rankRowYou: {
    borderColor: "#00c8ff",
    backgroundColor: "rgba(0,200,255,0.1)",
  },
  rankNum: {
    fontFamily: FONT_MONO,
    fontSize: sw(14),
    color: "#8899aa",
    width: sw(24),
  },
  rankAvatar: {
    width: sw(34),
    height: sw(34),
    borderRadius: sw(17),
    backgroundColor: "rgba(0,200,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: sw(8),
  },
  rankEmoji: { fontSize: sw(14) },
  rankInfo: { flex: 1, marginLeft: sw(12) },
  rankName: { fontSize: sw(13), color: "#e8f4ff" },
  rankNameYou: { color: "#00c8ff", fontWeight: "bold" },
  rankSub: { fontSize: sw(11), color: "#8899aa", marginTop: 1 },
  rankXp: {
    fontFamily: FONT_MONO,
    fontSize: sw(13),
    color: "#e8f4ff",
    fontWeight: "bold",
  },

  /* Weekly Challenge */
  weeklyCard: {
    marginHorizontal: sw(20),
    marginTop: sw(16),
    backgroundColor: "rgba(255,168,39,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,168,39,0.25)",
    borderRadius: sw(14),
    padding: sw(16),
  },
  weeklyTag: {
    fontFamily: FONT_MONO,
    fontSize: sw(10),
    color: "#ffa827",
    letterSpacing: 1,
  },
  weeklyTitle: {
    fontSize: sw(14),
    color: "#e8f4ff",
    fontWeight: "bold",
    marginTop: sw(6),
  },
  weeklyBadge: {
    fontSize: sw(13),
    color: "#e8f4ff",
    marginTop: sw(4),
  },
  weeklyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: sw(10),
  },
  weeklyTimer: {
    fontFamily: FONT_MONO,
    fontSize: sw(12),
    color: "#8899aa",
  },
  weeklyClimb: {
    fontFamily: FONT_MONO,
    fontSize: sw(11),
    color: "#00c8ff",
  },
});
