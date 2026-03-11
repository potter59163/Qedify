import { useEffect } from "react";
import {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from "react-native-reanimated";

/**
 * Fade + slide-up entry animation.
 * @param delay    ms before animation starts
 * @param offsetY  initial vertical offset in px, default 28
 */
export function useEnterAnimation(delay = 0, offsetY = 28) {
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

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}
