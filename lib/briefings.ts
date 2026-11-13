import { BRIEFINGS_TH } from "./briefings-th";
import { thaiSubscripts, type Lang } from "./engine/lang";

/** Pre-mission briefings: one short lesson per chapter, ending in a check question. */
export interface Briefing {
  chapter: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  hook: { title: string; body: string };
  cards: { title: string; formula?: string; note?: string; body: string }[];
  example: { problem: string; steps: string[] };
  tip: string;
  /** Show the interactive m / v sliders (chapter 1). */
  sliders?: boolean;
  quiz: { question: string; options: string[]; correct: number; wrong: string; right: string };
}

export const BRIEFINGS: Briefing[] = [
  {
    chapter: 1,
    title: "Understanding Momentum",
    subtitle: "Mass in motion — and it has a direction",
    hook: {
      title: "BICYCLE VS TRUCK",
      body: "A bicycle and a truck roll toward you at the same speed. Which one would you rather stop? The truck is harder to stop because it carries more momentum — the same speed, but far more mass.",
    },
    cards: [
      {
        title: "MOMENTUM FORMULA",
        formula: "p = m × v",
        note: "momentum = mass × velocity · unit: kg·m/s",
        body: "Double the mass or double the velocity and the momentum doubles. A heavy slow freighter and a light fast probe can carry the same momentum.",
      },
      {
        title: "DIRECTION MATTERS",
        formula: "→ positive   ← negative",
        note: "momentum is a vector",
        body: "Momentum points the same way as the velocity. In these missions rightward is positive and leftward is negative, so two craft moving in opposite directions have momenta that partly cancel.",
      },
    ],
    example: {
      problem: "Shuttle A (2,000 kg) moves right at 10 m/s. Shuttle B (500 kg) moves left at 8 m/s. What is the total momentum?",
      steps: ["p_A = 2,000 × 10 = +20,000 kg·m/s", "p_B = 500 × (−8) = −4,000 kg·m/s", "p_total = 20,000 + (−4,000) = +16,000 kg·m/s"],
    },
    tip: "Direction is everything in momentum problems. Decide which way is positive before you calculate, and keep the signs to the end.",
    sliders: true,
    quiz: {
      question: "A rocket of mass 500 kg moves at 30 m/s. What is its momentum?",
      options: ["16.7 kg·m/s", "530 kg·m/s", "15,000 kg·m/s", "6,000 kg·m/s"],
      correct: 2,
      wrong: "Not quite. Use p = m × v and multiply the two values from the question.",
      right: "Correct: p = 500 × 30 = 15,000 kg·m/s.",
    },
  },
  {
    chapter: 2,
    title: "Impulse & Force",
    subtitle: "How a force changes momentum over time",
    hook: {
      title: "WHY AIRBAGS WORK",
      body: "In a crash your momentum drops to zero either way. An airbag does not change that — it stretches the stop from a few milliseconds to a few tenths of a second, so the force on you becomes many times smaller.",
    },
    cards: [
      {
        title: "IMPULSE",
        formula: "J = F × Δt",
        note: "impulse = force × time · unit: N·s",
        body: "A force acting for a time delivers an impulse. A large force for a short time and a small force for a long time can deliver exactly the same impulse.",
      },
      {
        title: "IMPULSE–MOMENTUM THEOREM",
        formula: "J = Δp = m × (v_f − v_i)",
        note: "impulse equals the CHANGE in momentum",
        body: "Impulse is not the momentum an object has — it is how much the momentum changes. To stop a ship, the impulse must be equal and opposite to the momentum it carries.",
      },
      {
        title: "MORE TIME, LESS FORCE",
        formula: "F = Δp ÷ Δt",
        note: "same Δp, longer Δt → smaller F",
        body: "For a fixed change in momentum, the average force is inversely proportional to the collision time. Soft materials protect by making the collision last longer.",
      },
    ],
    example: {
      problem: "A 2,000 kg ship moving at 10 m/s must stop within 5 s. What impulse and what average force are needed?",
      steps: ["J = p_final − p_initial = 0 − 2,000 × 10 = −20,000 N·s", "F = J ÷ Δt = −20,000 ÷ 5 = −4,000 N", "The minus sign means the force acts against the motion."],
    },
    tip: "Force and impulse are different things. Impulse (N·s) tells you how much the momentum changes; force (N) tells you how hard the push is at each moment.",
    quiz: {
      question: "A 1,000 kg lander moving at 6 m/s is brought to rest in 0.5 s. What is the size of the average force?",
      options: ["500 N", "3,000 N", "6,000 N", "12,000 N"],
      correct: 3,
      wrong: "Not quite. Find Δp = m × v first, then divide by the stopping time: F = Δp ÷ Δt.",
      right: "Correct: Δp = 1,000 × 6 = 6,000 kg·m/s, so F = 6,000 ÷ 0.5 = 12,000 N.",
    },
  },
  {
    chapter: 3,
    title: "Conservation of Momentum",
    subtitle: "What a closed system can never lose",
    hook: {
      title: "TWO SKATERS PUSH OFF",
      body: "Two skaters stand still on ice and push each other away. Neither had momentum before — and together they still have none after: one glides left, the other right, with equal and opposite momentum.",
    },
    cards: [
      {
        title: "THE LAW",
        formula: "p_before = p_after",
        note: "when no net external force acts on the system",
        body: "Bodies inside a system can trade momentum with each other, but the total stays the same. Always add up the momentum of every body, with signs, before and after.",
      },
      {
        title: "STICKING TOGETHER",
        formula: "m1 v1 + m2 v2 = (m1 + m2) v_f",
        note: "docking, coupling, capture",
        body: "When two bodies lock together they share one final velocity. The combined mass carries all of the original momentum, so it moves slower than the incoming body.",
      },
      {
        title: "RECOIL",
        formula: "0 = m1 v1 + m2 v2",
        note: "starting from rest",
        body: "Throwing something one way pushes you the other way. This is how a ship with a dead engine can still move: eject mass opposite to where you want to go.",
      },
    ],
    example: {
      problem: "A 1,500 kg pod moving at 8 m/s couples with a 1,000 kg pod at rest. How fast do they move together?",
      steps: ["p_before = 1,500 × 8 + 1,000 × 0 = 12,000 kg·m/s", "p_after = (1,500 + 1,000) × v_f", "v_f = 12,000 ÷ 2,500 = 4.8 m/s"],
    },
    tip: "Divide by the mass that is actually moving afterwards. After docking that is the combined mass; after venting propellant the ship is lighter than before.",
    quiz: {
      question: "A 2,000 kg pod moving at 6 m/s couples with a 1,000 kg pod at rest. What is their common velocity?",
      options: ["2 m/s", "3 m/s", "4 m/s", "6 m/s"],
      correct: 2,
      wrong: "Not quite. Total momentum is 2,000 × 6. Divide it by the combined mass of both pods.",
      right: "Correct: v_f = 12,000 ÷ 3,000 = 4 m/s.",
    },
  },
  {
    chapter: 4,
    title: "Collision Mastery",
    subtitle: "Elastic, inelastic, and where the energy goes",
    hook: {
      title: "BILLIARD BALL OR CLAY?",
      body: "A billiard ball hits another and they bounce apart. A lump of clay hits another and they stick. Momentum is conserved in both — the difference is what happens to the kinetic energy.",
    },
    cards: [
      {
        title: "KINETIC ENERGY",
        formula: "KE = ½ × m × v²",
        note: "unit: joule (J) · never negative",
        body: "Kinetic energy depends on the square of the speed and has no direction. It is a different quantity from momentum: do not mix up kg·m/s with joules.",
      },
      {
        title: "ELASTIC COLLISION",
        formula: "v1' = (m1 − m2) v1 ÷ (m1 + m2)\nv2' = 2 m1 v1 ÷ (m1 + m2)",
        note: "target at rest · momentum AND kinetic energy conserved",
        body: "The bodies bounce apart and no kinetic energy is lost. With equal masses the striker stops and the target leaves with the striker's velocity.",
      },
      {
        title: "INELASTIC COLLISION",
        formula: "m1 v1 + m2 v2 = (m1 + m2) v_f",
        note: "perfectly inelastic: bodies stick · kinetic energy is lost",
        body: "Momentum is still conserved, but some kinetic energy becomes heat, sound and deformation. Sticking together loses the most kinetic energy possible.",
      },
    ],
    example: {
      problem: "A 1,000 kg module at 8 m/s hits an identical module at rest and they lock. How much kinetic energy is lost?",
      steps: ["v_f = 1,000 × 8 ÷ 2,000 = 4 m/s", "KE_before = ½ × 1,000 × 8² = 32,000 J", "KE_after = ½ × 2,000 × 4² = 16,000 J", "Lost: 32,000 − 16,000 = 16,000 J"],
    },
    tip: "To classify a collision, compare the total kinetic energy before and after. Equal means elastic; less means inelastic. Momentum alone cannot tell you.",
    quiz: {
      question: "Two bodies collide. Total momentum is the same before and after, but total kinetic energy is lower afterwards. The collision was…",
      options: ["Elastic", "Inelastic", "Impossible", "Not enough information"],
      correct: 1,
      wrong: "Not quite. Momentum is conserved in every collision. What does a drop in kinetic energy tell you?",
      right: "Correct: kinetic energy was lost, so the collision was inelastic.",
    },
  },
];

/** The briefing for a chapter, in the given language. */
const THAI = thaiSubscripts(BRIEFINGS_TH);

export const briefingFor = (chapter: number, lang: Lang = "en") =>
  (lang === "th" ? THAI : BRIEFINGS).find((b) => b.chapter === chapter);
