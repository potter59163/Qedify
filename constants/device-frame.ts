import { Dimensions, Platform } from "react-native";

export const DESKTOP_WEB_MIN_WIDTH = 900;
export const PHONE_FRAME_WIDTH = 390;

const PHONE_FRAME_MIN_HEIGHT = 680;
const PHONE_FRAME_MAX_HEIGHT = 844;
const PHONE_FRAME_VERTICAL_PADDING = 48;

export function getPhoneFrameHeight(windowHeight: number) {
  return Math.min(
    PHONE_FRAME_MAX_HEIGHT,
    Math.max(PHONE_FRAME_MIN_HEIGHT, windowHeight - PHONE_FRAME_VERTICAL_PADDING),
  );
}

export function isDesktopWebViewport(windowWidth: number) {
  return Platform.OS === "web" && windowWidth >= DESKTOP_WEB_MIN_WIDTH;
}

export function getPhoneFrameWindow() {
  const { width, height } = Dimensions.get("window");
  if (isDesktopWebViewport(width)) {
    return { width: PHONE_FRAME_WIDTH, height: getPhoneFrameHeight(height) };
  }
  return { width, height };
}