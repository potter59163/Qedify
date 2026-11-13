import { Tabs } from "expo-router";
import React from "react";

import { NavBar } from "@/components/nav-bar";
import { C } from "@/constants/theme";
import { useL, type Bi } from "@/lib/i18n";
import { useLayout } from "@/lib/layout";

const TABS: { name: string; title: Bi }[] = [
  { name: "home", title: ["HOME", "หน้าหลัก"] },
  { name: "chapters", title: ["CHAPTERS", "บทเรียน"] },
  { name: "ranks", title: ["RANKS", "อันดับ"] },
  { name: "profile", title: ["PROFILE", "โปรไฟล์"] },
];

export default function TabLayout() {
  const { rail } = useLayout();
  const L = useL();
  return (
    <Tabs
      tabBar={(props) => <NavBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: C.bg },
        // Bottom bar on phones, side rail on tablets and desktops.
        tabBarPosition: rail ? "left" : "bottom",
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: L(...t.title) }} />
      ))}
    </Tabs>
  );
}
