import { useState } from "react";
import { Pressable, View } from "react-native";

import { Avatar } from "@/components/art";
import { FadeSlideIn } from "@/components/fade-slide-in";
import { Icon } from "@/components/icon";
import { C, MONO } from "@/constants/theme";
import { useL, type L } from "@/lib/i18n";
import { makeStyles, tap, useSw } from "@/lib/layout";
import { leaderboard, msUntilWeekEnd, type RankRow } from "@/lib/progress";
import { useGame } from "@/lib/store";
import { Text } from "@/lib/text";
import { Card, Kicker, LiveText, Page, Screen, TabHeader } from "@/lib/ui";

const SCOPES = [
  { id: "all", label: ["ALL-TIME", "ตลอดกาล"] },
  { id: "week", label: ["THIS WEEK", "สัปดาห์นี้"] },
] as const;

const MEDAL = { 1: "#ffc24b", 2: "#c8d6e5", 3: "#d08a4e" } as const;

const xp = (n: number) => n.toLocaleString("en-US");

function weekLeft(L: L, now: Date): string {
  const left = msUntilWeekEnd(now);
  const d = Math.floor(left / 86_400_000);
  const h = Math.floor((left % 86_400_000) / 3_600_000);
  return L(`Week ends in: ${d}d ${h}h`, `สัปดาห์นี้จบใน: ${d} วัน ${h} ชม.`);
}

function Podium({ row, place }: { row: RankRow; place: 1 | 2 | 3 }) {
  const s = useStyles();
  const sw = useSw();
  const L = useL();
  const gold = place === 1;
  return (
    <View style={s.place} accessible role="img" accessibilityLabel={L(`Rank ${place}: ${row.isYou ? "you" : row.name}, ${xp(row.xp)} XP`, `อันดับ ${place}: ${row.isYou ? "คุณ" : row.name}, ${xp(row.xp)} XP`)}>
      <Avatar id={row.avatar} size={sw(gold ? 68 : 54)} ring={row.isYou || gold} />
      <Text style={[s.podName, row.isYou && { color: C.cyan }]} numberOfLines={1}>
        {row.isYou ? L("You", "คุณ") : row.name}
      </Text>
      <Text style={s.podXp}>{xp(row.xp)} XP</Text>
      <View style={[s.pedestal, gold && s.pedestalGold, { height: sw(place === 1 ? 64 : place === 2 ? 48 : 38) }]}>
        <Icon name="medal" size={sw(22)} color={MEDAL[place]} />
        <Text style={[s.pedestalNum, { color: MEDAL[place] }]}>{place}</Text>
      </View>
    </View>
  );
}

export default function Ranks() {
  const s = useStyles();
  const { state } = useGame();
  const L = useL();
  const [scope, setScope] = useState<(typeof SCOPES)[number]["id"]>("all");
  const rows = leaderboard(state, scope);
  const you = rows.find((r) => r.isYou)!;
  const above = rows[you.rank - 2];

  return (
    <Screen>
      <TabHeader title={L("MISSION CONTROL RANKS", "อันดับศูนย์ควบคุมภารกิจ")}>
        <View style={s.tabs} accessibilityRole="tablist">
          {SCOPES.map((t) => (
            <Pressable
              key={t.id}
              style={[s.tab, scope === t.id && s.tabOn]}
              onPress={() => setScope(t.id)}
              accessibilityRole="tab"
              aria-selected={scope === t.id}
            >
              <Text style={[s.tabText, scope === t.id && { color: C.cyan }]}>{L(t.label[0], t.label[1])}</Text>
            </Pressable>
          ))}
        </View>
      </TabHeader>

      <Page>
        <FadeSlideIn key={`p-${scope}`} delay={60} offsetY={30}>
          <View style={s.podium}>
            <Podium row={rows[1]} place={2} />
            <Podium row={rows[0]} place={1} />
            <Podium row={rows[2]} place={3} />
          </View>
        </FadeSlideIn>

        <View style={s.list}>
          {rows.slice(3).map((r, i) => (
            <FadeSlideIn key={`${scope}-${r.name}`} delay={140 + i * 40}>
              <View style={[s.row, r.isYou && s.rowYou]}>
                <Text style={s.rank}>{r.rank}</Text>
                <Avatar id={r.avatar} size={38} ring={r.isYou} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[s.name, r.isYou && { color: C.cyan }]} numberOfLines={1}>
                    {r.isYou ? L(`You · ${r.name}`, `คุณ · ${r.name}`) : r.name}
                  </Text>
                  <Text style={s.sub}>
                    {L("Chapter", "บทที่")} {r.chapter} ·{r.acc === null ? L("no data yet", "ยังไม่มีข้อมูล") : L(`${r.acc}% accuracy`, `แม่นยำ ${r.acc}%`)}
                  </Text>
                </View>
                <Text style={s.xp}>{xp(r.xp)}</Text>
              </View>
            </FadeSlideIn>
          ))}
        </View>

        <FadeSlideIn delay={420}>
          <Card tone="orange" style={s.weekly}>
            <Kicker icon="bolt" text={L("WEEKLY CHALLENGE", "ความท้าทายประจำสัปดาห์")} color={C.orange} />
            <Text style={s.weeklyTitle}>
              {you.rank === 1 ? L("You lead the squad. Hold the top spot.", "คุณนำทีมอยู่ รักษาอันดับหนึ่งไว้") : L(`You are #${you.rank}. Climb before the week resets.`, `คุณอยู่อันดับ #${you.rank} ไต่ขึ้นไปก่อนสัปดาห์จะรีเซ็ต`)}
            </Text>
            <View style={s.weeklyFoot}>
              <LiveText style={s.weeklyTimer} intervalMs={60_000} compute={(now) => weekLeft(L, now)} />
              {above ? <Text style={s.weeklyClimb}>{xp(above.xp - you.xp + 5)} {L("XP to climb", "XP เพื่อไต่อันดับ")}</Text> : null}
            </View>
          </Card>
          <View style={s.noteRow}>
            <Icon name="info" size={14} color={C.dim} />
            <Text style={s.note}>
              {L("Practice squad: the other cadets are simulated until online sync is connected. Your own XP and rank are real.", "ทีมฝึก: นักเรียนคนอื่นเป็นตัวจำลองจนกว่าจะเชื่อมระบบออนไลน์ ส่วน XP และอันดับของคุณเป็นของจริง")}
            </Text>
          </View>
        </FadeSlideIn>
      </Page>
    </Screen>
  );
}

