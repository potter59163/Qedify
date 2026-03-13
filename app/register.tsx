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
    TextInput,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: W, height: H } = getPhoneFrameWindow();
const sw = (n: number) => (n / 388) * W;
const sh = (n: number) => (n / 812) * H;

const FONT_MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

const AVATARS = [
  "\uD83D\uDC68\u200D\uD83D\uDE80",
  "\uD83D\uDC69\u200D\uD83D\uDE80",
  "\uD83E\uDDD1\u200D\uD83D\uDE80",
  "\uD83D\uDC7E",
];

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* ── Header ── */}
        <FadeSlideIn delay={0}>
          <View style={s.header}>
            <Text style={s.title}>JOIN MISSION</Text>
            <Text style={s.subtitle}>CREATE YOUR CADET PROFILE</Text>
          </View>
        </FadeSlideIn>

        {/* ── Avatar Picker ── */}
        <FadeSlideIn delay={80}>
          <Text style={s.label}>CHOOSE AVATAR</Text>
          <View style={s.avatarRow}>
            {AVATARS.map((a, i) => (
              <TouchableOpacity
                key={i}
                style={[s.avatarCircle, i === 0 && s.avatarCircleActive]}
                activeOpacity={0.7}
              >
                <Text style={s.avatarEmoji}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeSlideIn>

        {/* ── Display Name ── */}
        <FadeSlideIn delay={140}>
          <Text style={s.label}>DISPLAY NAME</Text>
          <View style={s.inputRow}>
            <Text style={s.inputIcon}>{"\uD83E\uDDD1\u200D\uD83D\uDE80"}</Text>
            <TextInput
              style={s.input}
              placeholder="Pariphat R."
              placeholderTextColor="rgba(232,244,255,0.4)"
              autoCorrect={false}
            />
          </View>
        </FadeSlideIn>

        {/* ── Email ── */}
        <FadeSlideIn delay={190}>
          <Text style={s.label}>EMAIL</Text>
          <View style={s.inputRow}>
            <Text style={s.inputIcon}>{"\uD83D\uDCE7"}</Text>
            <TextInput
              style={s.input}
              placeholder="your@school.ac.th"
              placeholderTextColor="rgba(232,244,255,0.4)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </FadeSlideIn>

        {/* ── School ── */}
        <FadeSlideIn delay={230}>
          <Text style={s.label}>SCHOOL (optional)</Text>
          <View style={s.inputRow}>
            <Text style={s.inputIcon}>{"\uD83C\uDFEB"}</Text>
            <TextInput
              style={s.input}
              placeholder="Potisarnpittayakorn School"
              placeholderTextColor="rgba(232,244,255,0.4)"
              autoCorrect={false}
            />
          </View>
        </FadeSlideIn>

        {/* ── Password ── */}
        <FadeSlideIn delay={270}>
          <Text style={s.label}>PASSWORD</Text>
          <View style={s.inputRow}>
            <Text style={s.inputIcon}>{"\uD83D\uDD12"}</Text>
            <TextInput
              style={s.input}
              placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
              placeholderTextColor="rgba(232,244,255,0.4)"
              secureTextEntry
            />
          </View>
        </FadeSlideIn>

        {/* ── Launch Button ── */}
        <FadeSlideIn delay={330}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.replace("/(tabs)")}
            style={s.launchOuter}
          >
            <LinearGradient
              colors={["#00c8ff", "#0d4eaa"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={s.launchBtn}
            >
              <Text style={s.launchBtnText}>
                {"\uD83D\uDE80"} LAUNCH MY JOURNEY
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </FadeSlideIn>

        {/* ── Login link ── */}
        <FadeSlideIn delay={380}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={s.loginWrap}
            onPress={() => router.back()}
          >
            <Text style={s.loginText}>
              Already a cadet? <Text style={s.loginLink}>LOG IN</Text>
            </Text>
          </TouchableOpacity>
        </FadeSlideIn>
      </ScrollView>
    </SafeAreaView>
  );
}

type Styles = {
  container: ViewStyle;
  scroll: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  label: TextStyle;
  avatarRow: ViewStyle;
  avatarCircle: ViewStyle;
  avatarCircleActive: ViewStyle;
  avatarEmoji: TextStyle;
  inputRow: ViewStyle;
  inputIcon: TextStyle;
  input: TextStyle;
  launchOuter: ViewStyle;
  launchBtn: ViewStyle;
  launchBtnText: TextStyle;
  loginWrap: ViewStyle;
  loginText: TextStyle;
  loginLink: TextStyle;
};

const s = StyleSheet.create<Styles>({
  container: { flex: 1, backgroundColor: "#060d1e" },

  scroll: {
    paddingHorizontal: sw(28),
    paddingTop: sh(40),
    paddingBottom: sh(20),
  },

  /* Header */
  header: { marginBottom: sh(24) },
  title: {
    fontFamily: FONT_MONO,
    fontSize: sw(24),
    color: "#e8f4ff",
    fontWeight: "bold",
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: FONT_MONO,
    fontSize: sw(12),
    color: "#8899aa",
    letterSpacing: 2,
    marginTop: sw(4),
  },

  /* Labels */
  label: {
    fontFamily: FONT_MONO,
    fontSize: sw(11),
    color: "#00c8ff",
    letterSpacing: 1,
    marginTop: sh(16),
    marginBottom: sw(8),
  },

  /* Avatar */
  avatarRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: sw(14),
    marginBottom: sh(4),
  },
  avatarCircle: {
    width: sw(52),
    height: sw(52),
    borderRadius: sw(26),
    backgroundColor: "rgba(0,200,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCircleActive: {
    borderColor: "#00c8ff",
    backgroundColor: "rgba(0,200,255,0.15)",
    borderWidth: 2,
  },
  avatarEmoji: { fontSize: sw(22) },

  /* Inputs */
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,200,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.15)",
    borderRadius: sw(14),
    height: sw(51),
    paddingHorizontal: sw(16),
  },
  inputIcon: { fontSize: sw(16), marginRight: sw(10) },
  input: {
    flex: 1,
    fontSize: sw(14),
    color: "#e8f4ff",
    fontFamily: FONT_MONO,
  },

  /* Launch */
  launchOuter: { marginTop: sh(24) },
  launchBtn: {
    borderRadius: sw(14),
    height: sw(49),
    alignItems: "center",
    justifyContent: "center",
  },
  launchBtnText: {
    fontFamily: FONT_MONO,
    fontSize: sw(14),
    color: "#e8f4ff",
    fontWeight: "bold",
    letterSpacing: 1,
  },

  /* Login link */
  loginWrap: { marginTop: sh(16), alignItems: "center" },
  loginText: { fontSize: sw(13), color: "#8899aa" },
  loginLink: { color: "#00c8ff", fontWeight: "bold" },
});
