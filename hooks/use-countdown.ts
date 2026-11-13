import { useEffect, useRef, useState } from "react";

/**
 * Countdown that only ticks while `running` is true, so a mission clock can
 * pause while the player reads feedback.
 */
export function useCountdown(totalSeconds: number, running: boolean, onExpire: () => void) {
  const [seconds, setSeconds] = useState(totalSeconds);
  const expire = useRef(onExpire);

  useEffect(() => {
    expire.current = onExpire;
  });

  useEffect(() => {
    if (!running || seconds <= 0) return;
    const id = setTimeout(() => {
      setSeconds((s) => s - 1);
      if (seconds === 1) expire.current();
    }, 1000);
    return () => clearTimeout(id);
  }, [running, seconds]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return { seconds, formatted: `${mm}:${ss}` };
}
