import { Link, useRouter } from "expo-router";
import { useEffect } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Planet, RocketHero } from "@/components/art";
import { Icon } from "@/components/icon";
import { C, MONO } from "@/constants/theme";
import { CHAPTERS, MISSIONS, chapterText, missionText, missionsOf } from "@/lib/engine/catalog";
import type { IconName } from "@/lib/engine/types";
import { LangOverride, useL, useLang, type Bi } from "@/lib/i18n";
import { href } from "@/lib/nav";
import { SITE, Seo } from "@/lib/seo";
import { useGame } from "@/lib/store";
import { Text } from "@/lib/text";
import { Screen, Starfield } from "@/lib/ui";

const FEATURES: { icon: IconName; title: Bi; body: Bi }[] = [
  {
    icon: "rocket",
    title: ["Missions, not worksheets", "ภารกิจ ไม่ใช่ใบงาน"],
    body: ["Plan thruster burns, dock runaway shuttles and pick crash buffers. Every answer plays out in a simulation that obeys the laws of physics.", "วางแผนจุดเครื่องยนต์ เทียบท่ากระสวยที่ควบคุมไม่ได้ และเลือกวัสดุกันกระแทก ทุกคำตอบจะแสดงผลในการจำลองที่เป็นไปตามกฎฟิสิกส์"],
  },
  {
    icon: "target",
    title: ["Feedback on your thinking", "คำแนะนำที่ตรงกับวิธีคิดของคุณ"],
    body: ["A wrong answer is matched against common misconceptions, such as ignoring direction or mixing up force and impulse, so you learn why it was wrong.", "คำตอบที่ผิดจะถูกเทียบกับความเข้าใจคลาดเคลื่อนที่พบบ่อย เช่น ลืมทิศทาง หรือสับสนแรงกับการดล คุณจึงรู้ว่าผิดเพราะอะไร"],
  },
  {
    icon: "chart",
    title: ["Difficulty that adapts", "ความยากที่ปรับตามคุณ"],
    body: ["QEDify tracks your mastery of each skill. Hints, vectors and worked steps fade as you improve, and return when you need them.", "QEDify ติดตามความชำนาญของคุณในแต่ละทักษะ คำใบ้ เวกเตอร์ และขั้นตอนช่วยคิดจะค่อย ๆ ลดลงเมื่อคุณเก่งขึ้น และกลับมาเมื่อคุณต้องการ"],
  },
  {
    icon: "robot",
    title: ["An AI coach when you are stuck", "โค้ช AI เมื่อคุณติดขัด"],
    body: ["Ask for a hint and the coach looks at what you tried, then nudges you toward the next step without giving the answer away.", "ขอคำใบ้ แล้วโค้ชจะดูสิ่งที่คุณลองทำ จากนั้นชี้ทางไปขั้นถัดไปโดยไม่บอกคำตอบ"],
  },
];

const FAQ: { q: Bi; a: Bi }[] = [
  {
    q: ["Who is QEDify for?", "QEDify เหมาะกับใคร"],
    a: ["High-school students learning momentum, impulse, conservation of momentum and one-dimensional collisions, and teachers who want practice with instant feedback.", "นักเรียนมัธยมปลายที่กำลังเรียนเรื่องโมเมนตัม การดล กฎการอนุรักษ์โมเมนตัม และการชนในหนึ่งมิติ รวมถึงครูที่ต้องการแบบฝึกที่ให้ผลป้อนกลับทันที"],
  },
  {
    q: ["Do I need an account?", "ต้องสมัครบัญชีไหม"],
    a: ["No. You create a cadet profile that is stored on your own device. Nothing has to be installed and it works in any modern browser.", "ไม่ต้อง คุณสร้างโปรไฟล์ที่เก็บไว้ในอุปกรณ์ของคุณเอง ไม่ต้องติดตั้งอะไร และใช้ได้กับเบราว์เซอร์รุ่นใหม่ทุกตัว"],
  },
  {
    q: ["What physics does it cover?", "ครอบคลุมฟิสิกส์เรื่องใดบ้าง"],
    a: ["Momentum as a vector (p = mv), impulse and force (J = FΔt = Δp), conservation of momentum in docking, recoil and mass ejection, and elastic versus inelastic collisions with kinetic energy analysis.", "โมเมนตัมในฐานะเวกเตอร์ (p = mv) การดลและแรง (J = FΔt = Δp) กฎการอนุรักษ์โมเมนตัมในการเทียบท่า การถอยหลัง และการพ่นมวล รวมถึงการชนแบบยืดหยุ่นและไม่ยืดหยุ่นพร้อมการวิเคราะห์พลังงานจลน์"],
  },
];

