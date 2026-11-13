import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/icon";
import { Slider } from "@/components/slider";
import { C, MONO } from "@/constants/theme";
import { radioGroup } from "@/lib/a11y";
import { briefingFor } from "@/lib/briefings";
import { fmt } from "@/lib/engine/build";
import { CHAPTERS, missionById, missionText, missionsOf } from "@/lib/engine/catalog";
import { useL, useLang } from "@/lib/i18n";
import { makeStyles } from "@/lib/layout";
import { goBack, href } from "@/lib/nav";
import { isCleared, isUnlocked } from "@/lib/progress";
import { useGame } from "@/lib/store";
import { Text } from "@/lib/text";
import { Btn, Card, Page, Screen, TopBar } from "@/lib/ui";

/** Pre-render one page per chapter so each has a real URL on static hosting. */
export function generateStaticParams() {
  return CHAPTERS.map((c) => ({ chapter: String(c.id) }));
}

export default function BriefingScreen() {
  const s = useStyles();
  const router = useRouter();
  const { chapter, next, daily } = useLocalSearchParams<{ chapter: string; next?: string; daily?: string }>();
  const { state, dispatch } = useGame();
  const L = useL();
  const lang = useLang();
  const [pick, setPick] = useState<number | null>(null);
  const [m, setM] = useState(600);
  const [v, setV] = useState(8);

  const b = briefingFor(Number(chapter), lang);
  if (!b) {
    return (
      <Screen>
        <TopBar title={L("BRIEFING NOT FOUND", "ไม่พบบทเรียนนี้")} onBack={() => goBack(router)} />
      </Screen>
    );
  }

  const passed = pick === b.quiz.correct;
  const list = missionsOf(b.chapter);
  const target =
    (next && missionById(next)) || list.find((x) => isUnlocked(state, x.id) && !isCleared(state, x.id)) || list[0];
  const canPlay = isUnlocked(state, target.id);

  const proceed = () => {
    dispatch({ type: "briefing", chapter: b.chapter });
    if (canPlay) router.replace(href(`/mission/${target.id}${daily === "1" ? "?daily=1" : ""}`));
    else goBack(router);
  };

  return (
    <Screen>
      <TopBar
        title={L("PRE-MISSION BRIEFING", "บทเรียนก่อนภารกิจ")}
        subtitle={b.title}
        onBack={() => goBack(router)}
        right={
          <View style={s.pill}>
            <Text style={s.pillText}>{L("CH", "บท")} {b.chapter} / {CHAPTERS.length}</Text>
          </View>
        }
      />
      <View style={s.progressBg}>
        <LinearGradient
          colors={[C.cyan, C.teal]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[s.progressFill, { width: `${(b.chapter / CHAPTERS.length) * 100}%` }]}
        />
      </View>

      <Page>
        <View style={s.scroll}>
        <Card tone="orange">
          <Text style={[s.cardTitle, { color: C.orange }]}>{b.hook.title}</Text>
          <Text style={s.body}>{b.hook.body}</Text>
        </Card>

        {b.cards.map((c) => (
          <Card key={c.title} tone="solid">
            <Text style={s.cardTitle}>{c.title}</Text>
            {c.formula ? (
              <View style={s.formulaBox}>
                <Text style={s.formula}>{c.formula}</Text>
                {c.note ? <Text style={s.formulaNote}>{c.note}</Text> : null}
              </View>
            ) : null}
            <Text style={[s.body, { marginTop: 12 }]}>{c.body}</Text>
          </Card>
        ))}

        {b.sliders ? (
          <Card tone="solid">
            <Text style={s.cardTitle}>{L("TRY IT YOURSELF", "ลองด้วยตัวเอง")}</Text>
            <View style={s.tryBox}>
              <Slider label="m" unit="kg" color={C.cyan} min={100} max={1000} step={10} value={m} onChange={setM} />
              <Slider label="v" unit="m/s" color={C.teal} min={1} max={20} step={1} value={v} onChange={setV} />
              <View style={s.momentum}>
                <Text style={s.momentumLabel}>p = m × v =</Text>
                <Text style={s.momentumVal}>
                  {fmt(m * v)} <Text style={s.momentumUnit}>kg·m/s</Text>
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        <Card tone="solid">
          <Text style={s.cardTitle}>{L("WORKED EXAMPLE", "ตัวอย่างพร้อมวิธีทำ")}</Text>
          <Text style={s.body}>{b.example.problem}</Text>
          <View style={s.steps}>
            {b.example.steps.map((line, i) => (
              <Text key={i} style={s.stepLine}>
                {i + 1}▸ {line}
              </Text>
            ))}
          </View>
        </Card>

        <View style={s.tip}>
          <Icon name="bulb" size={20} color={C.orange} />
          <Text style={s.tipText}>
            <Text style={s.tipBold}>{L("Remember: ", "ข้อควรจำ: ")}</Text>
            {b.tip}
          </Text>
        </View>

        <Card tone="solid">
          <Text style={s.cardTitle}>{L("MISSION CHECK", "ตรวจความเข้าใจ")}</Text>
          <Text style={s.question}>{b.quiz.question}</Text>
          <View style={{ gap: 10 }} {...radioGroup(b.quiz.question)}>
            {b.quiz.options.map((opt, i) => {
              const answered = pick !== null;
              const mine = pick === i;
              const right = i === b.quiz.correct;
              const color = !answered ? C.text : mine && right ? C.green : mine ? C.red : C.text;
              return (
                <Pressable
                  key={opt}
                  disabled={passed}
                  onPress={() => setPick(i)}
                  style={[
                    s.option,
                    mine && right && { borderColor: C.green, backgroundColor: "rgba(0,255,159,0.12)" },
                    mine && !right && { borderColor: C.red, backgroundColor: "rgba(255,71,87,0.12)" },
                  ]}
                  accessibilityRole="radio"
                  aria-checked={mine}
                >
                  <View style={[s.letter, { borderColor: color === C.text ? C.line : color }]}>
                    <Text style={[s.letterText, { color }]}>{"ABCD"[i]}</Text>
                  </View>
                  <Text style={[s.optionText, { color }]}>{opt}</Text>
                  {mine ? <Icon name={right ? "check" : "x"} size={18} color={color} /> : null}
                </Pressable>
              );
            })}
          </View>
          <View aria-live="polite">
            {pick !== null ? (
              <Text style={[s.verdict, { color: passed ? C.green : C.orange }]}>{passed ? b.quiz.right : b.quiz.wrong}</Text>
            ) : null}
          </View>
        </Card>

        <Btn
          label={!passed ? L("ANSWER THE CHECK TO CONTINUE", "ตอบคำถามเพื่อไปต่อ") : canPlay ? `${L("START", "เริ่ม")}: ${missionText(target, lang).title.toUpperCase()}` : L("BRIEFING COMPLETE", "จบบทเรียน")}
          iconRight={passed ? (canPlay ? "arrow-right" : "check") : undefined}
          tone={canPlay ? "orange" : "primary"}
          disabled={!passed}
          onPress={proceed}
        />
        </View>
      </Page>
    </Screen>
  );
}

const useStyles = makeStyles((sw) => ({
  pill: { borderWidth: 1, borderColor: C.cyan, borderRadius: sw(20), paddingHorizontal: sw(12), paddingVertical: sw(5) },
  pillText: { fontFamily: MONO, fontSize: sw(11), color: C.cyan, letterSpacing: 1 },
  progressBg: { height: sw(4), backgroundColor: "rgba(0,200,255,0.15)" },
  progressFill: { height: sw(4) },
  scroll: { paddingTop: sw(20), gap: sw(16) },
  cardTitle: { fontFamily: MONO, fontSize: sw(12), color: C.cyan, letterSpacing: 2, marginBottom: sw(10) },
  body: { fontSize: sw(13), color: C.muted, lineHeight: sw(21) },
  formulaBox: {
    backgroundColor: "rgba(0,200,255,0.06)",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: sw(12),
    padding: sw(15),
    alignItems: "center",
    gap: sw(6),
  },
  formula: { fontFamily: MONO, fontSize: sw(17), color: C.cyanBright, textAlign: "center", letterSpacing: 1, lineHeight: sw(26) },
  formulaNote: { fontSize: sw(11), color: C.muted, textAlign: "center" },
  tryBox: {
    backgroundColor: "rgba(5,10,25,0.9)",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: sw(12),
    padding: sw(14),
    gap: sw(6),
  },
  momentum: {
    backgroundColor: "rgba(0,200,255,0.08)",
    borderRadius: sw(8),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: sw(14),
    paddingVertical: sw(10),
    marginTop: sw(4),
  },
  momentumLabel: { fontFamily: MONO, fontSize: sw(11), color: C.muted },
  momentumVal: { fontFamily: MONO, fontSize: sw(18), color: C.cyanBright, fontWeight: "bold" },
  momentumUnit: { fontSize: sw(11), color: C.muted, fontWeight: "normal" },
  steps: { marginTop: sw(10), gap: sw(4) },
  stepLine: { fontFamily: MONO, fontSize: sw(11.5), color: C.text, lineHeight: sw(19) },
  tip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: sw(10),
    backgroundColor: "rgba(255,168,39,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,168,39,0.2)",
    borderRadius: sw(10),
    padding: sw(13),
  },
  tipText: { flex: 1, fontSize: sw(12), color: "rgba(232,244,255,0.8)", lineHeight: sw(19) },
  tipBold: { fontWeight: "bold", color: C.orange },
  question: { fontSize: sw(14), color: C.text, lineHeight: sw(22), marginBottom: sw(14) },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: sw(10),
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: "rgba(10,22,40,0.8)",
    borderRadius: sw(12),
    paddingVertical: sw(12),
    paddingHorizontal: sw(14),
    minHeight: sw(48),
  },
  letter: { width: sw(26), height: sw(26), borderRadius: sw(13), borderWidth: 1, alignItems: "center", justifyContent: "center" },
  letterText: { fontFamily: MONO, fontSize: sw(12), fontWeight: "bold" },
  optionText: { flex: 1, fontSize: sw(14) },
  verdict: { fontSize: sw(12.5), marginTop: sw(12), lineHeight: sw(19) },
}));
