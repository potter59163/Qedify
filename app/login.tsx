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

export default function LoginScreen() {
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
            <Text style={s.logo}>QEDify</Text>
            <Text style={s.subtitle}>PHYSICS LEARNING PLATFORM</Text>
          </View>
        </FadeSlideIn>

        {/* ── Email field ── */}
        <FadeSlideIn delay={100}>
          <View style={s.fieldGroup}>
            <Text style={s.label}>EMAIL</Text>
            <View style={s.inputRow}>
              <Text style={s.inputIcon}>{"\uD83D\uDCE7"}</Text>
              <TextInput
                style={s.input}
                placeholder="student@school.ac.th"
                placeholderTextColor="rgba(232,244,255,0.4)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        </FadeSlideIn>

        {/* ── Password field ── */}
        <FadeSlideIn delay={160}>
          <View style={s.fieldGroup}>
            <Text style={s.label}>PASSWORD</Text>
            <View style={s.inputRow}>
              <Text style={s.inputIcon}>{"\uD83D\uDD12"}</Text>
              <TextInput
                style={s.input}
                placeholder="••••••••"
                placeholderTextColor="rgba(232,244,255,0.4)"
                secureTextEntry
              />
            </View>
          </View>
        </FadeSlideIn>

        {/* ── Forgot password ── */}
        <FadeSlideIn delay={200}>
          <TouchableOpacity activeOpacity={0.7} style={s.forgotWrap}>
            <Text style={s.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </FadeSlideIn>

        {/* ── Login button ── */}
        <FadeSlideIn delay={240}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.replace("/(tabs)")}
            style={s.loginOuter}
          >
            <LinearGradient
              colors={["#00c8ff", "#0d4eaa"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={s.loginBtn}
            >
              <Text style={s.loginBtnText}>LOGIN</Text>
            </LinearGradient>
          </TouchableOpacity>
        </FadeSlideIn>

        {/* ── Divider ── */}
        <FadeSlideIn delay={290}>
          <Text style={s.divider}>or continue with</Text>
        </FadeSlideIn>

        {/* ── Google button ── */}
        <FadeSlideIn delay={330}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={s.googleBtn}
            onPress={() => router.replace("/(tabs)")}
          >
            <View style={s.googleIconCircle}>
              <Text style={s.googleIconText}>G</Text>
            </View>
            <Text style={s.googleText}>Continue with Google</Text>
          </TouchableOpacity>
        </FadeSlideIn>

        {/* ── Create account ── */}
        <FadeSlideIn delay={370}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={s.createWrap}
            onPress={() => router.push("/register")}
          >
            <Text style={s.createText}>
              New cadet? <Text style={s.createLink}>CREATE ACCOUNT</Text>
            </Text>
          </TouchableOpacity>
        </FadeSlideIn>

        {/* ── Bottom banner ── */}
        <FadeSlideIn delay={420}>
          <View style={s.banner}>
            <Text style={s.bannerEmoji}>{"\uD83C\uDFC6"}</Text>
            <View>
              <Text style={s.bannerTitle}>Join 2,847 students</Text>
              <Text style={s.bannerSub}>Learning Physics through missions</Text>
            </View>
          </View>
        </FadeSlideIn>
      </ScrollView>
    </SafeAreaView>
  );
}

type Styles = {
  container: ViewStyle;
  scroll: ViewStyle;
  header: ViewStyle;
  logo: TextStyle;
  subtitle: TextStyle;
  fieldGroup: ViewStyle;
  label: TextStyle;
  inputRow: ViewStyle;
  inputIcon: TextStyle;
  input: TextStyle;
  forgotWrap: ViewStyle;
  forgotText: TextStyle;
  loginOuter: ViewStyle;
  loginBtn: ViewStyle;
  loginBtnText: TextStyle;
  divider: TextStyle;
  googleBtn: ViewStyle;
  googleIcon: ImageStyle;
  googleText: TextStyle;
  createWrap: ViewStyle;
  createText: TextStyle;
  createLink: TextStyle;
  banner: ViewStyle;
  bannerEmoji: TextStyle;
  bannerTitle: TextStyle;
  bannerSub: TextStyle;
};

const MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

const s = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: "#060d1e",
  },

  scroll: {
    paddingHorizontal: sw(28),
    paddingTop: sh(60),
    paddingBottom: sh(20),
  },

  /* ── Header ── */
  header: {
    alignItems: "center",
    marginBottom: sh(32),
  },
  logo: {
    fontFamily: MONO,
    fontWeight: "bold",
    fontSize: sw(28),
    color: "#00eeff",
    letterSpacing: sw(6),
    textAlign: "center",
  },
  subtitle: {
    fontSize: sw(12),
    color: "#8899aa",
    letterSpacing: sw(2),
    textAlign: "center",
    marginTop: 4,
  },

  /* ── Fields ── */
  fieldGroup: {
    marginBottom: sh(16),
  },
  label: {
    fontFamily: MONO,
    fontSize: sw(12),
    color: "#00c8ff",
    letterSpacing: sw(1),
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(10,22,40,0.8)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.2)",
    borderRadius: sw(12),
    height: sw(51),
    paddingHorizontal: sw(17),
    gap: sw(10),
  },
  inputIcon: {
    fontSize: sw(16),
    color: "#8899aa",
  },
  input: {
    flex: 1,
    fontSize: sw(14),
    color: "#e8f4ff",
  },

  /* ── Forgot ── */
  forgotWrap: {
    alignItems: "flex-end",
    marginBottom: sh(24),
  },
  forgotText: {
    fontSize: sw(12),
    color: "#00c8ff",
  },

  /* ── Login button ── */
  loginOuter: {
    borderRadius: sw(14),
    overflow: "hidden",
    shadowColor: "#00c8ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: sw(28),
    elevation: 10,
    marginBottom: sh(36),
  },
  loginBtn: {
    height: sw(52),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: sw(14),
  },
  loginBtnText: {
    fontSize: sw(15),
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: sw(1),
  },

  /* ── Divider ── */
  divider: {
    fontSize: sw(12),
    color: "#8899aa",
    textAlign: "center",
    marginBottom: sh(16),
  },

  /* ── Google ── */
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,22,40,0.8)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.2)",
    borderRadius: sw(12),
    height: sw(57),
    gap: sw(8),
    marginBottom: sh(28),
  },
  googleIconCircle: {
    width: sw(24),
    height: sw(24),
    borderRadius: sw(12),
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIconText: {
    fontSize: sw(14),
    fontWeight: "bold",
    color: "#4285F4",
  },
  googleText: {
    fontSize: sw(14),
    color: "#e8f4ff",
  },

  /* ── Create account ── */
  createWrap: {
    alignItems: "center",
    marginBottom: sh(40),
  },
  createText: {
    fontSize: sw(13),
    color: "#8899aa",
    textAlign: "center",
  },
  createLink: {
    fontWeight: "600",
    color: "#00c8ff",
  },

  /* ── Bottom banner ── */
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,200,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.15)",
    borderRadius: sw(12),
    height: sw(57),
    paddingHorizontal: sw(13),
    gap: sw(10),
  },
  bannerEmoji: {
    fontSize: sw(20),
  },
  bannerTitle: {
    fontSize: sw(12),
    fontWeight: "600",
    color: "#e8f4ff",
  },
  bannerSub: {
    fontSize: sw(11),
    color: "#8899aa",
  },
});
