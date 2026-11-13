import { pick, type L, type Lang } from "./engine/lang";
import { useGame } from "./store";

export { pick, type Bi, type L, type Lang } from "./engine/lang";

/** The language of the interface: the learner's setting. */
export function useLang(): Lang {
  const { state } = useGame();
  return state.settings.lang;
}

/** `const L = useL()` then `L("English", "ไทย")`. */
export function useL(): L {
  return pick(useLang());
}
