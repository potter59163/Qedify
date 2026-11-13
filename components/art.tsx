import React from "react";
import { View } from "react-native";
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, Path, RadialGradient, Rect, Stop } from "react-native-svg";

import { AVATAR_COLOR, C } from "@/constants/theme";
import type { ArtName } from "@/lib/engine/types";

const HULL = "#dbeafe";
const SHADE = "#9fb8d6";
const NAVY = "#0d2a55";

/** Every object is drawn on a 48 × 48 grid, facing right. */
const ART: Record<ArtName, React.ReactNode> = {
  rocket: (
    <>
      <Path d="M9 19 1 24l8 5z" fill={C.orange} />
      <Path d="M12 15 5 8v12zM12 33 5 40V28z" fill={C.orange} />
      <Path d="M10 15h17c9 0 16 6 18 9-2 3-9 9-18 9H10z" fill={HULL} />
      <Path d="M35 17.4c4 2 8 5 10 6.6-2 1.6-6 4.6-10 6.6z" fill={C.cyan} />
      <Circle cx={25} cy={24} r={4.2} fill={NAVY} stroke={C.cyan} strokeWidth={1.5} />
    </>
  ),
  satellite: (
    <>
      <Rect x={2} y={18} width={13} height={12} rx={1.5} fill={NAVY} stroke={C.cyan} strokeWidth={1.3} />
      <Rect x={33} y={18} width={13} height={12} rx={1.5} fill={NAVY} stroke={C.cyan} strokeWidth={1.3} />
      <Path d="M8.5 18v12M39.5 18v12M2 24h13M33 24h13" stroke={C.cyan} strokeWidth={1} />
      <Rect x={17} y={14} width={14} height={20} rx={3} fill={HULL} />
      <Rect x={20} y={19} width={8} height={5} rx={1} fill={SHADE} />
      <Line x1={24} y1={14} x2={24} y2={8} stroke={SHADE} strokeWidth={1.6} />
      <Circle cx={24} cy={7} r={2.2} fill={C.orange} />
    </>
  ),
  saucer: (
    <>
      <Path d="M13 25a11 11 0 0 1 22 0z" fill={C.cyan} opacity={0.85} />
      <Ellipse cx={24} cy={28} rx={21} ry={7} fill={HULL} />
      <Ellipse cx={24} cy={30} rx={21} ry={5} fill={SHADE} opacity={0.5} />
      <Circle cx={11} cy={28.5} r={1.9} fill={C.orange} />
      <Circle cx={24} cy={31} r={1.9} fill={C.orange} />
      <Circle cx={37} cy={28.5} r={1.9} fill={C.orange} />
    </>
  ),
  pod: (
    <>
      <Rect x={3} y={11} width={42} height={21} rx={5} fill={HULL} />
      <Rect x={3} y={25} width={42} height={3.5} fill={C.orange} />
      <Rect x={8} y={15} width={8} height={7} rx={1.5} fill={NAVY} stroke={C.cyan} strokeWidth={1.2} />
      <Rect x={20} y={15} width={8} height={7} rx={1.5} fill={NAVY} stroke={C.cyan} strokeWidth={1.2} />
      <Rect x={32} y={15} width={8} height={7} rx={1.5} fill={NAVY} stroke={C.cyan} strokeWidth={1.2} />
      <Circle cx={13} cy={36} r={4} fill="#334a66" stroke={C.cyan} strokeWidth={1.3} />
      <Circle cx={35} cy={36} r={4} fill="#334a66" stroke={C.cyan} strokeWidth={1.3} />
    </>
  ),
  astronaut: (
    <>
      <Rect x={12} y={22} width={24} height={19} rx={5} fill={SHADE} />
      <Rect x={7} y={26} width={8} height={6} rx={3} fill={HULL} />
      <Rect x={33} y={26} width={8} height={6} rx={3} fill={HULL} />
      <Rect x={15} y={24} width={18} height={19} rx={6} fill={HULL} />
      <Rect x={21} y={30} width={6} height={4} rx={1} fill={C.orange} />
      <Circle cx={24} cy={15} r={10.5} fill={HULL} />
      <Rect x={16.5} y={10} width={15} height={10.5} rx={5.2} fill={NAVY} stroke={C.cyan} strokeWidth={1.4} />
      <Path d="M19.5 13.5c1.2-1 2.6-1.4 4-1.4" stroke={C.cyan} strokeWidth={1.2} strokeLinecap="round" fill="none" />
    </>
  ),
  toolkit: (
    <>
      <Path d="M18 17v-4a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4" stroke={SHADE} strokeWidth={3} fill="none" />
      <Rect x={6} y={16} width={36} height={23} rx={4} fill={C.orange} />
      <Rect x={6} y={25} width={36} height={3.5} fill={C.orangeDark} />
      <Rect x={20.5} y={22} width={7} height={8.5} rx={1.6} fill={HULL} />
    </>
  ),
  module: (
    <>
      <Rect x={6} y={15} width={27} height={21} rx={5} fill={HULL} />
      <Circle cx={19.5} cy={25.5} r={5} fill={NAVY} stroke={C.cyan} strokeWidth={1.4} />
      <Path d="M33 21l5-5" stroke={SHADE} strokeWidth={2} strokeLinecap="round" />
      <Path d="M35 9a9 9 0 0 1 9 9" stroke={C.cyan} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <Circle cx={38.5} cy={15.5} r={2.6} fill={C.cyan} />
    </>
  ),
  canister: (
    <>
      <Rect x={19} y={5} width={10} height={6} rx={2} fill={HULL} />
      <Rect x={11} y={9} width={26} height={31} rx={8} fill={C.orange} />
      <Rect x={11} y={17} width={26} height={3.5} fill={C.orangeDark} />
      <Rect x={11} y={29} width={26} height={3.5} fill={C.orangeDark} />
    </>
  ),
  telescope: (
    <>
      <Path d="M16 30 10 42M24 30l6 12" stroke={SHADE} strokeWidth={2.2} strokeLinecap="round" />
      <Rect x={5} y={16} width={30} height={14} rx={4} fill={HULL} />
      <Rect x={33} y={12} width={10} height={22} rx={2.5} fill={C.cyan} />
      <Rect x={9} y={20} width={14} height={2.5} rx={1.2} fill={SHADE} />
    </>
  ),
};

