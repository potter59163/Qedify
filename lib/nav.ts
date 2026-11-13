import type { Href, Router } from "expo-router";

import type { MissionDef } from "./engine/types";
import type { GameState } from "./progress";

/** Typed-routes escape hatch for paths assembled at runtime. */
export const href = (path: string) => path as Href;

/** Back, or home when the screen was opened directly (deep link / refresh). */
export function goBack(router: Router) {
  if (router.canGoBack()) router.back();
  else router.replace(href("/home"));
}

/**
 * Where "play this mission" should go: the chapter briefing first if the
 * learner has not seen it yet, otherwise straight into the mission.
 */
export function missionHref(state: GameState, def: MissionDef, daily = false): Href {
  if (!state.briefings.includes(def.chapter)) {
    return href(`/briefing/${def.chapter}?next=${def.id}${daily ? "&daily=1" : ""}`);
  }
  return href(`/mission/${def.id}${daily ? "?daily=1" : ""}`);
}
