import { useEffect, useRef, useState } from "react";

/**
 * Countdown timer hook.
 * @param initialSeconds - Total seconds to count down from.
 * @param onExpire - Called once when the timer reaches zero.
 * @returns { seconds, formatted } — remaining seconds and "MM:SS" string.
 */
export function useCountdown(initialSeconds: number, onExpire?: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    const id = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return { seconds, formatted: `${mm}:${ss}` };
}