/** Illustrated object for the simulation. `flip` mirrors it so it faces left. */
export const Art = React.memo(function Art({ name, size = 44, flip = false }: { name: ArtName; size?: number; flip?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" aria-hidden style={flip ? { transform: [{ scaleX: -1 }] } : undefined}>
      {ART[name]}
    </Svg>
  );
});

/** Player avatar: an astronaut on a coloured badge. */
export const Avatar = React.memo(function Avatar({ id, size = 40, ring = false }: { id: string; size?: number; ring?: boolean }) {
  const color = AVATAR_COLOR[id] ?? C.cyan;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: color + "26",
        borderWidth: ring ? 2 : 1,
        borderColor: ring ? color : color + "66",
      }}
    >
      <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 48 48" aria-hidden>
        <Rect x={15} y={25} width={18} height={18} rx={6} fill={HULL} />
        <Rect x={21} y={31} width={6} height={4} rx={1} fill={color} />
        <Circle cx={24} cy={16} r={11} fill={HULL} />
        <Rect x={16} y={10.5} width={16} height={11} rx={5.5} fill={NAVY} stroke={color} strokeWidth={1.6} />
      </Svg>
    </View>
  );
});

/** The home planet with orbit rings: replaces the old bitmap globe. */
export const Planet = React.memo(function Planet({ size = 220 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 240 240" aria-hidden>
      <Defs>
        <RadialGradient id="qed-ocean" cx="38%" cy="32%" r="75%">
          <Stop offset="0" stopColor="#3aa0ff" />
          <Stop offset="0.55" stopColor="#0d4eaa" />
          <Stop offset="1" stopColor="#041a40" />
        </RadialGradient>
        <RadialGradient id="qed-glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0.62" stopColor="#00c8ff" stopOpacity={0.28} />
          <Stop offset="1" stopColor="#00c8ff" stopOpacity={0} />
        </RadialGradient>
        <ClipPath id="qed-disc">
          <Circle cx={120} cy={120} r={70} />
        </ClipPath>
      </Defs>
      <Circle cx={120} cy={120} r={116} fill="url(#qed-glow)" />
      <Ellipse cx={120} cy={120} rx={112} ry={34} stroke={C.cyan} strokeOpacity={0.28} strokeWidth={1.2} fill="none" transform="rotate(-18 120 120)" />
      <Circle cx={120} cy={120} r={70} fill="url(#qed-ocean)" />
      <G clipPath="url(#qed-disc)" fill="#22d3a6" opacity={0.9}>
        <Path d="M78 78c10-10 28-12 38-4 6 5 2 12-6 14-8 2-8 9-2 14 8 6 4 18-8 18-10 0-14-8-22-10-10-3-12-20 0-32z" />
        <Path d="M132 118c8-6 22-6 30 2 8 8 6 22-4 30-8 6-10 16-20 18-10 2-16-8-12-18 3-8-2-12-2-20 0-5 3-9 8-12z" />
        <Path d="M150 70c8-2 20 2 26 10-6 4-14 6-22 2-5-3-8-9-4-12z" />
        <Path d="M70 150c6-2 14 2 16 10-2 8-10 12-18 8-4-6-2-14 2-18z" />
      </G>
      <Path d="M70 96a54 54 0 0 1 44-40" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Circle cx={120} cy={120} r={70} stroke={C.cyan} strokeOpacity={0.55} strokeWidth={1.5} fill="none" />
      <Circle cx={214} cy={86} r={5} fill={C.orange} />
      <Circle cx={30} cy={150} r={3} fill={C.teal} />
    </Svg>
  );
});

/** Upright rocket with exhaust, for hero artwork. */
export const RocketHero = React.memo(function RocketHero({ size = 96 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 1.4} viewBox="0 0 60 84" aria-hidden>
      <Path d="M30 84c-6-8-8-14-6-22h12c2 8 0 14-6 22z" fill={C.orange} />
      <Path d="M30 78c-3-5-4-9-3-14h6c1 5 0 9-3 14z" fill="#ffe08a" />
      <Path d="M17 50 6 62l12-2zM43 50l11 12-12-2z" fill={C.orange} />
      <Path d="M30 2c10 9 15 22 15 36 0 8-2 16-5 24H20c-3-8-5-16-5-24C15 24 20 11 30 2z" fill={HULL} />
      <Path d="M30 2c5 4.500 9 10 11.500 16h-23C21 12 25 6.500 30 2z" fill={C.cyan} />
      <Circle cx={30} cy={34} r={7} fill={NAVY} stroke={C.cyan} strokeWidth={2} />
      <Rect x={20} y={56} width={20} height={5} rx={1.5} fill={SHADE} />
    </Svg>
  );
});
