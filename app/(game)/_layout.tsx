import { Redirect, Stack } from "expo-router";
import { View } from "react-native";

import { C } from "@/constants/theme";
import { href } from "@/lib/nav";
import { Seo } from "@/lib/seo";
import { useGame } from "@/lib/store";

/**
 * Everything in this group needs a cadet profile. Opening one of these URLs
 * directly (deep link, refresh) waits for storage, then either renders the
 * screen or sends the visitor to the landing page. These screens are personal,
 * so search engines are told not to index them.
 */
export default function GameLayout() {
  const { state, ready } = useGame();
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Seo title="Mission control" index={false} />
      </View>
    );
  }
  if (!state.profile) return <Redirect href={href("/")} />;
  return (
    <>
      <Seo title="Mission control" index={false} />
      <Stack screenOptions={{ headerShown: false, animation: "slide_from_right", contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
        <Stack.Screen name="results" options={{ animation: "fade", gestureEnabled: false }} />
      </Stack>
    </>
  );
}
