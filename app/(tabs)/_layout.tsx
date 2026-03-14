import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Platform } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from "react-native-reanimated";

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];

function TabIcon({
  name,
  color,
  focused,
}: {
  name: MaterialIconName;
  color: string;
  focused: boolean;
}) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withSpring(1.28, { damping: 8, stiffness: 350 }),
        withSpring(1, { damping: 14, stiffness: 250 }),
      );
      translateY.value = withSequence(
        withSpring(-4, { damping: 10, stiffness: 400 }),
        withSpring(0, { damping: 14, stiffness: 250 }),
      );
    } else {
      scale.value = withSpring(1, { damping: 14, stiffness: 250 });
      translateY.value = withSpring(0, { damping: 14, stiffness: 250 });
    }
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <MaterialIcons name={name} size={22} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#00c8ff",
        tabBarInactiveTintColor: "#8899aa",
        tabBarStyle: {
          backgroundColor: "rgba(6,13,31,0.97)",
          borderTopColor: "rgba(0,200,255,0.2)",
          borderTopWidth: 1,
          height: 82,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 24 : 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          letterSpacing: 1,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "HOME",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chapters"
        options={{
          title: "CHAPTERS",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="menu-book" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ranks"
        options={{
          title: "RANKS",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="military-tech" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "PROFILE",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="person" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
