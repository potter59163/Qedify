import { useEffect, useRef } from "react";
import { Platform, type View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { useGame } from "./store";

/**
 * Accessibility helpers shared by every screen. React Native Web only forwards
 * `role` and `aria-*` props (not accessibilityState / accessibilityValue), and
 * keyboard handlers are web-only, so they are assembled here in one place.
 */

/** Props that only exist in the browser (keyboard handlers, tabIndex). */
const web = (props: Record<string, unknown>): object => (Platform.OS === "web" ? props : {});

interface KeyEvent {
  key: string;
  shiftKey: boolean;
  preventDefault: () => void;
  stopPropagation: () => void;
  currentTarget: unknown;
}

/** True when motion should be kept to a minimum: the system setting, or the learner's own setting in the app. */
export function useReduceMotion(): boolean {
  const system = useReducedMotion();
  const { state } = useGame();
  return system || state.settings.reduceMotion;
}

/**
 * Spread on the container of a set of `role="radio"` elements. Names the
 * group and lets the arrow keys move and select, as in a native radio group.
 */
export function radioGroup(label: string): object {
  return {
    role: "radiogroup",
    "aria-label": label,
    ...web({
      onKeyDown: (e: KeyEvent) => {
        const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (!step) return;
        const group = e.currentTarget as HTMLElement;
        const radios = Array.from(group.querySelectorAll<HTMLElement>('[role="radio"]')).filter((r) => r.getAttribute("aria-disabled") !== "true");
        const at = radios.indexOf(document.activeElement as HTMLElement);
        if (at < 0) return;
        e.preventDefault();
        const next = radios[(at + step + radios.length) % radios.length];
        next.focus();
        next.click();
      },
    }),
  };
}

/**
 * Spread on a custom slider. Exposes its value to assistive technology and
 * makes it operable from the keyboard: arrows move one step, Page Up / Down
 * ten steps, Home / End jump to the ends.
 */
export function sliderProps(o: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Spoken value, e.g. "+8 m/s". */
  text?: string;
  onChange: (v: number) => void;
}): object {
  const { label, min, max, step, text, onChange } = o;
  const value = Number.isFinite(o.value) ? o.value : 0;
  const set = (v: number) => onChange(Math.max(min, Math.min(max, Number((Math.round(v / step) * step).toFixed(6)))));
  return {
    role: "slider",
    "aria-label": label,
    "aria-valuemin": min,
    "aria-valuemax": max,
    "aria-valuenow": value,
    "aria-valuetext": text,
    // Native screen readers adjust with swipe up / down.
    accessible: true,
    accessibilityActions: [{ name: "increment" }, { name: "decrement" }],
    onAccessibilityAction: (e: { nativeEvent: { actionName: string } }) => set(value + (e.nativeEvent.actionName === "increment" ? step : -step)),
    ...web({
      tabIndex: 0,
      onKeyDown: (e: KeyEvent) => {
        const moves: Record<string, number> = {
          ArrowRight: value + step,
          ArrowUp: value + step,
          ArrowLeft: value - step,
          ArrowDown: value - step,
          PageUp: value + 10 * step,
          PageDown: value - 10 * step,
          Home: min,
          End: max,
        };
        if (!(e.key in moves)) return;
        e.preventDefault();
        set(moves[e.key]);
      },
    }),
  };
}

const FOCUSABLE = '[tabindex="0"], a[href], button, input, textarea';

/**
 * Focus management for a modal dialog (browser only). While `visible`:
 * focus moves into the dialog, Tab cycles inside it, Escape calls `onClose`,
 * and everything behind it is inert. Closing puts focus back where it was.
 * Attach the returned ref to the dialog's outer View.
 */
export function useDialogFocus(visible: boolean, onClose?: () => void) {
  const ref = useRef<View>(null);
  const close = useRef(onClose);

  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!visible || Platform.OS !== "web") return;
    const node = ref.current as unknown as HTMLElement | null;
    if (!node) return;
    const before = document.activeElement as HTMLElement | null;
    const behind = node.parentElement ? Array.from(node.parentElement.children).filter((el) => el !== node) : [];
    for (const el of behind) el.setAttribute("inert", "");

    const focusables = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.closest('[aria-disabled="true"]'));
    (focusables()[0] ?? node).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && close.current) {
        e.stopPropagation();
        close.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) {
        e.preventDefault();
        node.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!node.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (active === first || active === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);

    return () => {
      document.removeEventListener("keydown", onKey, true);
      for (const el of behind) el.removeAttribute("inert");
      if (before && document.contains(before)) before.focus();
    };
  }, [visible]);

  return ref;
}

/** Text that is announced by screen readers but takes no space on screen. */
export const SR_ONLY = { position: "absolute", width: 1, height: 1, margin: -1, overflow: "hidden" } as const;