/** CSS-driven fluid size on the web; a fixed size on native. */
const fluid = (web: string, native: number) => (Platform.OS === "web" ? (web as unknown as number) : native);

/**
 * Public landing page. It is rendered to static HTML at build time, so it uses
 * fixed and fluid sizes only: nothing here depends on the measured window, and
 * the server markup matches what the browser hydrates. `/th` renders the same
 * page in Thai (see app/th.tsx).
 */
export function Landing({ thai = false }: { thai?: boolean }) {
  const router = useRouter();
  const { state, ready, dispatch } = useGame();
  const L = useL();
  const lang = useLang();

  // Returning cadets go straight back to mission control.
  useEffect(() => {
    if (ready && state.profile) router.replace(href("/home"));
  }, [ready, state.profile, router]);

  const start = href(state.onboarded ? "/register" : "/onboarding");

  return (
    <Screen>
      <Seo
        path={thai ? "/th" : "/"}
        thai={thai}
        description={thai ? SITE.descriptionTh : SITE.description}
        alternates={{ en: "/", th: "/th" }}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: SITE.name,
          url: SITE.url + (thai ? "/th" : ""),
          description: thai ? SITE.descriptionTh : SITE.description,
          applicationCategory: "EducationalApplication",
          operatingSystem: "Any",
          inLanguage: thai ? "th" : "en",
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          audience: { "@type": "EducationalAudience", educationalRole: "student" },
          teaches: ["Momentum", "Impulse", "Conservation of momentum", "Elastic and inelastic collisions"],
        }}
      />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <SafeAreaView role="main" edges={["top", "bottom"]} style={s.wrap}>
          <View style={s.nav}>
            <Text style={s.brand}>QEDify</Text>
            <View style={s.navRight}>
              <Link replace href={href("/th")} onPress={() => dispatch({ type: "settings", patch: { lang: "th" } })} style={[s.langLink, lang === "th" && s.langOn]}>
                ไทย
              </Link>
              <Link replace href={href("/")} onPress={() => dispatch({ type: "settings", patch: { lang: "en" } })} style={[s.langLink, lang === "en" && s.langOn]}>
                EN
              </Link>
            <Link href={start} asChild>
              <Pressable style={s.navBtn} accessibilityRole="link">
                <Text style={s.navBtnText}>{L("PLAY", "เล่น")}</Text>
              </Pressable>
            </Link>
            </View>
          </View>

          <View style={s.hero}>
            <Starfield count={22} />
            <View style={s.heroText}>
              <Text style={s.kicker}>{L("MOMENTUM · PHYSICS · MASTERY", "โมเมนตัม · ฟิสิกส์ · เชี่ยวชาญ")}</Text>
              <Text style={s.h1} role="heading" aria-level={1}>
                {L("Learn physics through ", "เรียนฟิสิกส์ผ่าน")}
                <Text style={s.accent}>{L("space rescue missions", "ภารกิจกู้ภัยอวกาศ")}</Text>
              </Text>
              <Text style={s.lead}>
                {L(
                  `Solve real momentum problems to rescue spacecraft. ${MISSIONS.length} missions across ${CHAPTERS.length} chapters, with instant feedback, adaptive difficulty and an AI coach.`,
                  `แก้โจทย์โมเมนตัมจริงเพื่อกู้ภัยยานอวกาศ ${MISSIONS.length} ภารกิจใน ${CHAPTERS.length} บท พร้อมผลป้อนกลับทันที ความยากที่ปรับตามผู้เรียน และโค้ช AI`,
                )}
              </Text>
              <Link href={start} asChild>
                <Pressable style={s.cta} accessibilityRole="link">
                  <Text style={s.ctaText}>{L("START YOUR MISSION", "เริ่มภารกิจของคุณ")}</Text>
                  <Icon name="arrow-right" size={18} color={C.onOrange} />
                </Pressable>
              </Link>
              <Text style={s.note}>{L("Free · No account · Runs in your browser", "ฟรี · ไม่ต้องสมัคร · เล่นได้ในเบราว์เซอร์")}</Text>
            </View>
            <View style={s.heroArt} aria-hidden>
              <Planet size={260} />
              <View style={s.rocket}>
                <RocketHero size={64} />
              </View>
              <View style={[s.chip, s.chipA]}>
                <Text style={s.chipText}>p = m × v</Text>
              </View>
              <View style={[s.chip, s.chipB]}>
                <Text style={[s.chipText, { color: C.teal }]}>J = F × Δt</Text>
              </View>
            </View>
          </View>

          <Text style={s.h2} role="heading" aria-level={2}>
            {L("How it works", "วิธีการทำงาน")}
          </Text>
          <View style={s.grid}>
            {FEATURES.map((f) => (
              <View key={f.title[0]} style={s.feature}>
                <View style={s.featureIcon}>
                  <Icon name={f.icon} size={22} color={C.cyan} />
                </View>
                <Text style={s.h3} role="heading" aria-level={3}>
                  {L(...f.title)}
                </Text>
                <Text style={s.p}>{L(...f.body)}</Text>
              </View>
            ))}
          </View>

          <Text style={s.h2} role="heading" aria-level={2}>
            {L(`${CHAPTERS.length} chapters, ${MISSIONS.length} missions`, `${CHAPTERS.length} บท ${MISSIONS.length} ภารกิจ`)}
          </Text>
          <View style={s.grid}>
            {CHAPTERS.map((ch) => (
              <View key={ch.id} style={s.chapter}>
                <Text style={[s.chapterKicker, { color: ch.color }]}>{L("CHAPTER", "บทที่")} 0{ch.id}</Text>
                <Text style={s.h3} role="heading" aria-level={3}>
                  {chapterText(ch, lang).title}
                </Text>
                <Text style={s.p}>{chapterText(ch, lang).description}</Text>
                <View style={s.missionList}>
                  {missionsOf(ch.id).map((m) => (
                    <View key={m.id} style={s.missionRow}>
                      <Icon name={m.icon} size={15} color={ch.color} />
                      <Text style={s.missionName}>{missionText(m, lang).title}</Text>
                      <Text style={s.missionTag}>{missionText(m, lang).tagline}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <Text style={s.h2} role="heading" aria-level={2}>
            {L("Questions", "คำถามที่พบบ่อย")}
          </Text>
          <View style={s.grid}>
            {FAQ.map((f) => (
              <View key={f.q[0]} style={s.faq}>
                <Text style={s.h3} role="heading" aria-level={3}>
                  {L(...f.q)}
                </Text>
                <Text style={s.p}>{L(...f.a)}</Text>
              </View>
            ))}
          </View>

          <View style={s.closing}>
            <Text style={s.closingTitle}>{L("Ready for launch?", "พร้อมออกเดินทางหรือยัง?")}</Text>
            <Link href={start} asChild>
              <Pressable style={s.cta} accessibilityRole="link">
                <Text style={s.ctaText}>{L("START YOUR MISSION", "เริ่มภารกิจของคุณ")}</Text>
                <Icon name="arrow-right" size={18} color={C.onOrange} />
              </Pressable>
            </Link>
          </View>

          <Text style={s.footer}>{L("QEDify · Momentum, impulse and collisions · AI coach powered by Claude", "QEDify · โมเมนตัม การดล และการชน · โค้ช AI ขับเคลื่อนด้วย Claude")}</Text>
        </SafeAreaView>
      </ScrollView>
    </Screen>
  );
}

/** "/" is the English landing page; "/th" is the Thai one. Each URL has one language. */
export default function Index() {
  return (
    <LangOverride lang="en">
      <Landing />
    </LangOverride>
  );
}

const s = StyleSheet.create({
  navRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  langLink: { fontFamily: MONO, fontSize: 12, color: C.muted, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 8 },
  langOn: { color: C.cyan },
  scroll: { alignItems: "center" },
  wrap: { width: "100%", maxWidth: 1120, paddingHorizontal: 24, paddingBottom: 40 },

  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 18 },
  brand: { fontFamily: MONO, fontSize: 22, fontWeight: "bold", color: C.cyanBright, letterSpacing: 5 },
  navBtn: { borderWidth: 1, borderColor: "rgba(0,200,255,0.5)", borderRadius: 10, paddingHorizontal: 18, height: 44, justifyContent: "center" },
  navBtnText: { fontFamily: MONO, fontSize: 12, fontWeight: "bold", color: C.cyan, letterSpacing: 2 },

  hero: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 24, paddingVertical: 24 },
  heroText: { flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 0 },
  kicker: { fontFamily: MONO, fontSize: 12, color: C.cyan, letterSpacing: 3, marginBottom: 14 },
  h1: {
    fontSize: fluid("clamp(30px, 4.4vw, 52px)", 32),
    lineHeight: fluid("1.15", 39),
    fontWeight: "800",
    color: C.text,
  },
  accent: { color: C.cyan },
  lead: { fontSize: 16, lineHeight: 26, color: C.muted, marginTop: 16, maxWidth: 560 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    alignSelf: "flex-start",
    height: 52,
    paddingHorizontal: 26,
    borderRadius: 14,
    marginTop: 26,
    // Orange is the colour of "play" everywhere in the app; blue buttons only move between screens.
    backgroundColor: C.orange,
    boxShadow: "0 0 22px rgba(255,168,39,0.45)",
    ...(Platform.OS === "web" ? ({ backgroundImage: `linear-gradient(180deg, ${C.orange} 0%, ${C.orangeDark} 100%)` } as object) : null),
  },
  ctaText: { fontFamily: MONO, fontSize: 14, fontWeight: "bold", color: C.onOrange, letterSpacing: 1.5 },
  note: { fontSize: 13, color: C.muted, marginTop: 14 },
  heroArt: { flexGrow: 1, flexShrink: 1, flexBasis: 300, minHeight: 280, alignItems: "center", justifyContent: "center" },
  rocket: { position: "absolute", top: 6, right: "16%", transform: [{ rotate: "32deg" }] },
  chip: {
    position: "absolute",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "rgba(6,13,31,0.75)",
  },
  chipA: { left: "6%", top: 34, borderColor: C.cyan },
  chipB: { right: "6%", bottom: 30, borderColor: C.teal },
  chipText: { fontFamily: MONO, fontSize: 13, color: C.cyan },

  h2: { fontFamily: MONO, fontSize: 15, color: C.cyan, letterSpacing: 3, textTransform: "uppercase", marginTop: 44, marginBottom: 16 },
  h3: { fontSize: 17, fontWeight: "700", color: C.text, marginBottom: 6 },
  p: { fontSize: 14, lineHeight: 22, color: C.muted },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  feature: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 240,
    minWidth: 0,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    padding: 18,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,200,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.3)",
    marginBottom: 12,
  },
  chapter: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 300,
    minWidth: 0,
    backgroundColor: C.cardSoft,
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.18)",
    borderRadius: 16,
    padding: 18,
  },
  chapterKicker: { fontFamily: MONO, fontSize: 11, letterSpacing: 2, marginBottom: 4 },
  missionList: { marginTop: 12, gap: 8 },
  missionRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  missionName: { fontSize: 14, fontWeight: "600", color: C.text },
  missionTag: { fontSize: 13, color: C.muted },
  faq: { flexGrow: 1, flexShrink: 1, flexBasis: 300, minWidth: 0, borderLeftWidth: 2, borderLeftColor: "rgba(0,200,255,0.4)", paddingLeft: 16 },

  closing: { alignItems: "center", marginTop: 52, paddingVertical: 30, borderRadius: 20, borderWidth: 1, borderColor: C.line, backgroundColor: C.cardSoft },
  closingTitle: { fontSize: 22, fontWeight: "800", color: C.text },
  footer: { fontSize: 12, color: C.dim, textAlign: "center", marginTop: 30 },
});
