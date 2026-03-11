import React, { ReactNode, useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from "react-native-reanimated";

interface Props {
  delay?: number;
  offsetY?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/**
 * Wraps children in a fade + slide-up animation that plays on mount.
 * Use `delay` (ms) and `offsetY` (px) to stagger items.
 */
export function FadeSlideIn({
  delay = 0,
  offsetY = 24,
  style,
  children,
}: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(offsetY);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 380 }));
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 22, stiffness: 160, mass: 0.8 }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}
