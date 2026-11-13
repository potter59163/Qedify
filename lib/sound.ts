import { Platform } from "react-native";

/**
 * Sound effects, synthesised with the Web Audio API so there are no audio
 * files to download. Silent on native builds and wherever audio is unavailable.
 */
export type Sfx = "tap" | "hint" | "correct" | "wrong" | "collide" | "win" | "lose";

type Note = [frequency: number, start: number, duration: number];

const SCORE: Record<Sfx, { wave: OscillatorType; gain: number; notes: Note[] }> = {
  tap: { wave: "sine", gain: 0.05, notes: [[660, 0, 0.05]] },
  hint: { wave: "sine", gain: 0.07, notes: [[784, 0, 0.09], [1047, 0.09, 0.14]] },
  correct: { wave: "triangle", gain: 0.1, notes: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.18]] },
  wrong: { wave: "sawtooth", gain: 0.05, notes: [[196, 0, 0.14], [147, 0.14, 0.22]] },
  collide: { wave: "square", gain: 0.05, notes: [[110, 0, 0.09]] },
  win: { wave: "triangle", gain: 0.1, notes: [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1047, 0.36, 0.34]] },
  lose: { wave: "sawtooth", gain: 0.05, notes: [[330, 0, 0.18], [262, 0.18, 0.18], [196, 0.36, 0.4]] },
};

let enabled = true;
let ctx: AudioContext | null = null;

/** Called by the store whenever the learner's sound setting changes. */
export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function audio(): AudioContext | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  // Browsers keep audio suspended until the first tap; every call here follows one.
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function play(name: Sfx) {
  if (!enabled) return;
  try {
    const ac = audio();
    if (!ac) return;
    const { wave, gain, notes } = SCORE[name];
    const t0 = ac.currentTime + 0.01;
    for (const [frequency, start, duration] of notes) {
      const osc = ac.createOscillator();
      const amp = ac.createGain();
      osc.type = wave;
      osc.frequency.value = frequency;
      amp.gain.setValueAtTime(0.0001, t0 + start);
      amp.gain.linearRampToValueAtTime(gain, t0 + start + 0.012);
      amp.gain.exponentialRampToValueAtTime(0.0001, t0 + start + duration);
      osc.connect(amp);
      amp.connect(ac.destination);
      osc.start(t0 + start);
      osc.stop(t0 + start + duration + 0.02);
    }
  } catch {
    // Audio is a nicety: never let it break a mission.
  }
}
