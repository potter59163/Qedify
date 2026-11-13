import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/icon";
import { SceneView } from "@/components/scene";
import { VectorInput, vectorScale } from "@/components/vector-input";
import { C, MONO } from "@/constants/theme";
import { useCountdown } from "@/hooks/use-countdown";
import { SR_ONLY, radioGroup } from "@/lib/a11y";
import { askCoach, coachFailureText } from "@/lib/ai";
import { U, fmt } from "@/lib/engine/build";
import { CHAPTERS, MISSIONS, SUPPORT, TIER_NAME, chapterText, missionById, missionText, tierName } from "@/lib/engine/catalog";
import { checkStep } from "@/lib/engine/check";
import { consequenceOf, type Consequence } from "@/lib/engine/consequence";
import { hashSeed, makeRng } from "@/lib/engine/rng";
import type { CheckResult, MissionDef, Step, StepInput, Tier } from "@/lib/engine/types";
import { useL, useLang, type Bi } from "@/lib/i18n";
import { makeStyles, tap, useLayout } from "@/lib/layout";
import { goBack, href } from "@/lib/nav";
import { dayKey, isCleared, isUnlocked, tierFor, type StepOutcome } from "@/lib/progress";
import { play } from "@/lib/sound";
import { useGame } from "@/lib/store";
import { Text } from "@/lib/text";
import { Btn, Card, Hearts, Kicker, NumberField, OptionCard, Overlay, Page, Screen, Split, TopBar, parseNum } from "@/lib/ui";

const ASSESS_LABEL: Record<Step["assess"], Bi> = {
  application: ["APPLICATION", "ประยุกต์ใช้"],
  analysis: ["ANALYSIS", "วิเคราะห์"],
  decision: ["DECISION", "ตัดสินใจ"],
};

/** Quantities with a direction: these answers can also be set by dragging a vector. */
const VECTOR_UNITS: string[] = [U.p, U.J, U.F, U.v];

/** Pre-render one page per mission so each has a real URL on static hosting. */
export function generateStaticParams() {
  return MISSIONS.map((m) => ({ id: m.id }));
}

type HintState = {
  level: number;
  text: string;
  ai: { status: "off" | "loading" | "done" | "failed"; text: string };
};

function describeInput(step: Step, input: StepInput): string {
  if (step.kind === "numeric" && input.kind === "numeric") return `${input.value} ${step.unit}`;
  if (step.kind === "choice" && input.kind === "choice") return step.options.find((o) => o.id === input.id)?.label ?? "";
  if (step.kind === "pair" && input.kind === "pair") {
    return `${input.a} ${step.a.unit} × ${input.b} ${step.b.unit} = ${fmt(input.a * input.b)} ${step.unit}`;
  }
  return "";
}

/**
 * The mission clock owns its own ticking state, so the rest of the mission
 * screen does not re-render every second.
 */
function MissionClock({ total, running, onExpire }: { total: number; running: boolean; onExpire: () => void }) {
  const s = useStyles();
  const L = useL();
  const { seconds, formatted } = useCountdown(total, running, onExpire);
  return (
    <Text style={[s.statVal, seconds <= 29 && { color: "#ff5555" }]} role="timer" accessibilityLabel={L(`${seconds} seconds left`, `เหลือ ${seconds} วินาที`)}>
      {formatted}
    </Text>
  );
}

export default function MissionRoute() {
  const { id, daily, review } = useLocalSearchParams<{ id: string; daily?: string; review?: string }>();
  const router = useRouter();
  const L = useL();
  const { state } = useGame();
  const [attempt, setAttempt] = useState(0);
  const def = missionById(id);

  if (!def || !isUnlocked(state, def.id)) {
    return (
      <Screen>
        <TopBar title={L("MISSION UNAVAILABLE", "ภารกิจนี้ยังเล่นไม่ได้")} onBack={() => goBack(router)} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 }}>
          <Icon name="lock" size={44} color={C.muted} />
          <Text style={{ fontSize: 15, color: C.muted, textAlign: "center" }}>
            {def
              ? L("Clear the previous mission to unlock this one.", "ผ่านภารกิจก่อนหน้าเพื่อปลดล็อกภารกิจนี้")
              : L("This mission does not exist.", "ไม่มีภารกิจนี้")}
          </Text>
          <Btn label={L("RETURN TO BASE", "กลับฐาน")} icon="home" onPress={() => router.replace(href("/home"))} style={{ alignSelf: "stretch", maxWidth: 360 }} />
        </View>
      </Screen>
    );
  }
  // A new key remounts the mission with fresh numbers.
  return (
    <MissionPlay
      key={`${def.id}:${attempt}`}
      def={def}
      daily={daily === "1"}
      // A retention check only makes sense for a mission that was cleared before.
      review={review === "1" && isCleared(state, def.id)}
      onRetry={() => setAttempt((a) => a + 1)}
    />
  );
}

