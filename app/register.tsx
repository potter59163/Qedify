import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "@/components/art";
import { Icon } from "@/components/icon";
import { AVATARS, C, MONO } from "@/constants/theme";
import { radioGroup } from "@/lib/a11y";
import { useL } from "@/lib/i18n";
import { goBack, href } from "@/lib/nav";
import { Seo } from "@/lib/seo";
import { useGame } from "@/lib/store";
import { Text } from "@/lib/text";
import { Btn, Screen } from "@/lib/ui";

export default function Register() {
  const router = useRouter();
  const { dispatch } = useGame();
  const L = useL();
  const [avatar, setAvatar] = useState<string>(AVATARS[0]);
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const trimmed = name.trim();

  const launch = () => {
    if (!trimmed) return;
    dispatch({ type: "profile", profile: { name: trimmed, avatar, school: school.trim(), createdAt: Date.now() } });
    router.replace(href("/home"));
  };

  return (
    <Screen>
      <Seo title={L("Create your cadet profile", "สร้างโปรไฟล์ของคุณ")} path="/register" index={false} />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" bounces={false}>
          <View role="main" style={s.col}>
            <Text style={s.title} role="heading" aria-level={1}>
              {L("JOIN MISSION", "เข้าร่วมภารกิจ")}
            </Text>
            <Text style={s.subtitle}>{L("CREATE YOUR CADET PROFILE", "สร้างโปรไฟล์นักบินฝึกหัด")}</Text>

            <Text style={s.label}>{L("CHOOSE AVATAR", "เลือกอวาตาร์")}</Text>
            <View style={s.avatars} {...radioGroup(L("Avatar", "อวาตาร์"))}>
              {AVATARS.map((a, i) => (
                <Pressable
                  key={a}
                  onPress={() => setAvatar(a)}
                  style={[s.avatar, a === avatar && s.avatarOn]}
                  accessibilityRole="radio"
                  aria-checked={a === avatar}
                  accessibilityLabel={L(`Avatar ${i + 1}`, `อวาตาร์ ${i + 1}`)}
                >
                  <Avatar id={a} size={54} ring={a === avatar} />
                </Pressable>
              ))}
            </View>

            <Text style={s.label} nativeID="name-label">
              {L("DISPLAY NAME", "ชื่อที่แสดง")}
            </Text>
            <View style={s.inputRow}>
              <Icon name="user" size={18} color={C.muted} />
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder={L("Your name", "ชื่อของคุณ")}
                placeholderTextColor={C.dim}
                autoCorrect={false}
                autoComplete="nickname"
                maxLength={24}
                returnKeyType="next"
                accessibilityLabel={L("Display name", "ชื่อที่แสดง")}
              />
            </View>

            <Text style={s.label}>{L("SCHOOL (optional)", "โรงเรียน (ไม่บังคับ)")}</Text>
            <View style={s.inputRow}>
              <Icon name="school" size={18} color={C.muted} />
              <TextInput
                style={s.input}
                value={school}
                onChangeText={setSchool}
                placeholder={L("Your school", "โรงเรียนของคุณ")}
                placeholderTextColor={C.dim}
                autoCorrect={false}
                maxLength={40}
                returnKeyType="done"
                onSubmitEditing={launch}
                accessibilityLabel={L("School, optional", "โรงเรียน ไม่บังคับ")}
              />
            </View>

            <Btn label={L("LAUNCH MY JOURNEY", "เริ่มการเดินทาง")} icon="rocket" onPress={launch} disabled={!trimmed} style={{ marginTop: 28 }} />
            <View style={s.noteRow}>
              <Icon name="lock" size={13} color={C.muted} />
              <Text style={s.note}>{L("No account needed. Your profile and progress stay on this device.", "ไม่ต้องสมัครบัญชี โปรไฟล์และความคืบหน้าเก็บอยู่ในอุปกรณ์นี้")}</Text>
            </View>
            <Pressable onPress={() => (router.canGoBack() ? goBack(router) : router.replace(href("/")))} style={s.back} accessibilityRole="button">
              <Text style={s.backText}>{L("Back", "ย้อนกลับ")}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const s = StyleSheet.create({
  scroll: { alignItems: "center", paddingHorizontal: 28, paddingTop: 44, paddingBottom: 28 },
  col: { width: "100%", maxWidth: 460 },
  title: { fontFamily: MONO, fontSize: 26, color: C.text, fontWeight: "bold", letterSpacing: 2 },
  subtitle: { fontFamily: MONO, fontSize: 12, color: C.muted, letterSpacing: 2, marginTop: 4, marginBottom: 8 },
  label: { fontFamily: MONO, fontSize: 11, color: C.cyan, letterSpacing: 1, marginTop: 20, marginBottom: 8 },
  avatars: { flexDirection: "row", justifyContent: "center", gap: 16 },
  avatar: { borderRadius: 32, padding: 3, borderWidth: 2, borderColor: "transparent" },
  avatarOn: { borderColor: "rgba(0,200,255,0.5)" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,200,255,0.06)",
    borderWidth: 1,
    borderColor: C.edge,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
  },
  input: { flex: 1, minWidth: 0, fontSize: 16, color: C.text, padding: 0, outlineWidth: 0 },
  noteRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14 },
  note: { fontSize: 12, color: C.muted, flexShrink: 1 },
  back: { alignItems: "center", paddingVertical: 16 },
  backText: { fontSize: 14, color: C.cyan },
});
