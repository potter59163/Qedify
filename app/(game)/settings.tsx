import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { Avatar } from "@/components/art";
import { AVATARS, C, MONO } from "@/constants/theme";
import { radioGroup } from "@/lib/a11y";
import { attemptsCsv, buildExport, saveFile } from "@/lib/export";
import { useL } from "@/lib/i18n";
import { makeStyles, tap } from "@/lib/layout";
import { goBack, href } from "@/lib/nav";
import { dayKey } from "@/lib/progress";
import { useGame } from "@/lib/store";
import { Text } from "@/lib/text";
import { Btn, Card, Overlay, Page, Screen, SectionLabel, TopBar } from "@/lib/ui";

function Toggle({
  label,
  options,
  value,
  onChange,
}: {
  /** Name of the setting, read out with each option. */
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const s = useStyles();
  return (
    <View style={s.toggle} {...radioGroup(label)}>
      {options.map((o) => (
        <Pressable
          key={o.id}
          style={[s.toggleItem, value === o.id && s.toggleOn]}
          onPress={() => onChange(o.id)}
          accessibilityRole="radio"
          aria-checked={value === o.id}
        >
          <Text style={[s.toggleText, value === o.id && { color: C.cyan }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function Settings() {
  const s = useStyles();
  const router = useRouter();
  const L = useL();
  const { state, dispatch } = useGame();
  const [confirm, setConfirm] = useState<null | "reset" | "delete">(null);
  const [identity, setIdentity] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const profile = state.profile;
  const onOff = [
    { id: "on", label: L("ON", "เปิด") },
    { id: "off", label: L("OFF", "ปิด") },
  ];

  const exportData = async (kind: "json" | "csv") => {
    const name = `qedify-${state.pid || "cadet"}-${dayKey()}.${kind}`;
    const ok =
      kind === "json"
        ? await saveFile(name, "application/json", JSON.stringify(buildExport(state, identity), null, 2))
        : await saveFile(name, "text/csv", attemptsCsv(state));
    setSaved(ok ? L(`Saved ${name}`, `บันทึก ${name} แล้ว`) : L("The file could not be saved on this device.", "บันทึกไฟล์บนอุปกรณ์นี้ไม่ได้"));
  };

  return (
    <Screen>
      <TopBar title={L("SETTINGS", "ตั้งค่า")} subtitle={L("Profile, language, AI coach and data", "โปรไฟล์ ภาษา โค้ช AI และข้อมูล")} onBack={() => goBack(router)} />
      <Page>
        <SectionLabel>{L("CADET PROFILE", "โปรไฟล์")}</SectionLabel>
        <Card>
          <View style={s.avatars} {...radioGroup(L("Avatar", "อวาตาร์"))}>
            {AVATARS.map((a, i) => (
              <Pressable
                key={a}
                style={[s.avatar, profile?.avatar === a && s.avatarOn]}
                onPress={() => dispatch({ type: "patch-profile", patch: { avatar: a } })}
                accessibilityRole="radio"
                aria-checked={profile?.avatar === a}
                accessibilityLabel={L(`Avatar ${i + 1}`, `อวาตาร์ ${i + 1}`)}
              >
                <Avatar id={a} size={50} ring={profile?.avatar === a} />
              </Pressable>
            ))}
          </View>
          <Text style={s.label}>{L("DISPLAY NAME", "ชื่อที่แสดง")}</Text>
          <TextInput
            style={s.input}
            value={profile?.name ?? ""}
            onChangeText={(t) => dispatch({ type: "patch-profile", patch: { name: t.slice(0, 24) } })}
            onBlur={() => {
              if (!profile?.name.trim()) dispatch({ type: "patch-profile", patch: { name: "Cadet" } });
            }}
            autoCorrect={false}
            autoComplete="nickname"
            accessibilityLabel={L("Display name", "ชื่อที่แสดง")}
          />
          <Text style={s.label}>{L("SCHOOL (optional)", "โรงเรียน (ไม่บังคับ)")}</Text>
          <TextInput
            style={s.input}
            value={profile?.school ?? ""}
            onChangeText={(t) => dispatch({ type: "patch-profile", patch: { school: t.slice(0, 40) } })}
            autoCorrect={false}
            autoComplete="organization"
            accessibilityLabel={L("School", "โรงเรียน")}
          />
        </Card>

        <SectionLabel>{L("LANGUAGE AND SOUND", "ภาษาและเสียง")}</SectionLabel>
        <Card>
          <Text style={s.rowTitle}>{L("Language", "ภาษา")}</Text>
          <Text style={s.rowSub}>{L("Used for the whole app, the missions and the AI coach.", "ใช้กับทั้งแอป ภารกิจ และโค้ช AI")}</Text>
          <Toggle
            label={L("Language", "ภาษา")}
            options={[
              { id: "th", label: "ไทย" },
              { id: "en", label: "English" },
            ]}
            value={state.settings.lang}
            onChange={(id) => dispatch({ type: "settings", patch: { lang: id === "th" ? "th" : "en" } })}
          />
          <Text style={[s.rowTitle, { marginTop: 16 }]}>{L("Sound effects", "เสียงประกอบ")}</Text>
          <Toggle
            label={L("Sound effects", "เสียงประกอบ")}
            options={onOff}
            value={state.settings.sound ? "on" : "off"}
            onChange={(id) => dispatch({ type: "settings", patch: { sound: id === "on" } })}
          />
        </Card>

        <SectionLabel>{L("ACCESSIBILITY", "การเข้าถึง")}</SectionLabel>
        <Card>
          <Text style={s.rowTitle}>{L("Mission clock", "นาฬิกาจับเวลาภารกิจ")}</Text>
          <Text style={s.rowSub}>
            {L(
              "Take the time you need. Stars and XP do not depend on the clock.",
              "ใช้เวลาได้เท่าที่ต้องการ ดาวและ XP ไม่ขึ้นกับนาฬิกา",
            )}
          </Text>
          <Toggle
            label={L("Mission clock", "นาฬิกาจับเวลาภารกิจ")}
            options={[
              { id: "normal", label: L("NORMAL", "ปกติ") },
              { id: "double", label: L("DOUBLE", "สองเท่า") },
              { id: "off", label: L("NO LIMIT", "ไม่จับเวลา") },
            ]}
            value={state.settings.timer}
            onChange={(id) => dispatch({ type: "settings", patch: { timer: id === "off" ? "off" : id === "double" ? "double" : "normal" } })}
          />
          <Text style={[s.rowTitle, { marginTop: 16 }]}>{L("Reduce motion", "ลดการเคลื่อนไหว")}</Text>
          <Text style={s.rowSub}>
            {L(
              "Stops the twinkling stars, floating ships and entrance animations. The outcome of a mission is still shown.",
              "หยุดดาวกะพริบ ยานที่ลอยขึ้นลง และแอนิเมชันตอนเปิดหน้า แต่ยังแสดงผลลัพธ์ของภารกิจ",
            )}
          </Text>
          <Toggle
            label={L("Reduce motion", "ลดการเคลื่อนไหว")}
            options={onOff}
            value={state.settings.reduceMotion ? "on" : "off"}
            onChange={(id) => dispatch({ type: "settings", patch: { reduceMotion: id === "on" } })}
          />
        </Card>

        <SectionLabel>{L("AI COACH", "โค้ช AI")}</SectionLabel>
        <Card>
          <Text style={s.rowTitle}>{L("Personalised hints and debriefs", "คำใบ้และสรุปเฉพาะบุคคล")}</Text>
          <Text style={s.rowSub}>
            {L(
              "When on, hints, mission debriefs and learning insights are written by Claude from your mission data. When off, or when the coach cannot be reached, the built-in feedback is used instead.",
              "เมื่อเปิด คำใบ้ สรุปหลังภารกิจ และข้อมูลเชิงลึกจะเขียนโดย Claude จากข้อมูลภารกิจของคุณ เมื่อปิด หรือเมื่อติดต่อโค้ชไม่ได้ จะใช้คำแนะนำที่มีในตัวแอปแทน",
            )}
          </Text>
          <Toggle
            label={L("AI coach", "โค้ช AI")}
            options={onOff}
            value={state.settings.ai ? "on" : "off"}
            onChange={(id) => dispatch({ type: "settings", patch: { ai: id === "on" } })}
          />
          <Text style={s.privacy}>
            {L(
              "Only mission numbers, your answers and anonymous statistics are sent to the coach. Your name and school never leave this device.",
              "ข้อมูลที่ส่งให้โค้ชมีเพียงตัวเลขของภารกิจ คำตอบของคุณ และสถิติที่ไม่ระบุตัวตน ชื่อและโรงเรียนของคุณไม่ออกจากอุปกรณ์นี้",
            )}
          </Text>
        </Card>

        <SectionLabel>{L("RESEARCH AND FEEDBACK", "งานวิจัยและความคิดเห็น")}</SectionLabel>
        <Card>
          <Text style={s.rowTitle}>{L("Satisfaction survey", "แบบสอบถามความพึงพอใจ")}</Text>
          <Text style={s.rowSub}>
            {L(
              `A short questionnaire for students and teachers. Answers given so far: ${state.surveys.length}.`,
              `แบบสอบถามสั้น ๆ สำหรับนักเรียนและครู ตอบไปแล้ว ${state.surveys.length} ครั้ง`,
            )}
          </Text>
          <Btn label={L("OPEN THE SURVEY", "เปิดแบบสอบถาม")} icon="clipboard" tone="outline" small onPress={() => router.push(href("/survey"))} style={{ marginTop: 12 }} />

          <Text style={[s.rowTitle, { marginTop: 18 }]}>{L("Export my learning data", "ส่งออกข้อมูลการเรียนรู้")}</Text>
          <Text style={s.rowSub}>
            {L(
              "Saves a file with every answer, decision time, hint, misconception, lab run, retention check and survey answer, to hand to a teacher or researcher. Nothing is uploaded.",
              "บันทึกไฟล์ที่มีทุกคำตอบ เวลาตัดสินใจ คำใบ้ ความเข้าใจคลาดเคลื่อน การทดลองในห้องทดลอง การทบทวน และคำตอบแบบสอบถาม เพื่อส่งให้ครูหรือผู้วิจัย ไม่มีการอัปโหลดข้อมูลใด ๆ",
            )}
          </Text>
          <Toggle
            label={L("Name in the exported file", "ชื่อในไฟล์ที่ส่งออก")}
            options={[
              { id: "anon", label: L("ANONYMOUS", "ไม่ระบุชื่อ") },
              { id: "named", label: L("WITH MY NAME", "ระบุชื่อ") },
            ]}
            value={identity ? "named" : "anon"}
            onChange={(id) => setIdentity(id === "named")}
          />
          <View style={s.exportRow}>
            <Btn label={L("FULL DATA (JSON)", "ข้อมูลทั้งหมด (JSON)")} icon="chart" tone="outline" small onPress={() => exportData("json")} style={s.exportBtn} />
            <Btn label={L("ANSWERS (CSV)", "คำตอบ (CSV)")} icon="clipboard" tone="outline" small onPress={() => exportData("csv")} style={s.exportBtn} />
          </View>
          {/* Always present, so the result of an export is announced when it arrives. */}
          <Text style={saved ? s.saved : null} aria-live="polite">
            {saved ?? ""}
          </Text>
        </Card>

        <SectionLabel>{L("DATA", "ข้อมูล")}</SectionLabel>
        <Card>
          <Text style={s.rowSub}>
            {L(
              "Everything is stored in this browser or device. Clearing site data also clears your progress.",
              "ทุกอย่างเก็บอยู่ในเบราว์เซอร์หรืออุปกรณ์นี้ การล้างข้อมูลเว็บไซต์จะล้างความคืบหน้าของคุณด้วย",
            )}
          </Text>
          <Btn label={L("RESET PROGRESS", "รีเซ็ตความคืบหน้า")} icon="refresh" tone="outline" small onPress={() => setConfirm("reset")} style={{ marginTop: 12 }} />
          <Btn label={L("DELETE PROFILE", "ลบโปรไฟล์")} icon="trash" tone="quiet" small onPress={() => setConfirm("delete")} style={{ marginTop: 6 }} />
        </Card>

        <Text style={s.about}>
          {L("QEDify · Momentum, impulse and collisions\nAI coach powered by Claude", "QEDify · โมเมนตัม การดล และการชน\nโค้ช AI ขับเคลื่อนด้วย Claude")}
        </Text>
      </Page>

      <Overlay
        visible={confirm !== null}
        onClose={() => setConfirm(null)}
        icon="warning"
        tone="red"
        title={confirm === "delete" ? L("DELETE PROFILE?", "ลบโปรไฟล์?") : L("RESET PROGRESS?", "รีเซ็ตความคืบหน้า?")}
        body={
          confirm === "delete"
            ? L(
                "This removes your profile and all progress from this device. It cannot be undone.",
                "การลบนี้จะนำโปรไฟล์และความคืบหน้าทั้งหมดออกจากอุปกรณ์นี้ และย้อนกลับไม่ได้",
              )
            : L(
                "This clears XP, stars, badges and analytics but keeps your profile. It cannot be undone.",
                "การรีเซ็ตนี้จะล้าง XP ดาว เหรียญตรา และข้อมูลวิเคราะห์ แต่เก็บโปรไฟล์ไว้ และย้อนกลับไม่ได้",
              )
        }
      >
        <View style={{ alignSelf: "stretch", gap: 8 }}>
          <Btn
            label={confirm === "delete" ? L("DELETE EVERYTHING", "ลบทั้งหมด") : L("RESET PROGRESS", "รีเซ็ตความคืบหน้า")}
            tone="orange"
            small
            onPress={() => {
              const kind = confirm;
              setConfirm(null);
              if (kind === "delete") {
                dispatch({ type: "sign-out" });
                router.replace(href("/"));
              } else {
                dispatch({ type: "reset-progress" });
                router.replace(href("/home"));
              }
            }}
          />
          <Btn label={L("CANCEL", "ยกเลิก")} tone="outline" small onPress={() => setConfirm(null)} />
        </View>
      </Overlay>
    </Screen>
  );
}

const useStyles = makeStyles((sw) => ({
  avatars: { flexDirection: "row", justifyContent: "center", gap: sw(14) },
  avatar: { borderRadius: 30, padding: 3, borderWidth: 2, borderColor: "transparent" },
  avatarOn: { borderColor: "rgba(0,200,255,0.5)" },
  label: { fontFamily: MONO, fontSize: sw(10), color: C.cyan, letterSpacing: 1, marginTop: sw(14), marginBottom: sw(6) },
  input: {
    height: sw(46),
    borderWidth: 1,
    borderColor: C.edge,
    borderRadius: sw(12),
    backgroundColor: "rgba(0,200,255,0.06)",
    paddingHorizontal: sw(14),
    fontSize: sw(15),
    color: C.text,
    outlineColor: C.cyan,
  },
  rowTitle: { fontSize: sw(14), fontWeight: "600", color: C.text },
  rowSub: { fontSize: sw(12), color: C.muted, lineHeight: sw(18), marginTop: sw(4) },
  toggle: { flexDirection: "row", gap: sw(8), marginTop: sw(10) },
  toggleItem: { flex: 1, height: tap(sw), borderRadius: sw(10), borderWidth: 1, borderColor: C.edge, alignItems: "center", justifyContent: "center" },
  toggleOn: { borderColor: C.cyan, backgroundColor: "rgba(0,200,255,0.14)" },
  toggleText: { fontFamily: MONO, fontSize: sw(12), color: C.muted, letterSpacing: 1 },
  exportRow: { flexDirection: "row", flexWrap: "wrap", gap: sw(8), marginTop: sw(10) },
  // Wide enough for the label, so on a narrow screen the buttons stack instead of cutting their text.
  exportBtn: { flexGrow: 1, flexBasis: sw(190) },
  saved: { fontSize: sw(11.5), color: C.green, marginTop: sw(10) },
  privacy: { fontSize: sw(11), color: C.dim, lineHeight: sw(16), marginTop: sw(14) },
  about: { fontSize: sw(11), color: C.dim, textAlign: "center", lineHeight: sw(17), marginTop: sw(24) },
}));
