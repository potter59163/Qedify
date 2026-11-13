import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";

/**
 * Responsive layout.
 *
 *   phone    < 700 px   single column, bottom tab bar
 *   tablet   700–1099   side navigation rail, wider content column
 *   desktop  ≥ 1100     labelled side navigation, two-column screens
 *
 * Sizes go through `sw()` so the whole UI can be nudged per breakpoint.
 */
export type Breakpoint = "phone" | "tablet" | "desktop";

export interface Layout {
  width: number;
  height: number;
  bp: Breakpoint;
  scale: number;
  /** True when navigation is a side rail instead of a bottom bar. */
  rail: boolean;
}

/** Used on the server and for the first client render, so hydration matches. */
export const DEFAULT_LAYOUT: Layout = { width: 390, height: 844, bp: "phone", scale: 1, rail: false };

/** Maximum content widths. Screens centre themselves inside one of these. */
export const PAGE = { form: 480, text: 760, wide: 1120 } as const;
export type PageWidth = keyof typeof PAGE;

export function computeLayout(width: number, height: number): Layout {
  // A hidden or not-yet-sized window reports 0 × 0.
  if (!(width > 0) || !(height > 0)) return DEFAULT_LAYOUT;
  const bp: Breakpoint = width < 700 ? "phone" : width < 1100 ? "tablet" : "desktop";
  // Larger type and controls where there is room for them.
  const scale = width < 350 ? 0.9 : bp === "desktop" ? 1.14 : bp === "tablet" ? 1.05 : 1;
  return { width, height, bp, scale, rail: bp !== "phone" };
}

const subscribeNever = () => () => {};

/** False during server rendering and hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

/** The layout for the current window. Call once, at the root. */
export function useWindowLayout(): Layout {
  const hydrated = useHydrated();
  const { width, height } = useWindowDimensions();
  return useMemo(() => (hydrated ? computeLayout(width, height) : DEFAULT_LAYOUT), [hydrated, width, height]);
}

const LayoutContext = createContext<Layout>(DEFAULT_LAYOUT);

export const LayoutProvider = LayoutContext.Provider;

export function useLayout(): Layout {
  return useContext(LayoutContext);
}

export type Sw = (n: number) => number;

/** Size of something tappable: scales with the screen but never below 44 px (WCAG 2.5.5). */
export const tap = (sw: Sw, n = 44) => Math.max(44, sw(n));

/** `sw` for one-off inline sizes. */
export function useSw(): Sw {
  const { scale } = useLayout();
  return useMemo(() => (n: number) => Math.round(n * scale * 10) / 10, [scale]);
}

/**
 * Like StyleSheet.create, but the factory receives `sw` and the layout, and
 * the styles are rebuilt when the layout changes (rotation, window resize).
 */
export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (sw: Sw, layout: Layout) => T,
): () => T {
  return function useStyles() {
    const layout = useLayout();
    return useMemo(() => {
      const sw: Sw = (n) => Math.round(n * layout.scale * 10) / 10;
      return StyleSheet.create(factory(sw, layout) as T & StyleSheet.NamedStyles<any>);
    }, [layout]);
  };
}