function MissionPlay({ def, daily, review, onRetry }: { def: MissionDef; daily: boolean; review: boolean; onRetry: () => void }) {
  const s = useStyles();
  const router = useRouter();
  const L = useL();
  const lang = useLang();
  const { state, dispatch } = useGame();

  // Tier, language and numbers are fixed when the mission starts; mastery changes mid-run must not reshuffle it.
  const [run] = useState(() => {
    const tier: Tier = review ? 2 : tierFor(state, def);
    const seed = daily
      ? hashSeed(`${dayKey()}:${def.id}`)
      : ((Date.now() % 2147483647) ^ Math.floor(Math.random() * 2147483647)) >>> 0;
    return { tier, seed, lang, timer: state.settings.timer, inst: def.build(makeRng(seed), tier, lang), startedAt: Date.now() };
  });
  const { tier, inst, timer } = run;
  // A retention check removes every support: no hints, no scaffold, no vectors, no stall prompt.
  const support = review ? { ...SUPPORT[2], maxHints: 0, scaffoldAfter: 99, time: 1 } : SUPPORT[tier];
  const maxHints = support.maxHints;
  const total = inst.steps.length;
  const title = missionText(def, lang).title;

  const [idx, setIdx] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [outcomes, setOutcomes] = useState<StepOutcome[]>([]);
  const [wrong, setWrong] = useState(0);
  const [stepHints, setStepHints] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [stepStart, setStepStart] = useState(() => Date.now());
  const [lastTry, setLastTry] = useState(() => Date.now());
  const [text, setText] = useState("");
  const [textB, setTextB] = useState("");
  const [pick, setPick] = useState<string | null>(null);
  const [history, setHistory] = useState<{ answer: string; feedback: string }[]>([]);
  const [feedback, setFeedback] = useState<{ result: CheckResult; consequence: Consequence | null } | null>(null);
  const [hint, setHint] = useState<HintState | null>(null);
  const [lost, setLost] = useState<null | "hearts" | "time">(null);
  const [won, setWon] = useState(false);
  const [shake, setShake] = useState(0);
  // Stall prompt (paper A3.2): shown when nothing has been entered for a while.
  const [nudge, setNudge] = useState(false);
  const [stalls, setStalls] = useState(0);
  // Announced by screen readers when a step is solved; never shown.
  const [status, setStatus] = useState("");
  const aiRequest = useRef(0);
  // One column (phones, narrow windows): the brief is shortened, the mission data sits next to
  // the answer and the submit button is pinned, so nothing needed for answering scrolls away.
  const insets = useSafeAreaInsets();
  const { width, bp } = useLayout();
  const stacked = bp === "phone" || width < 900;
  const [storyOpen, setStoryOpen] = useState(false);
  const [vectorOpen, setVectorOpen] = useState(false);

  const step = inst.steps[idx];
  const paused = !!feedback || !!hint || !!lost || won;

  const outcomeNow = (solved: boolean, extraWrong = 0): StepOutcome => ({
    id: step.id,
    title: step.title,
    skill: step.skill,
    assess: step.assess,
    wrong: wrong + extraWrong,
    hints: stepHints,
    ms: Date.now() - stepStart,
    solved,
    stalls,
  });

  const finish = (wonNow: boolean, steps: StepOutcome[]) =>
    dispatch({
      type: "finish",
      input: { missionId: def.id, won: wonNow, tier, daily, review, seed: run.seed, ms: Date.now() - run.startedAt, maxHints, steps, total },
    });

  const lose = (kind: "hearts" | "time", extraWrong = 0) => {
    if (lost || won) return;
    aiRequest.current++;
    setFeedback(null);
    setHint(null);
    setLost(kind);
    play("lose");
    finish(false, [...outcomes, outcomeNow(false, extraWrong)]);
  };

  useEffect(() => {
    if (!won) return;
    const id = setTimeout(() => router.replace(href("/results")), 1900);
    return () => clearTimeout(id);
  }, [won, router]);

  // Any change to the answer restarts the stall timer.
  useEffect(() => {
    if (paused || review || nudge) return;
    const id = setTimeout(() => {
      setNudge(true);
      setStalls((n) => n + 1);
      play("hint");
    }, support.stallSeconds * 1000);
    return () => clearTimeout(id);
  }, [text, textB, pick, idx, paused, review, nudge, support.stallSeconds]);

  const a = parseNum(text);
  const b = parseNum(textB);
  const input: StepInput | null =
    step.kind === "numeric"
      ? Number.isFinite(a)
        ? { kind: "numeric", value: a }
        : null
      : step.kind === "choice"
        ? pick
          ? { kind: "choice", id: pick }
          : null
        : Number.isFinite(a) && Number.isFinite(b)
          ? { kind: "pair", a, b }
          : null;

  const submit = () => {
    if (!input || paused) return;
    const now = Date.now();
    const result = checkStep(step, input, run.lang);
    dispatch({
      type: "attempt",
      event: {
        ts: now,
        mission: def.id,
        step: step.id,
        skill: step.skill,
        assess: step.assess,
        ok: result.ok,
        mis: result.m?.id,
        ms: now - lastTry,
        hints: stepHints,
        tier,
        answer: describeInput(step, input),
        stalled: stalls > 0,
        review,
      },
    });
    setLastTry(now);
    setNudge(false);

    if (result.ok) {
      const done = [...outcomes, outcomeNow(true)];
      setOutcomes(done);
      if (idx + 1 >= total) {
        setWon(true);
        setStatus(L("Correct. Mission complete.", "ถูกต้อง ภารกิจสำเร็จ"));
        play("win");
        finish(true, done);
        return;
      }
      play("correct");
      setStatus(
        L(
          `Correct. Step ${idx + 2} of ${total}: ${inst.steps[idx + 1].title}.`,
          `ถูกต้อง ขั้นที่ ${idx + 2} จาก ${total}: ${inst.steps[idx + 1].title}`,
        ),
      );
      setIdx(idx + 1);
      setWrong(0);
      setStepHints(0);
      setStalls(0);
      setStepStart(now);
      setText("");
      setTextB("");
      setPick(null);
      setHistory([]);
      return;
    }

    play("wrong");
    setShake((k) => k + 1);
    setHistory((h) => [...h, { answer: describeInput(step, input), feedback: result.title }].slice(-3));
    setWrong(wrong + 1);
    setHearts(hearts - 1);
    if (hearts - 1 <= 0) lose("hearts", 1);
    else setFeedback({ result, consequence: consequenceOf(def.id, inst, step, input, run.lang) });
  };

  const openHint = () => {
    if (paused || hintsUsed >= maxHints) return;
    // The stall prompt already showed the first-level hint, so start one level up.
    const level = Math.min(stepHints + (stalls > 0 ? 1 : 0), step.hints.length - 1);
    const useAi = state.settings.ai;
    setHintsUsed(hintsUsed + 1);
    setStepHints(stepHints + 1);
    setNudge(false);
    play("hint");
    setHint({ level: level + 1, text: step.hints[level], ai: { status: useAi ? "loading" : "off", text: "" } });
    if (!useAi) return;

    const request = ++aiRequest.current;
    askCoach(
      "hint",
      {
        mission: def.title,
        chapter: CHAPTERS[def.chapter - 1].title,
        story: inst.story,
        givens: inst.givens,
        step: { title: step.title, question: step.prompt, formula: step.formula, answerType: step.kind },
        previousAttempts: history,
        hintLevel: level + 1,
        supportLevel: TIER_NAME[tier],
      },
      lang,
    ).then((reply) => {
      if (aiRequest.current !== request) return;
      setHint((h) =>
        h ? { ...h, ai: reply.ok ? { status: "done", text: reply.text } : { status: "failed", text: coachFailureText(reply.reason, lang) } } : h,
      );
    });
  };

  const closeHint = () => {
    aiRequest.current++;
    setHint(null);
  };

  const product = Number.isFinite(a) && Number.isFinite(b) ? a * b : null;
  const productOk =
    step.kind === "pair" &&
    product !== null &&
    Math.abs(product - step.target) <= step.tol &&
    a <= step.a.max &&
    b <= step.b.max;
  const showFormula = support.formula || wrong > 0;
  const showScaffold = wrong >= support.scaffoldAfter;
  const hintsLeft = maxHints - hintsUsed;
  const missionNo = MISSIONS.findIndex((m) => m.id === def.id) + 1;
  const vector = step.kind === "numeric" && VECTOR_UNITS.includes(step.unit) ? vectorScale(step.answer, run.seed + idx) : null;
  const submitLabel = won
    ? L("MISSION COMPLETE", "ภารกิจสำเร็จ")
    : step.kind === "pair"
      ? L("FIRE THRUSTERS", "จุดเครื่องยนต์")
      : step.kind === "choice"
        ? L("CONFIRM CHOICE", "ยืนยันตัวเลือก")
        : idx + 1 === total
          ? L("LOCK IN ANSWER", "ยืนยันคำตอบ")
          : L("SUBMIT ANSWER", "ส่งคำตอบ");

  const left = (
    <>
      <SceneView scene={inst.scene} vectors={support.vectors} phase={lost ? "failed" : won ? "after" : "before"} shake={shake} />

      <View style={s.brief}>
        <Kicker icon="clipboard" text={L("MISSION BRIEF", "ข้อมูลภารกิจ")} />
        <Text style={s.story} numberOfLines={stacked && !storyOpen ? 2 : undefined}>
          {inst.story}
        </Text>
        {stacked ? (
          <Pressable style={s.more} onPress={() => setStoryOpen(!storyOpen)} accessibilityRole="button" aria-expanded={storyOpen}>
            <Text style={s.moreText}>{storyOpen ? L("Show less", "ย่อ") : L("Read the full brief", "อ่านเรื่องทั้งหมด")}</Text>
          </Pressable>
        ) : (
          <View style={s.givens}>
            {inst.givens.map((g) => (
              <View key={g.label} style={s.given}>
                <Text style={s.givenLabel}>{g.label}</Text>
                <Text style={s.givenValue}>{g.value}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {outcomes.length > 0 ? (
        <Card tone="green" style={s.log}>
          <Kicker icon="check" text={L("MISSION LOG", "บันทึกภารกิจ")} color={C.green} />
          {outcomes.map((o, i) => (
            <Text key={o.id} style={s.logLine}>
              {inst.steps[i].explain}
            </Text>
          ))}
        </Card>
      ) : null}
    </>
  );

  const submitBtn = (
    <Btn
      label={submitLabel}
      icon={won ? "check" : step.kind === "pair" ? "rocket" : "bolt"}
      tone={won ? "primary" : "orange"}
      onPress={submit}
      disabled={!input || paused}
    />
  );

  const right = (
    <>
      <Text aria-live="polite" style={SR_ONLY}>
        {status}
      </Text>
      {won ? (
        <Card tone="green" style={s.wonCard}>
          <Icon name="sparkles" size={30} color={C.green} />
          <Text style={s.wonTitle}>{L("MISSION COMPLETE", "ภารกิจสำเร็จ")}</Text>
          <Text style={s.wonSub}>{L("Watch the outcome play out. Computing your results…", "ดูผลลัพธ์ที่เกิดขึ้น กำลังคำนวณผลของคุณ…")}</Text>
        </Card>
      ) : (
        <>
          <View style={s.stepHead}>
            <Text style={s.stepTitle} role="heading" aria-level={2}>
              {step.title}
            </Text>
            <View style={s.assess}>
              <Text style={s.assessText}>{L(...ASSESS_LABEL[step.assess])}</Text>
            </View>
          </View>
          <Text style={s.prompt}>{step.prompt}</Text>

          {stacked ? (
            <View style={s.chips} role="list" aria-label={L("Mission data", "ข้อมูลโจทย์")}>
              {inst.givens.map((g) => (
                <View key={g.label} style={s.chip} role="listitem">
                  <Text style={s.chipLabel}>{g.label}</Text>
                  <Text style={s.chipValue}>{g.value}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {step.kind === "numeric" ? (
            <>
              <NumberField
                label={L(
                  `YOUR ANSWER: ${step.label}${step.signed ? "  (+ or −)" : ""}`,
                  `คำตอบของคุณ: ${step.label}${step.signed ? "  (+ หรือ −)" : ""}`,
                )}
                value={text}
                onChangeText={setText}
                unit={step.unit}
                onSubmit={submit}
                style={{ marginTop: 12 }}
              />
              {vector && stacked ? (
                <Btn
                  label={vectorOpen ? L("HIDE THE VECTOR", "ซ่อนตัวลากเวกเตอร์") : L("OR DRAG A VECTOR", "หรือลากเวกเตอร์")}
                  icon="arrows"
                  tone="quiet"
                  small
                  onPress={() => setVectorOpen(!vectorOpen)}
                  style={{ alignSelf: "flex-start" }}
                />
              ) : null}
              {vector && (!stacked || vectorOpen) ? (
                <VectorInput
                  value={a}
                  onChange={(v) => setText(String(v))}
                  max={vector.max}
                  step={vector.step}
                  signed={step.signed}
                  unit={step.unit}
                />
              ) : null}
            </>
          ) : null}

          {step.kind === "choice" ? (
            <View style={s.options} {...radioGroup(step.prompt)}>
              {step.options.map((o) => (
                <OptionCard
                  key={o.id}
                  icon={o.icon}
                  label={o.label}
                  detail={o.detail}
                  selected={pick === o.id}
                  onPress={() => {
                    play("tap");
                    setPick(o.id);
                  }}
                />
              ))}
            </View>
          ) : null}

          {step.kind === "pair" ? (
            <>
              <View style={s.pairRow}>
                <NumberField
                  label={L(`${step.a.label} (max ${fmt(step.a.max)})`, `${step.a.label} (สูงสุด ${fmt(step.a.max)})`)}
                  value={text}
                  onChangeText={setText}
                  unit={step.a.unit}
                  style={{ flex: 1 }}
                />
                <Text style={s.op}>×</Text>
                <NumberField
                  label={L(`${step.b.label} (max ${fmt(step.b.max)})`, `${step.b.label} (สูงสุด ${fmt(step.b.max)})`)}
                  value={textB}
                  onChangeText={setTextB}
                  unit={step.b.unit}
                  onSubmit={submit}
                  style={{ flex: 1 }}
                />
              </View>
              <View style={[s.product, productOk && s.productOk]}>
                <Text style={s.productLabel}>{L("= IMPULSE", "= การดล")}</Text>
                <Text style={[s.productVal, { color: productOk ? C.green : C.orange }]}>
                  {product === null ? "—" : fmt(product)} <Text style={s.productUnit}>{step.unit}</Text>
                </Text>
              </View>
            </>
          ) : null}

          {/* The region is always present, so a screen reader announces the prompt when it appears. */}
          <View aria-live="polite">
            {nudge ? (
              <Card tone="cyan" style={s.nudge}>
                <Kicker icon="bulb" text={L("STUCK? START HERE", "ติดอยู่หรือเปล่า เริ่มจากตรงนี้")} />
                <Text style={s.nudgeText}>{step.hints[0]}</Text>
                <Btn label={L("OK", "ตกลง")} tone="quiet" small onPress={() => setNudge(false)} style={{ alignSelf: "flex-end" }} />
              </Card>
            ) : null}
          </View>

          <View style={s.hintRow}>
            <Btn
              label={L(`HINT (${hintsLeft} left)`, `คำใบ้ (เหลือ ${hintsLeft})`)}
              icon="bulb"
              tone="outline"
              small
              disabled={hintsLeft <= 0}
              onPress={openHint}
            />
            <Text style={s.formula} numberOfLines={2}>
              {review
                ? L("retention check · no support", "ทบทวนความจำ · ไม่มีตัวช่วย")
                : showFormula
                  ? step.formula
                  : L("formula hidden · expert", "ซ่อนสูตร · ระดับเชี่ยวชาญ")}
            </Text>
          </View>

          {showScaffold ? (
            <Card tone="purple" style={{ marginBottom: 14 }}>
              <Kicker icon="clipboard" text={L("STEP-BY-STEP SCAFFOLD", "ขั้นตอนช่วยคิด")} color={C.purple} style={{ marginBottom: 8 }} />
              {step.scaffold.map((line) => (
                <Text key={line} style={s.scaffoldLine}>
                  {line}
                </Text>
              ))}
            </Card>
          ) : null}
        </>
      )}

      {stacked ? null : submitBtn}
    </>
  );

  return (
    <Screen>
      <TopBar
        title={`${title.toUpperCase()} · ${L("MISSION", "ภารกิจ")} ${missionNo}`}
        subtitle={`${L("Chapter", "บทที่")} ${def.chapter} · ${chapterText(CHAPTERS[def.chapter - 1], lang).title}`}
        onBack={() => goBack(router)}
        width="wide"
        right={
          <View style={[s.tier, (tier === 2 || review) && { borderColor: C.orange }]}>
            <Text style={[s.tierText, (tier === 2 || review) && { color: C.orange }]}>
              {review ? L("RETENTION CHECK", "ทบทวนความจำ") : `${daily ? L("DAILY · ", "ประจำวัน · ") : ""}${L("SUPPORT", "ระดับ")}: ${tierName(tier, lang)}`}
            </Text>
          </View>
        }
      />

      <View style={s.statsBar}>
        <View style={s.stats}>
          <View style={s.stat}>
            <Text style={s.statLabel}>{L("TIME", "เวลา")}</Text>
            {timer === "off" ? (
              <Text style={s.statVal} accessibilityLabel={L("No time limit", "ไม่จับเวลา")}>
                ∞
              </Text>
            ) : (
              <MissionClock
                total={Math.round(def.baseTime * support.time * (timer === "double" ? 2 : 1))}
                running={!paused}
                onExpire={() => lose("time")}
              />
            )}
          </View>
          <View style={s.stat}>
            <Text style={s.statLabel}>{L("STEP", "ขั้น")}</Text>
            <Text style={s.statVal}>
              {Math.min(idx + 1, total)}/{total}
            </Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statLabel}>{L("HEARTS", "หัวใจ")}</Text>
            <View style={{ marginTop: 3 }}>
              <Hearts left={hearts} />
            </View>
          </View>
        </View>
      </View>

      <Page width="wide">
        <View style={{ height: 16 }} />
        <Split left={left} right={right} gap={28} />
      </Page>

      {stacked ? <View style={[s.submitBar, { paddingBottom: insets.bottom + 10 }]}>{submitBtn}</View> : null}

      <Overlay
        visible={!!feedback}
        icon={feedback?.result.near ? "target" : "x"}
        title={feedback?.result.title ?? ""}
        tone="orange"
        onClose={() => setFeedback(null)}
      >
        {feedback?.consequence ? (
          <View style={s.consequence}>
            <Kicker icon="play" text={L("WHAT YOUR ANSWER DOES", "ผลของคำตอบนี้")} color={C.orange} style={{ marginBottom: 8 }} />
            {feedback.consequence.v ? (
              <SceneView
                key={wrong}
                scene={inst.scene}
                vectors
                phase="after"
                shake={0}
                outcome={{ v: feedback.consequence.v, merged: feedback.consequence.merged }}
                values={!feedback.consequence.hideValues}
                tag={L("YOUR ANSWER", "คำตอบของคุณ")}
                compact
              />
            ) : null}
            <Text style={s.consequenceText}>{feedback.consequence.text}</Text>
          </View>
        ) : null}
        {feedback?.result.body ? <Text style={s.feedbackBody}>{feedback.result.body}</Text> : null}
        <View style={s.heartsLeft}>
          <Text style={s.heartsLeftText}>{L("Hearts remaining:", "หัวใจที่เหลือ:")}</Text>
          <Hearts left={hearts} />
        </View>
        <Btn label={L("TRY AGAIN", "ลองอีกครั้ง")} tone="outline" small onPress={() => setFeedback(null)} style={{ alignSelf: "stretch" }} />
      </Overlay>

      <Overlay
        visible={!!hint}
        icon="bulb"
        title={L(`HINT ${hint?.level ?? 1} OF 3`, `คำใบ้ ${hint?.level ?? 1} จาก 3`)}
        tone="cyan"
        onClose={closeHint}
      >
        <Text style={s.hintBody}>{hint?.text}</Text>
        {hint && hint.ai.status !== "off" ? (
          <View style={s.aiBox}>
            <Kicker icon="robot" text={L("AI COACH", "โค้ช AI")} color={C.purple} style={{ marginBottom: 5 }} />
            <Text aria-live="polite" style={[s.aiText, hint.ai.status !== "done" && { color: C.muted }]}>
              {hint.ai.status === "loading" ? L("Thinking about your attempt…", "กำลังคิดจากคำตอบของคุณ…") : hint.ai.text}
            </Text>
          </View>
        ) : null}
        <Btn label={L("GOT IT", "เข้าใจแล้ว")} iconRight="arrow-right" tone="outline" small onPress={closeHint} style={{ alignSelf: "stretch" }} />
      </Overlay>

      <Overlay
        visible={!!lost}
        icon={lost === "time" ? "clock" : "heart"}
        title={L("MISSION FAILED", "ภารกิจล้มเหลว")}
        tone="red"
        body={L(
          `${lost === "time" ? "Time's up. The crew could not be reached." : "You ran out of hearts."}\n\nHow this step is solved:\n${step.explain}`,
          `${lost === "time" ? "หมดเวลา ไปไม่ถึงลูกเรือ" : "หัวใจหมดแล้ว"}\n\nวิธีแก้ขั้นนี้:\n${step.explain}`,
        )}
      >
        <Text style={[s.heartsLeftText, { marginBottom: 14 }]}>{L("A retry uses new numbers.", "เล่นใหม่จะได้ตัวเลขชุดใหม่")}</Text>
        <View style={{ alignSelf: "stretch", gap: 8 }}>
          <Btn label={L("TRY AGAIN", "ลองอีกครั้ง")} icon="refresh" tone="orange" small onPress={onRetry} />
          <Btn
            label={L("REVIEW BRIEFING", "ทบทวนบทเรียน")}
            icon="book"
            tone="outline"
            small
            onPress={() => router.replace(href(`/briefing/${def.chapter}?next=${def.id}`))}
          />
          <Btn label={L("RETURN TO BASE", "กลับฐาน")} tone="quiet" small onPress={() => router.replace(href("/home"))} />
        </View>
      </Overlay>
    </Screen>
  );
}

const useStyles = makeStyles((sw) => ({
  tier: { borderWidth: 1, borderColor: C.cyan, borderRadius: sw(8), paddingHorizontal: sw(8), paddingVertical: sw(4) },
  tierText: { fontFamily: MONO, fontSize: sw(9.5), color: C.cyan, letterSpacing: 1 },

  statsBar: { backgroundColor: C.panel, borderBottomWidth: 1, borderBottomColor: C.lineSoft, alignItems: "center" },
  stats: { flexDirection: "row", width: "100%", maxWidth: 560, paddingVertical: sw(8) },
  stat: { flex: 1, alignItems: "center" },
  statLabel: { fontFamily: MONO, fontSize: sw(9.5), color: C.muted, letterSpacing: 1 },
  statVal: { fontFamily: MONO, fontSize: sw(15), color: C.text, fontWeight: "bold", marginTop: 1 },

  brief: {
    backgroundColor: "rgba(0,200,255,0.06)",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: sw(12),
    padding: sw(13),
    marginTop: sw(14),
  },
  story: { fontSize: sw(13.5), color: C.muted, lineHeight: sw(21), marginTop: sw(6) },
  givens: { marginTop: sw(10), borderTopWidth: 1, borderTopColor: C.lineSoft, paddingTop: sw(8), gap: sw(5) },
  given: { flexDirection: "row", justifyContent: "space-between", gap: sw(10) },
  givenLabel: { fontSize: sw(12.5), color: C.muted, flexShrink: 0 },
  givenValue: { fontFamily: MONO, fontSize: sw(12.5), color: C.text, textAlign: "right", flexShrink: 1 },

  more: { minHeight: tap(sw), justifyContent: "center", alignSelf: "flex-start" },
  moreText: { fontSize: sw(12.5), color: C.cyan },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: sw(6), marginTop: sw(10) },
  chip: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: sw(6),
    backgroundColor: "rgba(0,200,255,0.06)",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: sw(8),
    paddingHorizontal: sw(8),
    paddingVertical: sw(5),
  },
  chipLabel: { fontSize: sw(12), color: C.muted },
  chipValue: { fontFamily: MONO, fontSize: sw(12.5), color: C.text, fontWeight: "bold" },
  submitBar: {
    backgroundColor: C.panel,
    borderTopWidth: 1,
    borderTopColor: C.line,
    paddingHorizontal: sw(20),
    paddingTop: sw(10),
  },

  log: { marginTop: sw(12), paddingVertical: sw(11) },
  logLine: { fontFamily: MONO, fontSize: sw(12), color: C.text, lineHeight: sw(20), marginTop: sw(4) },

  wonCard: { marginTop: sw(18), marginBottom: sw(14), alignItems: "center", gap: sw(6) },
  wonTitle: { fontFamily: MONO, fontSize: sw(15), fontWeight: "bold", color: C.green, letterSpacing: 2 },
  wonSub: { fontSize: sw(12.5), color: C.muted, textAlign: "center" },

  stepHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: sw(18), gap: sw(8) },
  stepTitle: { fontFamily: MONO, fontSize: sw(12.5), color: C.orange, letterSpacing: 2, flexShrink: 1 },
  assess: { borderWidth: 1, borderColor: "rgba(167,139,250,0.5)", borderRadius: sw(6), paddingHorizontal: sw(6), paddingVertical: sw(2) },
  assessText: { fontFamily: MONO, fontSize: sw(8.5), color: C.purple, letterSpacing: 1 },
  prompt: { fontSize: sw(16), color: C.text, lineHeight: sw(23), marginTop: sw(6), fontWeight: "600" },

  options: { gap: sw(8), marginTop: sw(12) },
  pairRow: { flexDirection: "row", alignItems: "flex-end", gap: sw(8), marginTop: sw(12) },
  op: { fontFamily: MONO, fontSize: sw(18), color: C.muted, marginBottom: sw(13) },
  product: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: sw(8),
    borderWidth: 1,
    borderColor: "rgba(255,168,39,0.3)",
    backgroundColor: "rgba(255,168,39,0.06)",
    borderRadius: sw(10),
    paddingHorizontal: sw(12),
    height: sw(46),
  },
  productOk: { borderColor: "rgba(0,255,159,0.4)", backgroundColor: "rgba(0,255,159,0.06)" },
  productLabel: { fontFamily: MONO, fontSize: sw(10), color: C.muted, letterSpacing: 1 },
  productVal: { fontFamily: MONO, fontSize: sw(16), fontWeight: "bold" },
  productUnit: { fontSize: sw(10), fontWeight: "normal" },

  nudge: { marginTop: sw(12), paddingVertical: sw(11), gap: sw(6) },
  nudgeText: { fontSize: sw(13), color: C.text, lineHeight: sw(20) },

  hintRow: { flexDirection: "row", alignItems: "center", gap: sw(12), marginVertical: sw(14) },
  formula: { flex: 1, fontFamily: MONO, fontSize: sw(12), color: C.text, lineHeight: sw(18) },
  scaffoldLine: { fontFamily: MONO, fontSize: sw(12.5), color: C.lilac, lineHeight: sw(21) },

  consequence: { alignSelf: "stretch", marginBottom: sw(12) },
  consequenceText: { fontSize: sw(13), color: C.orange, lineHeight: sw(20), marginTop: sw(8) },
  feedbackBody: {
    fontFamily: MONO,
    fontSize: sw(12.5),
    color: C.text,
    lineHeight: sw(20),
    textAlign: "center",
    marginBottom: sw(14),
    alignSelf: "stretch",
  },
  heartsLeft: { flexDirection: "row", alignItems: "center", gap: sw(8), marginBottom: sw(14) },
  heartsLeftText: { fontFamily: MONO, fontSize: sw(11.5), color: C.muted },
  hintBody: { fontFamily: MONO, fontSize: sw(13), color: C.text, lineHeight: sw(21), alignSelf: "stretch", marginBottom: sw(14) },
  aiBox: {
    alignSelf: "stretch",
    backgroundColor: "rgba(91,69,224,0.12)",
    borderWidth: 1,
    borderColor: "rgba(91,69,224,0.35)",
    borderRadius: sw(10),
    padding: sw(12),
    marginBottom: sw(14),
  },
  aiText: { fontSize: sw(13), color: C.text, lineHeight: sw(20) },
}));
