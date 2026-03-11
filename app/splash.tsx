import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Image,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";

const { width: W, height: H } = Dimensions.get("window");

const WORLD_IMG =
  "https://www.figma.com/api/mcp/asset/4a9c2d91-a3db-41ad-b3a2-bee43513f213";

// Design reference: 388 x 812 frame
const sw = (n: number) => (n / 388) * W;
const sh = (n: number) => (n / 812) * H;

export default function SplashScreen() {
  const router = useRouter();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2800,
      useNativeDriver: false,
    }).start(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace("/onboarding" as any);
    });
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, sw(130)], // ~65% of the 200px track
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── Orbital Globe ── */}
      <View
        style={[styles.globeAnchor, { top: sh(235.7), left: W / 2 - sw(80) }]}
      >
        {/* Diamond ring (rotated square) */}
        <View style={styles.diamondRingWrapper}>
          <View style={styles.diamondRing} />
        </View>
        {/* Circle ring */}
        <View style={styles.circleRingWrapper}>
          <View style={styles.circleRing} />
        </View>
        {/* Inner square ring */}
        <View style={styles.innerSquareWrapper}>
          <View style={styles.innerSquare} />
        </View>
        {/* Earth glow core */}
        <View style={styles.globeGlow} />
        {/* World image overlay */}
        <Image
          source={{ uri: WORLD_IMG }}
          style={styles.worldImage}
          resizeMode="cover"
        />
        {/* Sun / orange star */}
        <View style={styles.orangeDot} />
      </View>

      {/* ── Title block ── */}
      <View style={[styles.titleBlock, { top: sh(415.7) }]}>
        <Text style={styles.titleText}>QEDify</Text>
        <Text style={styles.subtitleText}>MOMENTUM · PHYSICS · MASTERY</Text>
      </View>

      {/* ── Tagline ── */}
      <View style={[styles.taglineBlock, { top: sh(502.7) }]}>
        <Text style={styles.taglineText}>
          Learn Physics through Space Rescue Missions
        </Text>
      </View>

      {/* ── Progress ── */}
      <View style={[styles.progressBlock, { top: sh(584.3) }]}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width: progressWidth }]}
          />
        </View>
        <Text style={styles.progressLabel}>
          INITIALIZING MISSION SYSTEMS...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060d1e",
  },

  /* ─ Globe ─ */
  globeAnchor: {
    position: "absolute",
    width: sw(160),
    height: sw(160),
  },

  diamondRingWrapper: {
    position: "absolute",
    width: sw(226),
    height: sw(226),
    top: -sw(33),
    left: -sw(33),
    alignItems: "center",
    justifyContent: "center",
  },
  diamondRing: {
    width: sw(160),
    height: sw(160),
    borderWidth: 1,
    borderColor: "rgba(0,200,255,0.25)",
    transform: [{ rotate: "45deg" }],
  },

  circleRingWrapper: {
    position: "absolute",
    top: sw(16),
    left: sw(16),
  },
  circleRing: {
    width: sw(128),
    height: sw(128),
    borderRadius: sw(64),
    borderWidth: 1,
    borderColor: "rgba(0,255,213,0.2)",
  },

  innerSquareWrapper: {
    position: "absolute",
    top: sw(32),
    left: sw(32),
  },
  innerSquare: {
    width: sw(96),
    height: sw(96),
    borderWidth: 1,
    borderColor: "rgba(91,69,224,0.3)",
  },

  globeGlow: {
    position: "absolute",
    top: sw(50),
    left: sw(50),
    width: sw(60),
    height: sw(60),
    borderRadius: sw(30),
    backgroundColor: "#0a3d8a",
    shadowColor: "#00c8ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 12,
  },

  worldImage: {
    position: "absolute",
    width: sw(222),
    height: sw(121),
    top: sw(19),
    left: -sw(31),
  },

  orangeDot: {
    position: "absolute",
    width: sw(10),
    height: sw(10),
    borderRadius: sw(5),
    backgroundColor: "#ffa827",
    top: sw(8),
    left: sw(75),
    shadowColor: "#ffa827",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },

  /* ─ Title ─ */
  titleBlock: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  titleText: {
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontSize: sw(42),
    fontWeight: "bold",
    color: "#00eeff",
    letterSpacing: sw(8),
    textAlign: "center",
  },
  subtitleText: {
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontSize: sw(11),
    color: "rgba(0,200,255,0.5)",
    letterSpacing: sw(3),
    textAlign: "center",
    marginTop: 4,
  },

  /* ─ Tagline ─ */
  taglineBlock: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  taglineText: {
    fontSize: sw(13),
    color: "rgba(0,200,255,0.6)",
    letterSpacing: sw(3),
    textAlign: "center",
    lineHeight: sw(20.8),
  },

  /* ─ Progress ─ */
  progressBlock: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  progressTrack: {
    width: sw(200),
    height: 3,
    backgroundColor: "rgba(0,200,255,0.15)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "#00c8ff",
    shadowColor: "#00c8ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  progressLabel: {
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontSize: sw(10),
    color: "rgba(0,200,255,0.5)",
    letterSpacing: sw(2),
    marginTop: 8,
  },
});
