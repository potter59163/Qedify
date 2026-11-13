import { useEffect, useRef } from "react";

import { LangOverride } from "@/lib/i18n";
import { useGame } from "@/lib/store";

import { Landing } from "./index";

/**
 * Thai landing page. It is pre-rendered in Thai so search engines index a
 * Thai version, and opening it switches the rest of the app to Thai.
 */
export default function ThaiLanding() {
  const { ready, dispatch } = useGame();
  const switched = useRef(false);

  // Once only: after that the visitor's own choice in the language switch wins.
  useEffect(() => {
    if (!ready || switched.current) return;
    switched.current = true;
    dispatch({ type: "settings", patch: { lang: "th" } });
  }, [ready, dispatch]);

  return (
    <LangOverride lang="th">
      <Landing thai />
    </LangOverride>
  );
}
