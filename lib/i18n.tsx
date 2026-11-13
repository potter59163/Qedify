import React, { createContext, useContext } from "react";

import { pick, type L, type Lang } from "./engine/lang";
import { useGame } from "./store";

export { pick, type Bi, type L, type Lang } from "./engine/lang";

const Override = createContext<Lang | null>(null);

/** Forces a language for a subtree. Used by the pre-rendered Thai landing page. */
export function LangOverride({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <Override.Provider value={lang}>{children}</Override.Provider>;
}

/** The language of the interface: the learner's setting unless a parent forces one. */
export function useLang(): Lang {
  const forced = useContext(Override);
  const { state } = useGame();
  return forced ?? state.settings.lang;
}

/** `const L = useL()` then `L("English", "ไทย")`. */
export function useL(): L {
  return pick(useLang());
}