const useStyles = makeStyles((sw) => ({
  tabs: { flexDirection: "row", gap: sw(8), marginTop: sw(12) },
  tab: { paddingHorizontal: sw(14), height: tap(sw), justifyContent: "center", borderRadius: sw(22), borderWidth: 1, borderColor: "transparent" },
  tabOn: { borderColor: C.cyan, backgroundColor: "rgba(0,200,255,0.12)" },
  tabText: { fontFamily: MONO, fontSize: sw(11), color: C.muted, letterSpacing: 1 },

  podium: { flexDirection: "row", justifyContent: "center", alignItems: "flex-end", gap: sw(14), paddingTop: sw(26) },
  place: { alignItems: "center", width: sw(104) },
  podName: { fontSize: sw(12.5), fontWeight: "600", color: C.text, marginTop: sw(6) },
  podXp: { fontFamily: MONO, fontSize: sw(10.5), color: C.cyan, marginTop: 1, marginBottom: sw(6) },
  pedestal: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "rgba(0,200,255,0.08)",
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: C.line,
    borderTopLeftRadius: sw(8),
    borderTopRightRadius: sw(8),
  },
  pedestalGold: { backgroundColor: "rgba(255,168,39,0.1)", borderColor: "rgba(255,168,39,0.4)" },
  pedestalNum: { fontFamily: MONO, fontSize: sw(15), fontWeight: "bold" },

  list: { marginTop: sw(18), gap: sw(8) },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: sw(12),
    backgroundColor: C.cardSoft,
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.12)",
    borderRadius: sw(12),
    paddingVertical: sw(9),
    paddingHorizontal: sw(14),
  },
  rowYou: { borderColor: C.cyan, backgroundColor: "rgba(0,200,255,0.12)" },
  rank: { fontFamily: MONO, fontSize: sw(14), color: C.muted, width: sw(24), textAlign: "center" },
  name: { fontSize: sw(14), fontWeight: "600", color: C.text },
  sub: { fontSize: sw(11.5), color: C.muted, marginTop: 1 },
  xp: { fontFamily: MONO, fontSize: sw(14), fontWeight: "bold", color: C.cyan },

  weekly: { marginTop: sw(20) },
  weeklyTitle: { fontSize: sw(15), fontWeight: "bold", color: C.text, marginTop: sw(8) },
  weeklyFoot: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: sw(8), marginTop: sw(10) },
  weeklyTimer: { fontFamily: MONO, fontSize: sw(11.5), color: C.muted },
  weeklyClimb: { fontFamily: MONO, fontSize: sw(11.5), color: C.green },
  noteRow: { flexDirection: "row", gap: sw(8), marginTop: sw(14), paddingHorizontal: sw(4) },
  note: { flex: 1, fontSize: sw(11.5), color: C.dim, lineHeight: sw(17) },
}));
