import React, { ReactNode } from "react";
import { Pressable, StyleProp, ViewStyle } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

interface Props {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  /** Scale factor when pressed, default 0.95 */
  scaleAmount?: number;
  disabled?: boolean;
}

/**
 * A Pressable that scales down smoothly on press using Reanimated.
 * Drop-in replacement for TouchableOpacity where you want a native-thread
 * scale animation.
 */
export function PressableScale({
  onPress,
  style,
  children,
  scaleAmount = 0.95,
  disabled = false,
}: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animStyle, style]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(scaleAmount, {
            damping: 15,
            stiffness: 400,
          });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={disabled ? undefined : onPress}
        style={{ flex: 1 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
