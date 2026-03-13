import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import {
  getPhoneFrameHeight,
  isDesktopWebViewport,
  PHONE_FRAME_WIDTH,
} from "@/constants/device-frame";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "splash",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { width, height } = useWindowDimensions();
  const isDesktopWeb = isDesktopWebViewport(width);
  const phoneHeight = getPhoneFrameHeight(height);

  const appNavigator = (
    <Stack>
      <Stack.Screen name="splash" options={{ headerShown: false }} />
      <Stack.Screen
        name="onboarding"
        options={{ headerShown: false, animation: "fade" }}
      />
      <Stack.Screen
        name="login"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="register"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="tutorial"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="orbital-rescue"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="the-junction"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="results"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="modal"
        options={{ presentation: "modal", title: "Modal" }}
      />
    </Stack>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        {isDesktopWeb ? (
          <View style={styles.desktopStage}>
            <View style={[styles.phoneFrame, { height: phoneHeight }]}>{appNavigator}</View>
          </View>
        ) : (
          appNavigator
        )}
        <StatusBar style="light" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  desktopStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a1020",
    paddingVertical: 24,
  },
  phoneFrame: {
    width: PHONE_FRAME_WIDTH,
    maxWidth: "92%",
    borderRadius: 40,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "#010409",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
});
