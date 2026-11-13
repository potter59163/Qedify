import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  TextInput,
  View,
  type PressableStateCallbackType,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/icon";
import { C, MONO } from "@/constants/theme";

import { useDialogFocus, useReduceMotion } from "./a11y";
import type { IconName } from "./engine/types";
import { useL } from "./i18n";
import { PAGE, makeStyles, tap, useLayout, useSw, type PageWidth } from "./layout";
import { Seo } from "./seo";
import { Text } from "./text";

// ───────────────────────── helpers ─────────────────────────

/** "1,250.5" / "−3" / " 4.8 " → number (NaN when not a number). */
export function parseNum(text: string): number {
  const t = text.replace(/[,\s]/g, "").replace(/−/g, "-");
  return t === "" || t === "-" || t === "." ? NaN : Number(t);
}

/** Web-only hover flag on Pressable state. */
const hovered = (state: PressableStateCallbackType) => !!(state as { hovered?: boolean }).hovered;

/**
 * Text that recomputes itself on an interval (countdowns). Keeping the timer
 * in this leaf means a ticking clock re-renders one Text, not a whole screen.
 */
export function LiveText({
  compute,
  intervalMs = 1000,
  style,
}: {
  compute: (now: Date) => string;
  intervalMs?: number;
  style?: StyleProp<TextStyle>;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return <Text style={style}>{compute(now)}</Text>;
}

const useStyles = makeStyles((sw) => ({
  screen: { flex: 1, backgroundColor: C.bg },
  pageScroll: { alignItems: "center" },
  pageInner: { width: "100%" },

  header: { backgroundColor: C.panel, borderBottomWidth: 1, borderBottomColor: C.line, alignItems: "center" },
  headerInner: { width: "100%", paddingHorizontal: sw(20), paddingBottom: sw(12) },
  headerTitle: { fontFamily: MONO, fontSize: sw(16), color: C.cyan, letterSpacing: 3 },
  headerSub: { fontSize: sw(12), color: C.muted, marginTop: sw(4) },

  topBarInner: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: sw(10),
    paddingHorizontal: sw(16),
    paddingBottom: sw(10),
  },
  backHit: { width: tap(sw), height: tap(sw), borderRadius: sw(22), alignItems: "center", justifyContent: "center", marginLeft: -sw(8) },
  backHover: { backgroundColor: "rgba(0,200,255,0.1)" },
  topTitle: { fontFamily: MONO, fontSize: sw(12), color: C.cyan, letterSpacing: 1 },
  topSub: { fontSize: sw(10.5), color: C.muted, marginTop: 1 },

  card: { backgroundColor: C.cardSoft, borderWidth: 1, borderColor: "rgba(0,200,255,0.15)", borderRadius: sw(14), padding: sw(16) },

  sectionLabel: { fontFamily: MONO, fontSize: sw(11), color: C.muted, letterSpacing: 2, marginBottom: sw(8), marginTop: sw(18) },

  kicker: { flexDirection: "row", alignItems: "center", gap: sw(6) },
  kickerText: { fontFamily: MONO, fontSize: sw(10), letterSpacing: 1.5 },

  btn: {
    height: tap(sw, 48),
    borderRadius: sw(14),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: sw(8),
    paddingHorizontal: sw(18),
  },
  btnSmall: { height: tap(sw), borderRadius: sw(10), paddingHorizontal: sw(14) },
  btnOutline: { borderWidth: 1, borderColor: C.edge },
  btnOff: { backgroundColor: "rgba(115,133,154,0.16)", borderWidth: 1, borderColor: C.lock },
  btnHover: { backgroundColor: "rgba(0,200,255,0.1)" },
  btnText: { fontFamily: MONO, fontSize: sw(14), fontWeight: "bold", color: "#ffffff", letterSpacing: 1 },
  btnTextSmall: { fontSize: sw(12) },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: sw(6),
    backgroundColor: "rgba(0,200,255,0.08)",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
    height: sw(34),
    paddingHorizontal: sw(12),
  },
  pillText: { fontFamily: MONO, fontSize: sw(13), fontWeight: "bold" },

  barBg: { height: sw(8), borderRadius: sw(4), backgroundColor: "rgba(0,200,255,0.12)", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: sw(4) },
  row: { flexDirection: "row", alignItems: "center" },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    backgroundColor: "rgba(0,0,0,0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: sw(24),
  },
  overlayBox: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "90%",
    backgroundColor: C.modal,
    borderWidth: 1,
    borderRadius: sw(18),
    overflow: "hidden",
  },
  overlayInner: { padding: sw(22), alignItems: "center" },
  overlayIcon: {
    width: sw(56),
    height: sw(56),
    borderRadius: sw(28),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: sw(12),
  },
  overlayTitle: { fontFamily: MONO, fontSize: sw(14), fontWeight: "bold", letterSpacing: 1, textAlign: "center", marginBottom: sw(12) },
  overlayBody: {
    fontFamily: MONO,
    fontSize: sw(12.5),
    color: C.text,
    lineHeight: sw(20),
    textAlign: "center",
    marginBottom: sw(14),
    alignSelf: "stretch",
  },

  fieldLabel: { fontFamily: MONO, fontSize: sw(9.5), color: C.muted, letterSpacing: 1, marginBottom: sw(4) },
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,200,255,0.08)",
    borderWidth: 1,
    borderColor: C.edge,
    borderRadius: sw(10),
    height: sw(48),
    paddingHorizontal: sw(12),
    gap: sw(6),
  },
  fieldFocus: { borderColor: C.cyan },
  fieldInput: { flex: 1, minWidth: 0, fontFamily: MONO, fontSize: sw(16), fontWeight: "bold", color: C.text, padding: 0, outlineWidth: 0 },
  fieldUnit: { fontFamily: MONO, fontSize: sw(10), color: C.muted },

  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: sw(12),
    backgroundColor: "rgba(0,200,255,0.06)",
    borderWidth: 1,
    borderColor: C.edge,
    borderRadius: sw(12),
    paddingVertical: sw(11),
    paddingHorizontal: sw(14),
    minHeight: sw(54),
  },
  optionHover: { borderColor: "rgba(0,200,255,0.8)" },
  optionOn: { borderColor: C.cyan, backgroundColor: "rgba(0,200,255,0.14)" },
  optionLabel: { fontSize: sw(14), fontWeight: "600", color: C.text },
  optionDetail: { fontSize: sw(11), color: C.muted, marginTop: 1 },
  radio: { width: sw(18), height: sw(18), borderRadius: sw(9), borderWidth: 1.5, borderColor: C.dim, alignItems: "center", justifyContent: "center" },
  radioDot: { width: sw(9), height: sw(9), borderRadius: sw(5), backgroundColor: C.cyan },

  split: { flexDirection: "row", alignItems: "flex-start" },
  splitCol: { flex: 1, minWidth: 0 },
}));

