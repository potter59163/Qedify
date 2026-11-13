import React from "react";
import { Platform, Text as RNText, StyleSheet, type TextProps, type TextStyle } from "react-native";

/**
 * Drop-in replacement for React Native's Text.
 *
 * The interface uses small, letter-spaced monospace labels, a look made for
 * capital Latin letters. Thai has no capitals, and its vowels and tone marks
 * sit above and below the consonants: letter-spacing pulls the clusters
 * apart, a monospace stack falls back to an unrelated font, and anything
 * under 12 px is hard to read. So when the content contains Thai, this
 * component removes the letter-spacing, switches to the system Thai font,
 * raises the size to at least 12 px and gives former "caps" labels weight
 * instead of spacing. Numbers, formulas and English text are left alone.
 */
const THAI = /[฀-๿]/;
const MIN_SIZE = 12;

const THAI_FONT = Platform.select({
  web: 'system-ui, -apple-system, "Segoe UI", "Noto Sans Thai", "Leelawadee UI", Tahoma, sans-serif',
  default: "System",
});

function hasThai(node: React.ReactNode): boolean {
  if (typeof node === "string") return THAI.test(node);
  if (Array.isArray(node)) return node.some(hasThai);
  if (React.isValidElement(node)) return hasThai((node.props as { children?: React.ReactNode }).children);
  return false;
}

export function Text({ style, children, ...rest }: TextProps) {
  if (!hasThai(children)) {
    return (
      <RNText style={style} {...rest}>
        {children}
      </RNText>
    );
  }
  const flat = StyleSheet.flatten(style) ?? {};
  const thai: TextStyle = { fontFamily: THAI_FONT, letterSpacing: 0 };
  // Only a size given in pixels is raised. A nested Text with no size keeps
  // inheriting its parent's, and a CSS size such as clamp() is left as it is.
  if (typeof flat.fontSize === "number") {
    const size = Math.max(flat.fontSize, MIN_SIZE);
    thai.fontSize = size;
    // Thai needs more room between lines than Latin text of the same size.
    if (typeof flat.lineHeight === "number") thai.lineHeight = Math.max(flat.lineHeight, Math.round(size * 1.5));
  }
  // A label that was set apart by letter-spacing is set apart by weight instead.
  if ((flat.letterSpacing ?? 0) >= 1 && !flat.fontWeight) thai.fontWeight = "600";
  return (
    <RNText style={[style, thai]} {...rest}>
      {children}
    </RNText>
  );
}
