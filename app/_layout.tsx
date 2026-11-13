import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { Platform, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { C } from "@/constants/theme";
import { useLang } from "@/lib/i18n";
import { LayoutProvider, useWindowLayout } from "@/lib/layout";
import { GameProvider } from "@/lib/store";

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: C.bg, card: C.bg, border: C.line, primary: C.cyan, text: C.text },
};

/** Keeps <html lang> in step with the chosen language, for screen readers and browser translation prompts. */
function DocumentLanguage() {
  const lang = useLang();
  useEffect(() => {
    if (Platform.OS === "web") document.documentElement.lang = lang;
  }, [lang]);
  return null;
}

export default function RootLayout() {
  // Server render and hydration use a default phone layout; the real window
  // size takes over right after, so the two renders always match.
  const layout = useWindowLayout();

  // Offline support: the production build ships a service worker (scripts/postbuild.js).
  useEffect(() => {
    if (Platform.OS !== "web" || process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <GameProvider>
        <DocumentLanguage />
        <LayoutProvider value={layout}>
          <ThemeProvider value={theme}>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                contentStyle: { backgroundColor: C.bg },
              }}
            >
              <Stack.Screen name="index" options={{ animation: "fade" }} />
              <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
              <Stack.Screen name="(game)" options={{ animation: "fade" }} />
            </Stack>
          </ThemeProvider>
        </LayoutProvider>
      </GameProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
});
