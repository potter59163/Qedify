import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { FadeSlideIn } from "@/components/fade-slide-in";
import { Icon } from "@/components/icon";
import { C, MONO } from "@/constants/theme";
import { CHAPTERS, MISSIONS, chapterText, missionText, missionsOf, type ChapterDef } from "@/lib/engine/catalog";
import { useL, useLang, type L } from "@/lib/i18n";
import { makeStyles, useLayout, useSw } from "@/lib/layout";
import { href, missionHref } from "@/lib/nav";
import { chapterProgress, currentChapter, isCleared, isUnlocked } from "@/lib/progress";
import { useGame } from "@/lib/store";
import { SR_ONLY } from "@/lib/a11y";
import { Text } from "@/lib/text";
import { Btn, Page, Screen, Stars, TabHeader } from "@/lib/ui";

function statusLine(L: L, ch: ChapterDef, p: ReturnType<typeof chapterProgress>): string {
  const head = `${L("CHAPTER", "บทที่")} 0${ch.id}`;
  if (!p.unlocked) return `${head} · ${L("LOCKED", "ล็อก")}${ch.id === 4 ? L(" · EXPERT", " · ระดับสูง") : ""}`;
  if (p.complete) return `${head} · ${L("COMPLETE", "ครบแล้ว")} ${p.done}/${p.total}`;
  return `${head} · ${p.done === 0 ? L("READY", "พร้อม") : L("IN PROGRESS", "กำลังเล่น")} ${p.done}/${p.total}`;
}

