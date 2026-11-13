import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, View, type PressableStateCallbackType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/icon";
import { C, MONO } from "@/constants/theme";
import type { IconName } from "@/lib/engine/types";
import { useL } from "@/lib/i18n";
import { makeStyles, useLayout } from "@/lib/layout";
import { href } from "@/lib/nav";
import { Text } from "@/lib/text";

const TAB_ICON: Record<string, IconName> = { home: "home", chapters: "book", ranks: "trophy", profile: "user" };

const hovered = (state: PressableStateCallbackType) => !!(state as { hovered?: boolean }).hovered;

/**
 * Primary navigation. A bottom bar on phones; a side rail on tablets (icons)
 * and desktops (icons + labels), where it also links to the lab and settings.
 */
export function NavBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const s = useStyles();
  const router = useRouter();
  const L = useL();
  const insets = useSafeAreaInsets();
  const { rail, bp } = useLayout();
  const labelled = bp === "desktop";

  const tabs = state.routes.map((route, index) => {
    const focused = state.index === index;
    const label = descriptors[route.key].options.title ?? route.name;
    const color = focused ? C.cyan : C.muted;
    return (
      <Pressable
        key={route.key}
        onPress={() => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        }}
        style={(st) => [rail ? s.railItem : s.barItem, rail && labelled && s.railItemWide, focused && rail && s.railItemOn, hovered(st) && !focused && s.hover]}
        accessibilityRole="tab"
        aria-selected={focused}
        accessibilityLabel={label}
      >
        <Icon name={TAB_ICON[route.name] ?? "home"} size={22} color={color} />
        {!rail || labelled ? <Text style={[rail ? s.railLabel : s.barLabel, { color }]}>{label}</Text> : null}
      </Pressable>
    );
  });

  if (!rail) {
    return (
      <View role="navigation" aria-label={L("Main", "เมนูหลัก")} style={[s.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={s.barTabs} accessibilityRole="tablist">
          {tabs}
        </View>
      </View>
    );
  }

  const extra = (icon: IconName, label: string, path: string) => (
    <Pressable
      onPress={() => router.push(href(path))}
      style={(st) => [s.railItem, labelled && s.railItemWide, hovered(st) && s.hover]}
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      <Icon name={icon} size={20} color={C.muted} />
      {labelled ? <Text style={[s.railLabel, { color: C.muted }]}>{label}</Text> : null}
    </Pressable>
  );

  return (
    <View
      role="navigation"
      aria-label={L("Main", "เมนูหลัก")}
      style={[s.rail, labelled && s.railWide, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 14 }]}
    >
      <Text style={[s.brand, !labelled && s.brandSmall]} accessibilityRole="header">
        {labelled ? "QEDify" : "QED"}
      </Text>
      <View style={s.railGroup} accessibilityRole="tablist">
        {tabs}
      </View>
      <View style={{ flex: 1 }} />
      <View style={s.railGroup}>
        {extra("flask", L("VIRTUAL LAB", "ห้องทดลอง"), "/lab")}
        {extra("gear", L("SETTINGS", "ตั้งค่า"), "/settings")}
      </View>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  bar: {
    flexDirection: "row",
    backgroundColor: "rgba(6,13,31,0.97)",
    borderTopWidth: 1,
    borderTopColor: C.line,
    paddingTop: 8,
  },
  barTabs: { flex: 1, flexDirection: "row" },
  barItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4, minHeight: 52, borderRadius: 12 },
  barLabel: { fontSize: 10, letterSpacing: 1, fontWeight: "600" },

  rail: {
    width: 84,
    backgroundColor: "rgba(6,13,31,0.97)",
    borderRightWidth: 1,
    borderRightColor: C.line,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  railWide: { width: 216, alignItems: "stretch", paddingHorizontal: 14 },
  brand: { fontFamily: MONO, fontSize: 22, fontWeight: "bold", color: C.cyanBright, letterSpacing: 4, marginBottom: 26, paddingHorizontal: 10 },
  brandSmall: { fontSize: 14, letterSpacing: 2, paddingHorizontal: 0 },
  railGroup: { gap: 6, alignSelf: "stretch" },
  railItem: { height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "transparent" },
  railItemWide: { flexDirection: "row", justifyContent: "flex-start", gap: 12, paddingHorizontal: 14 },
  railItemOn: { backgroundColor: "rgba(0,200,255,0.12)", borderColor: "rgba(0,200,255,0.35)" },
  railLabel: { fontFamily: MONO, fontSize: 12, letterSpacing: 1.5, fontWeight: "600" },
  hover: { backgroundColor: "rgba(0,200,255,0.07)" },
}));
