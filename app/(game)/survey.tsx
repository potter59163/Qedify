import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { Icon } from "@/components/icon";
import { C, MONO } from "@/constants/theme";
import { radioGroup } from "@/lib/a11y";
import { useL } from "@/lib/i18n";
import { makeStyles, tap } from "@/lib/layout";
import { goBack } from "@/lib/nav";
import type { SurveyRole } from "@/lib/progress";
import { play } from "@/lib/sound";
import { useGame } from "@/lib/store";
import { LIKERT, SURVEY } from "@/lib/survey";
import { Text } from "@/lib/text";
import { Btn, Card, Page, Screen, SectionLabel, TopBar } from "@/lib/ui";

/**
 * User-satisfaction questionnaire (paper D5). The answers stay on the device
 * and travel with the exported data file; nothing is sent anywhere.
 */
export default function Survey() {
  const s = useStyles();
  const router = useRouter();
  const L = useL();
  const { dispatch } = useGame();
  const [role, setRole] = useState<SurveyRole>("student");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);

  const items = SURVEY[role];
  const complete = items.every((it) => answers[it.id]);
  const groups = [...new Set(items.map((it) => it.group))];

  const submit = () => {
    if (!complete) return;
    dispatch({
      type: "survey",
      response: {
        ts: Date.now(),
        role,
        answers: Object.fromEntries(items.map((it) => [it.id, answers[it.id]])),
        comment: comment.trim().slice(0, 600),
      },
    });
    play("correct");
    setDone(true);
  };

  if (done) {
    return (
      <Screen>
        <TopBar title={L("SURVEY", "แบบสอบถาม")} onBack={() => goBack(router)} />
        <View style={s.thanks}>
          <Icon name="check" size={46} color={C.green} />
          <Text style={s.thanksTitle}>{L("THANK YOU", "ขอบคุณ")}</Text>
          <Text style={s.thanksText}>
            {L(
              "Your answers are saved on this device. They are included when you export your learning data in Settings.",
              "คำตอบของคุณถูกบันทึกไว้ในอุปกรณ์นี้ และจะรวมอยู่ในไฟล์เมื่อคุณส่งออกข้อมูลการเรียนรู้จากหน้าตั้งค่า",
            )}
          </Text>
          <Btn label={L("DONE", "เสร็จสิ้น")} onPress={() => goBack(router)} style={{ alignSelf: "stretch", maxWidth: 360 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title={L("SURVEY", "แบบสอบถาม")} subtitle={L("About two minutes", "ใช้เวลาประมาณสองนาที")} onBack={() => goBack(router)} />
      <Page>
        <SectionLabel>{L("I AM ANSWERING AS", "ฉันตอบในฐานะ")}</SectionLabel>
        <View style={s.roles} {...radioGroup(L("I am answering as", "ฉันตอบในฐานะ"))}>
          {(["student", "teacher"] as const).map((r) => (
            <Pressable
              key={r}
              style={[s.role, role === r && s.roleOn]}
              onPress={() => {
                setRole(r);
                setAnswers({});
              }}
              accessibilityRole="radio"
              aria-checked={role === r}
            >
              <Icon name={r === "student" ? "user" : "school"} size={20} color={role === r ? C.cyan : C.muted} />
              <Text style={[s.roleText, role === r && { color: C.cyan }]}>{r === "student" ? L("STUDENT", "นักเรียน") : L("TEACHER", "ครู")}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.scaleNote}>{L("1 = strongly disagree · 5 = strongly agree", "1 = ไม่เห็นด้วยอย่างยิ่ง · 5 = เห็นด้วยอย่างยิ่ง")}</Text>

        {groups.map((group) => (
          <View key={group[0]}>
            <SectionLabel>{L(...group).toUpperCase()}</SectionLabel>
            <Card style={s.card}>
              {items
                .filter((it) => it.group === group)
                .map((it, i) => (
                  <View key={it.id} style={[s.item, i > 0 && s.itemDivider]}>
                    <Text style={s.itemText}>{L(...it.text)}</Text>
                    <View style={s.likert} {...radioGroup(L(...it.text))}>
                      {LIKERT.map((label, k) => {
                        const on = answers[it.id] === k + 1;
                        return (
                          <Pressable
                            key={k}
                            style={[s.dot, on && s.dotOn]}
                            onPress={() => setAnswers((a) => ({ ...a, [it.id]: k + 1 }))}
                            accessibilityRole="radio"
                            aria-checked={on}
                            accessibilityLabel={`${k + 1}: ${L(...label)}`}
                          >
                            <Text style={[s.dotText, on && { color: C.bg }]}>{k + 1}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
            </Card>
          </View>
        ))}

        <SectionLabel>{L("ANYTHING ELSE? (optional)", "มีอะไรเพิ่มเติมไหม (ไม่บังคับ)")}</SectionLabel>
        <TextInput
          style={s.comment}
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={600}
          placeholder={L("What worked well, and what should change?", "อะไรที่ดีอยู่แล้ว และอะไรที่ควรปรับ")}
          placeholderTextColor={C.dim}
          accessibilityLabel={L("Comment", "ความคิดเห็น")}
        />

        <Btn
          label={complete ? L("SUBMIT ANSWERS", "ส่งคำตอบ") : L("ANSWER EVERY ITEM TO SUBMIT", "ตอบให้ครบทุกข้อเพื่อส่ง")}
          icon="check"
          disabled={!complete}
          onPress={submit}
          style={{ marginTop: 18 }}
        />
      </Page>
    </Screen>
  );
}

const useStyles = makeStyles((sw) => ({
  roles: { flexDirection: "row", gap: sw(10) },
  role: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: sw(8),
    height: tap(sw, 46),
    borderRadius: sw(12),
    borderWidth: 1,
    borderColor: C.edge,
  },
  roleOn: { borderColor: C.cyan, backgroundColor: "rgba(0,200,255,0.14)" },
  roleText: { fontFamily: MONO, fontSize: sw(12), color: C.muted, letterSpacing: 1 },
  scaleNote: { fontSize: sw(11.5), color: C.dim, textAlign: "center", marginTop: sw(12) },
  card: { paddingVertical: sw(4) },
  item: { paddingVertical: sw(12) },
  itemDivider: { borderTopWidth: 1, borderTopColor: C.lineSoft },
  itemText: { fontSize: sw(13.5), color: C.text, lineHeight: sw(20) },
  likert: { flexDirection: "row", justifyContent: "space-between", gap: sw(6), marginTop: sw(10) },
  dot: {
    flex: 1,
    maxWidth: sw(64),
    height: tap(sw),
    borderRadius: sw(10),
    borderWidth: 1,
    borderColor: C.edge,
    alignItems: "center",
    justifyContent: "center",
  },
  dotOn: { backgroundColor: C.cyan, borderColor: C.cyan },
  dotText: { fontFamily: MONO, fontSize: sw(14), fontWeight: "bold", color: C.muted },
  comment: {
    minHeight: sw(90),
    borderWidth: 1,
    borderColor: C.edge,
    borderRadius: sw(12),
    backgroundColor: "rgba(0,200,255,0.06)",
    padding: sw(12),
    fontSize: sw(14),
    color: C.text,
    textAlignVertical: "top",
    outlineColor: C.cyan,
  },
  thanks: { flex: 1, alignItems: "center", justifyContent: "center", padding: sw(32), gap: sw(14) },
  thanksTitle: { fontFamily: MONO, fontSize: sw(18), fontWeight: "bold", color: C.green, letterSpacing: 2 },
  thanksText: { fontSize: sw(13.5), color: C.muted, textAlign: "center", lineHeight: sw(21), maxWidth: 420 },
}));
