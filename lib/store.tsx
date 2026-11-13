import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";

import {
  INITIAL,
  applyAttempt,
  applyFinish,
  applyLab,
  applySurvey,
  type AttemptEvent,
  type FinishInput,
  type GameState,
  type LabEvent,
  type Profile,
  type Settings,
  type SurveyResponse,
} from "./progress";
import { setSoundEnabled } from "./sound";

const KEY = "qedify:v2";

type Action =
  | { type: "load"; state: GameState }
  | { type: "profile"; profile: Profile }
  | { type: "patch-profile"; patch: Partial<Profile> }
  | { type: "onboarded" }
  | { type: "attempt"; event: AttemptEvent }
  | { type: "finish"; input: FinishInput }
  | { type: "briefing"; chapter: number }
  | { type: "lab"; event: LabEvent }
  | { type: "survey"; response: SurveyResponse }
  | { type: "settings"; patch: Partial<Settings> }
  | { type: "insights"; items: string[] }
  | { type: "reset-progress" }
  | { type: "sign-out" };

/** Random label for exported data, so a file can be told apart without a name. */
const newPid = () => Math.random().toString(36).slice(2, 10);

function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case "load":
      return a.state;
    case "profile":
      return { ...s, profile: a.profile, onboarded: true, pid: s.pid || newPid() };
    case "patch-profile":
      return s.profile ? { ...s, profile: { ...s.profile, ...a.patch } } : s;
    case "onboarded":
      return { ...s, onboarded: true };
    case "attempt":
      return applyAttempt(s, a.event);
    case "finish":
      return applyFinish(s, a.input);
    case "briefing":
      return s.briefings.includes(a.chapter) ? s : { ...s, briefings: [...s.briefings, a.chapter] };
    case "lab":
      return applyLab(s, a.event);
    case "survey":
      return applySurvey(s, a.response);
    case "settings":
      return { ...s, settings: { ...s.settings, ...a.patch } };
    case "insights":
      return { ...s, insights: { ts: Date.now(), items: a.items } };
    case "reset-progress":
      return { ...INITIAL, profile: s.profile, onboarded: s.onboarded, settings: s.settings, pid: s.pid };
    case "sign-out":
      return { ...INITIAL, onboarded: true, settings: s.settings };
  }
}

interface Game {
  state: GameState;
  /** False until the saved state has been read from storage. */
  ready: boolean;
  dispatch: React.Dispatch<Action>;
}

const Ctx = createContext<Game>({ state: INITIAL, ready: false, dispatch: () => {} });

/** A first-time visitor whose browser is set to Thai starts in Thai. */
function fresh(): GameState {
  const thai = typeof navigator !== "undefined" && /^th\b/i.test(navigator.language ?? "");
  return thai ? { ...INITIAL, settings: { ...INITIAL.settings, lang: "th" } } : INITIAL;
}

/** Accept only a saved object of the current version; anything else starts fresh. */
function revive(raw: string | null): GameState {
  if (!raw) return fresh();
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.v === 2) {
      // Fields added after a save was written take their defaults from INITIAL.
      const state: GameState = { ...INITIAL, ...parsed, settings: { ...INITIAL.settings, ...parsed.settings } };
      // Saves from before the SVG avatars stored an emoji here.
      if (state.profile && !/^a[1-4]$/.test(state.profile.avatar)) state.profile = { ...state.profile, avatar: "a1" };
      if (state.profile && !state.pid) state.pid = newPid();
      return state;
    }
  } catch {
    // Corrupt save: fall through to a fresh state rather than crash on boot.
  }
  return fresh();
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (alive) dispatch({ type: "load", state: revive(raw) });
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(() => {
      AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
    }, 250);
    return () => clearTimeout(id);
  }, [state, ready]);

  useEffect(() => {
    setSoundEnabled(state.settings.sound);
  }, [state.settings.sound]);

  const value = useMemo(() => ({ state, ready, dispatch }), [state, ready]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame(): Game {
  return useContext(Ctx);
}