// ───────────────────────── layout pieces ─────────────────────────

export function Screen({ children }: { children: React.ReactNode }) {
  const s = useStyles();
  return (
    <View style={s.screen}>
      <StatusBar style="light" />
      {children}
    </View>
  );
}

/**
 * Sets the browser tab title while this screen is the one in view, so each
 * screen has its own title (WCAG 2.4.2). Screens stay mounted underneath the
 * current one, which is why only the focused screen may set it.
 */
export function PageTitle({ title }: { title: string }) {
  const focused = useIsFocused();
  return focused ? <Seo title={title} index={false} /> : null;
}

/** Scrolling page body, centred and capped at a readable width on large screens. */
export function Page({
  children,
  width = "text",
  pad = true,
  bottom = 32,
}: {
  children: React.ReactNode;
  width?: PageWidth;
  pad?: boolean;
  bottom?: number;
}) {
  const s = useStyles();
  const sw = useSw();
  return (
    <ScrollView
      contentContainerStyle={[s.pageScroll, { paddingBottom: bottom }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View role="main" style={[s.pageInner, { maxWidth: PAGE[width] }, pad && { paddingHorizontal: sw(20) }]}>
        {children}
      </View>
    </ScrollView>
  );
}

/** Two columns on wide windows, stacked on phones. */
export function Split({ left, right, gap = 24 }: { left: React.ReactNode; right: React.ReactNode; gap?: number }) {
  const s = useStyles();
  const { width, bp } = useLayout();
  if (bp === "phone" || width < 900) {
    return (
      <>
        {left}
        {right}
      </>
    );
  }
  return (
    <View style={[s.split, { gap }]}>
      <View style={s.splitCol}>{left}</View>
      <View style={s.splitCol}>{right}</View>
    </View>
  );
}

/** Header for the four tab screens. */
export function TabHeader({
  title,
  subtitle,
  children,
  width = "text",
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  width?: PageWidth;
}) {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View role="banner" style={[s.header, { paddingTop: insets.top + 14 }]}>
      <PageTitle title={title} />
      <View style={[s.headerInner, { maxWidth: PAGE[width] }]}>
        <Text style={s.headerTitle} role="heading" aria-level={1}>
          {title}
        </Text>
        {subtitle ? <Text style={s.headerSub}>{subtitle}</Text> : null}
        {children}
      </View>
    </View>
  );
}

/** Header for pushed screens, with a back button. */
export function TopBar({
  title,
  subtitle,
  onBack,
  right,
  width = "text",
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  right?: React.ReactNode;
  width?: PageWidth;
}) {
  const s = useStyles();
  const sw = useSw();
  const L = useL();
  const insets = useSafeAreaInsets();
  return (
    <View role="banner" style={[s.header, { paddingTop: insets.top + 8 }]}>
      <PageTitle title={title} />
      <View style={[s.topBarInner, { maxWidth: PAGE[width] }]}>
        <Pressable
          onPress={onBack}
          style={(st) => [s.backHit, hovered(st) && s.backHover]}
          accessibilityRole="button"
          accessibilityLabel={L("Go back", "ย้อนกลับ")}
          hitSlop={8}
        >
          <Icon name="arrow-left" size={sw(22)} color={C.cyan} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.topTitle} numberOfLines={1} role="heading" aria-level={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={s.topSub} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}

const CARD_TONES = {
  cyan: { backgroundColor: C.cardSoft, borderColor: "rgba(0,200,255,0.15)" },
  solid: { backgroundColor: C.card, borderColor: C.line },
  purple: { backgroundColor: "rgba(91,69,224,0.1)", borderColor: "rgba(91,69,224,0.3)" },
  orange: { backgroundColor: "rgba(255,168,39,0.06)", borderColor: "rgba(255,168,39,0.25)" },
  red: { backgroundColor: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.22)" },
  green: { backgroundColor: "rgba(0,255,159,0.06)", borderColor: "rgba(0,255,159,0.25)" },
} as const;

export function Card({
  children,
  tone = "cyan",
  style,
}: {
  children: React.ReactNode;
  tone?: keyof typeof CARD_TONES;
  style?: StyleProp<ViewStyle>;
}) {
  const s = useStyles();
  return <View style={[s.card, CARD_TONES[tone], style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: string }) {
  const s = useStyles();
  return (
    <Text style={s.sectionLabel} role="heading" aria-level={2}>
      {children}
    </Text>
  );
}

/** Small icon + caps label, used as the title line of cards. */
export function Kicker({ icon, text, color = C.cyan, style }: { icon?: IconName; text: string; color?: string; style?: StyleProp<ViewStyle> }) {
  const s = useStyles();
  const sw = useSw();
  return (
    <View style={[s.kicker, style]}>
      {icon ? <Icon name={icon} size={sw(13)} color={color} /> : null}
      <Text style={[s.kickerText, { color }]}>{text}</Text>
    </View>
  );
}

// ───────────────────────── controls ─────────────────────────

type BtnTone = "primary" | "orange" | "outline" | "quiet";

export function Btn({
  label,
  onPress,
  tone = "primary",
  disabled = false,
  small = false,
  icon,
  iconRight,
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: BtnTone;
  disabled?: boolean;
  small?: boolean;
  icon?: IconName;
  iconRight?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const s = useStyles();
  const sw = useSw();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const filled = tone === "primary" || tone === "orange";
  // A filled button that cannot be pressed turns neutral grey, so it never reads as a second brand colour.
  const off = disabled && filled;
  const color = off ? C.muted : tone === "primary" ? "#ffffff" : tone === "orange" ? C.onOrange : tone === "outline" ? C.cyan : C.muted;
  const iconSize = sw(small ? 14 : 17);
  const content = (
    <>
      {icon ? <Icon name={icon} size={iconSize} color={color} /> : null}
      <Text style={[s.btnText, small && s.btnTextSmall, { color }, tone === "quiet" && { fontWeight: "normal" }]} numberOfLines={1}>
        {label}
      </Text>
      {iconRight ? <Icon name={iconRight} size={iconSize} color={color} /> : null}
    </>
  );
  return (
    <Animated.View style={[anim, disabled && !filled && { opacity: 0.45 }, style]}>
      <Pressable
        accessibilityRole="button"
        aria-disabled={disabled}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        style={(st) => [
          { borderRadius: sw(small ? 10 : 14) },
          !filled && hovered(st) && !disabled && s.btnHover,
          filled && hovered(st) && !disabled && { opacity: 0.92 },
        ]}
      >
        {filled && !disabled ? (
          <LinearGradient
            colors={tone === "primary" ? [C.blueTop, C.blue] : [C.orange, C.orangeDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[
              s.btn,
              small && s.btnSmall,
              !disabled && { boxShadow: tone === "primary" ? "0 0 18px rgba(0,200,255,0.4)" : "0 0 14px rgba(255,168,39,0.4)" },
            ]}
          >
            {content}
          </LinearGradient>
        ) : (
          <View style={[s.btn, small && s.btnSmall, tone === "outline" && s.btnOutline, off && s.btnOff]}>{content}</View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function Pill({ icon, text, color = C.cyan }: { icon: IconName; text: string; color?: string }) {
  const s = useStyles();
  const sw = useSw();
  return (
    <View style={s.pill}>
      <Icon name={icon} size={sw(15)} color={color} />
      <Text style={[s.pillText, { color }]}>{text}</Text>
    </View>
  );
}

/** Progress bar that animates to `pct` (0–100). */
export function Bar({ pct, color = C.cyan, delay = 0, label }: { pct: number; color?: string; delay?: number; label?: string }) {
  const s = useStyles();
  const reduced = useReduceMotion();
  const target = Math.max(0, Math.min(100, pct));
  const w = useSharedValue(reduced ? target : 0);
  useEffect(() => {
    w.value = reduced ? target : withDelay(delay, withTiming(target, { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, [target, delay, reduced, w]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return (
    <View
      style={s.barBg}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(target)}
    >
      <Animated.View style={[s.barFill, { backgroundColor: color }, fill]} />
    </View>
  );
}

export function Hearts({ left, max = 3 }: { left: number; max?: number }) {
  const s = useStyles();
  const sw = useSw();
  const L = useL();
  return (
    <View style={[s.row, { gap: 2 }]} accessible role="img" accessibilityLabel={L(`${left} of ${max} hearts left`, `เหลือหัวใจ ${left} จาก ${max} ดวง`)}>
      {Array.from({ length: max }).map((_, i) => (
        <Icon key={i} name="heart" size={sw(15)} color={i < left ? C.red : C.off} />
      ))}
    </View>
  );
}

export function Stars({ count, max = 3, size = 13 }: { count: number; max?: number; size?: number }) {
  const s = useStyles();
  const sw = useSw();
  const L = useL();
  return (
    <View style={[s.row, { gap: 2 }]} accessible role="img" accessibilityLabel={L(`${count} of ${max} stars`, `${count} จาก ${max} ดาว`)}>
      {Array.from({ length: max }).map((_, i) => (
        <Icon key={i} name="star" size={sw(size)} color={i < count ? C.orange : C.off} />
      ))}
    </View>
  );
}

// ───────────────────────── overlay (modal) ─────────────────────────

const OVERLAY_TONE = { orange: C.orange, cyan: C.cyan, red: C.red, green: C.green } as const;

/** Modal dialog. Render it as the last child of a Screen. */
export function Overlay({
  visible,
  icon,
  title,
  body,
  tone = "orange",
  onClose,
  children,
}: {
  /** Called when the learner presses Escape. Leave out for a dialog that needs a choice. */
  onClose?: () => void;
  visible: boolean;
  icon?: IconName;
  title: string;
  body?: string;
  tone?: keyof typeof OVERLAY_TONE;
  children?: React.ReactNode;
}) {
  const s = useStyles();
  const sw = useSw();
  // Moves focus into the dialog, keeps Tab inside it and makes the page behind it inert.
  const ref = useDialogFocus(visible, onClose);
  if (!visible) return null;
  const color = OVERLAY_TONE[tone];
  return (
    <View ref={ref} tabIndex={-1} style={s.overlay} accessibilityViewIsModal role="dialog" aria-modal aria-label={title}>
      <OverlayBox color={color}>
        {icon ? (
          <View style={[s.overlayIcon, { borderColor: color, backgroundColor: color + "1f" }]}>
            <Icon name={icon} size={sw(28)} color={color} />
          </View>
        ) : null}
        <Text style={[s.overlayTitle, { color }]} role="heading" aria-level={2}>
          {title}
        </Text>
        {body ? <Text style={s.overlayBody}>{body}</Text> : null}
        {children}
      </OverlayBox>
    </View>
  );
}

function OverlayBox({ color, children }: { color: string; children: React.ReactNode }) {
  const s = useStyles();
  const reduced = useReduceMotion();
  const t = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced) t.value = withSpring(1, { damping: 16, stiffness: 180 });
  }, [reduced, t]);
  const anim = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ scale: 0.92 + 0.08 * t.value }] }));
  return (
    <Animated.View style={[s.overlayBox, { borderColor: color + "73" }, anim]}>
      <ScrollView contentContainerStyle={s.overlayInner} bounces={false} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </Animated.View>
  );
}

// ───────────────────────── inputs ─────────────────────────

export function NumberField({
  label,
  value,
  onChangeText,
  unit,
  good = false,
  editable = true,
  onSubmit,
  style,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  unit: string;
  good?: boolean;
  editable?: boolean;
  onSubmit?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const s = useStyles();
  const L = useL();
  const [focused, setFocused] = useState(false);
  return (
    <View style={style}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View
        style={[
          s.fieldBox,
          focused && s.fieldFocus,
          good && { borderColor: "rgba(0,255,159,0.5)", backgroundColor: "rgba(0,255,159,0.06)" },
        ]}
      >
        <TextInput
          style={[s.fieldInput, good && { color: C.green }]}
          value={value}
          onChangeText={(t) => onChangeText(t.replace(/[^0-9.,\-−]/g, ""))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
          inputMode="decimal"
          keyboardType="numbers-and-punctuation"
          keyboardAppearance="dark"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          placeholder="0"
          placeholderTextColor={C.dim}
          selectTextOnFocus
          accessibilityLabel={L(`${label} in ${unit}`, `${label} หน่วย ${unit}`)}
        />
        <Text style={s.fieldUnit}>{unit}</Text>
      </View>
    </View>
  );
}

export function OptionCard({
  icon,
  label,
  detail,
  selected,
  onPress,
  disabled,
}: {
  icon?: IconName;
  label: string;
  detail?: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const s = useStyles();
  const sw = useSw();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={(st) => [s.option, hovered(st) && s.optionHover, selected && s.optionOn]}
      accessibilityRole="radio"
      aria-checked={selected}
    >
      {icon ? <Icon name={icon} size={sw(22)} color={selected ? C.cyan : C.muted} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.optionLabel, selected && { color: C.cyan }]}>{label}</Text>
        {detail ? <Text style={s.optionDetail}>{detail}</Text> : null}
      </View>
      <View style={[s.radio, selected && { borderColor: C.cyan }]}>{selected ? <View style={s.radioDot} /> : null}</View>
    </Pressable>
  );
}

// ───────────────────────── decoration ─────────────────────────

function Twinkle({ left, top, size, delay }: { left: `${number}%`; top: `${number}%`; size: number; delay: number }) {
  const reduced = useReduceMotion();
  const o = useSharedValue(0.35);
  useEffect(() => {
    if (reduced) {
      cancelAnimation(o);
      o.value = 0.5;
      return;
    }
    const dur = 900 + ((delay * 7) % 700);
    o.value = withDelay(
      delay % 1600,
      withRepeat(withSequence(withTiming(0.85, { duration: dur }), withTiming(0.1, { duration: dur })), -1, false),
    );
  }, [delay, reduced, o]);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={[{ position: "absolute", left, top, width: size, height: size, borderRadius: size / 2, backgroundColor: C.text }, a]}
    />
  );
}

/**
 * Twinkling star field that fills its parent. Positions are percentages from
 * a fixed formula, so the markup is identical on the server and the client.
 */
export const Starfield = React.memo(function Starfield({ count = 18 }: { count?: number }) {
  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <Twinkle
          key={i}
          left={`${Math.round((Math.sin(i * 2.39) * 0.5 + 0.5) * 960) / 10 + 2}%`}
          top={`${Math.round((Math.cos(i * 1.61) * 0.5 + 0.5) * 940) / 10 + 2}%`}
          size={i % 4 === 0 ? 3 : i % 4 === 1 ? 1.5 : i % 4 === 2 ? 2.5 : 2}
          delay={i * 190}
        />
      ))}
    </View>
  );
});