export default function Chapters() {
  const s = useStyles();
  const sw = useSw();
  const router = useRouter();
  const { width, bp } = useLayout();
  const { state } = useGame();
  const L = useL();
  const lang = useLang();
  const [open, setOpen] = useState<number | null>(currentChapter(state));
  // Two columns once there is room; each card then manages its own height.
  const twoCol = bp !== "phone" && width >= 980;

  return (
    <Screen>
      <TabHeader
        title={L("MISSION CHAPTERS", "บทของภารกิจ")}
        subtitle={L(`Choose your chapter · ${CHAPTERS.length} worlds · ${MISSIONS.length} missions`, `เลือกบท · ${CHAPTERS.length} บท · ${MISSIONS.length} ภารกิจ`)}
        width="wide"
      />
      <Page width="wide">
        <View style={[s.grid, twoCol && s.gridTwo]}>
          {CHAPTERS.map((ch, idx) => {
            const p = chapterProgress(state, ch.id);
            const expanded = open === ch.id && p.unlocked;
            const head = (
              <>
                <Text style={[s.status, { color: p.unlocked ? ch.color : C.muted }]}>{statusLine(L, ch, p)}</Text>
                <Text style={[s.title, !p.unlocked && { color: C.muted }]} role="heading" aria-level={2}>
                  {chapterText(ch, lang).title}
                </Text>
                <Text style={s.desc}>{chapterText(ch, lang).description}</Text>

                {p.unlocked ? (
                  <View style={s.dots}>
                    {missionsOf(ch.id).map((m, i) => {
                      const done = isCleared(state, m.id);
                      const ready = !done && isUnlocked(state, m.id);
                      return (
                        <View key={m.id} style={[s.dot, done ? s.dotDone : ready ? s.dotReady : s.dotLocked]}>
                          {done ? (
                            <Icon name="check" size={sw(15)} color={C.bg} />
                          ) : ready ? (
                            <Text style={s.dotNum}>{i + 1}</Text>
                          ) : (
                            <Icon name="lock" size={sw(12)} color={C.dim} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                ) : null}

                <View style={s.diffRow}>
                  <Text style={s.diffLabel}>{L("DIFFICULTY", "ความยาก")}</Text>
                  <View style={s.diffDots}>
                    {[1, 2, 3, 4].map((lv) => (
                      <View key={lv} style={[s.diffDot, { backgroundColor: lv <= ch.difficulty && p.unlocked ? ch.color : C.lock }]} />
                    ))}
                  </View>
                  {p.unlocked ? (
                    <View style={s.toggle}>
                      <Text style={s.toggleText}>{expanded ? L("HIDE", "ซ่อน") : L("MISSIONS", "ภารกิจ")}</Text>
                      <Icon name={expanded ? "chevron-up" : "chevron-down"} size={sw(14)} color={C.cyan} />
                    </View>
                  ) : null}
                </View>

                {!p.unlocked ? (
                  <View style={s.lock}>
                    <Icon name={ch.id === 4 ? "skull" : "lock"} size={sw(30)} color={ch.id === 4 ? C.red : C.muted} />
                  </View>
                ) : null}
              </>
            );
            // The list sits beside the header button, not inside it: nested buttons are invalid on the web.
            const list = expanded ? (
              <View style={s.list}>
                {missionsOf(ch.id).map((m) => {
                  const done = isCleared(state, m.id);
                  const ready = isUnlocked(state, m.id);
                  return (
                    <Pressable
                      key={m.id}
                      style={(st) => [s.row, !ready && { opacity: 0.5 }, ready && (st as { hovered?: boolean }).hovered && s.rowHover]}
                      disabled={!ready}
                      onPress={() => router.push(missionHref(state, m))}
                      accessibilityRole="button"
                    >
                      <View style={s.rowIcon}>
                        <Icon name={ready ? m.icon : "lock"} size={sw(19)} color={!ready ? C.dim : m.boss ? C.red : ch.color} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[s.rowTitle, m.boss && { color: C.red }]}>{missionText(m, lang).title}</Text>
                        <Text style={s.rowSub}>{missionText(m, lang).tagline}</Text>
                        {/* Named by its visible text; screen readers also hear the status. */}
                        {done || !ready ? <Text style={SR_ONLY}>{done ? L("cleared", "ผ่านแล้ว") : L("locked", "ล็อกอยู่")}</Text> : null}
                      </View>
                      {done ? (
                        <Stars count={state.records[m.id].stars} />
                      ) : ready ? (
                        <View style={s.play}>
                          <Text style={s.playText}>{L("PLAY", "เล่น")}</Text>
                          <Icon name="chevron-right" size={sw(14)} color={C.cyan} />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
                <Btn
                  label={L("CHAPTER BRIEFING", "สรุปบทเรียนของบท")}
                  icon="book"
                  tone="outline"
                  small
                  onPress={() => router.push(href(`/briefing/${ch.id}`))}
                  style={{ marginTop: 10 }}
                />
              </View>
            ) : null;

            return (
              <FadeSlideIn key={ch.id} delay={60 + idx * 70} style={twoCol ? s.cellTwo : s.cell}>
                {p.unlocked ? (
                  <LinearGradient
                    colors={p.complete ? ["rgba(0,200,255,0.15)", "rgba(91,69,224,0.15)"] : ["rgba(0,200,255,0.08)", "rgba(13,78,170,0.12)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[s.card, { borderColor: p.complete ? C.cyan : "rgba(0,200,255,0.3)" }]}
                  >
                    <Pressable
                      onPress={() => setOpen(expanded ? null : ch.id)}
                      accessibilityRole="button"
                      aria-expanded={expanded}
                    >
                      {head}
                    </Pressable>
                    {list}
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      s.card,
                      { backgroundColor: "rgba(10,22,40,0.5)", borderColor: ch.id === 4 ? "rgba(255,71,87,0.18)" : "rgba(100,120,150,0.2)" },
                    ]}
                    role="group"
                    accessibilityLabel={L(`${ch.title}, locked`, `${ch.th.title} ล็อกอยู่`)}
                  >
                    {head}
                  </View>
                )}
              </FadeSlideIn>
            );
          })}
        </View>
        <Text style={s.foot}>{L("Clear a mission to unlock the next one.", "ผ่านภารกิจหนึ่งเพื่อปลดล็อกภารกิจถัดไป")}</Text>
      </Page>
    </Screen>
  );
}

const useStyles = makeStyles((sw) => ({
  grid: { paddingTop: sw(20), gap: sw(14) },
  gridTwo: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" },
  cell: { width: "100%" },
  cellTwo: { flexGrow: 1, flexShrink: 1, flexBasis: "46%", minWidth: 0 },
  card: { borderRadius: sw(18), borderWidth: 1, overflow: "hidden", padding: sw(18) },
  status: { fontFamily: MONO, fontSize: sw(10.5), letterSpacing: 2 },
  title: { fontSize: sw(18), fontWeight: "bold", color: C.text, marginTop: sw(4) },
  desc: { fontSize: sw(12.5), color: C.muted, lineHeight: sw(19), marginTop: sw(4), paddingRight: sw(34) },
  dots: { flexDirection: "row", flexWrap: "wrap", gap: sw(6), marginTop: sw(12) },
  dot: { width: sw(30), height: sw(30), borderRadius: sw(15), alignItems: "center", justifyContent: "center" },
  dotDone: { backgroundColor: C.green },
  dotReady: { backgroundColor: "rgba(0,200,255,0.15)", borderWidth: 1, borderColor: "rgba(0,200,255,0.45)" },
  dotLocked: { backgroundColor: "rgba(100,120,150,0.1)", borderWidth: 1, borderColor: "rgba(100,120,150,0.2)" },
  dotNum: { fontSize: sw(12.5), fontWeight: "bold", color: C.cyan },
  diffRow: { flexDirection: "row", alignItems: "center", marginTop: sw(12), minHeight: sw(24) },
  diffLabel: { fontSize: sw(11), color: C.muted, marginRight: sw(8) },
  diffDots: { flexDirection: "row", gap: sw(3), flex: 1 },
  diffDot: { width: sw(10), height: sw(10), borderRadius: sw(5) },
  toggle: { flexDirection: "row", alignItems: "center", gap: 4 },
  toggleText: { fontFamily: MONO, fontSize: sw(10.5), color: C.cyan, letterSpacing: 1 },
  lock: { position: "absolute", right: 0, top: sw(2), opacity: 0.45 },
  list: { marginTop: sw(14), borderTopWidth: 1, borderTopColor: C.lineSoft, paddingTop: sw(6) },
  row: { flexDirection: "row", alignItems: "center", gap: sw(12), paddingVertical: sw(8), paddingHorizontal: sw(6), minHeight: sw(52), borderRadius: sw(10) },
  rowHover: { backgroundColor: "rgba(0,200,255,0.08)" },
  rowIcon: { width: sw(34), height: sw(34), borderRadius: sw(10), alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,200,255,0.08)" },
  rowTitle: { fontSize: sw(14.5), fontWeight: "600", color: C.text },
  rowSub: { fontSize: sw(11.5), color: C.muted, marginTop: 1 },
  play: { flexDirection: "row", alignItems: "center", gap: 2 },
  playText: { fontFamily: MONO, fontSize: sw(11), color: C.cyan, letterSpacing: 1 },
  foot: { fontSize: sw(11.5), color: C.dim, textAlign: "center", marginTop: sw(18) },
}));
