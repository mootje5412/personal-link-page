export type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";

export function triggerHaptic(style: HapticStyle = "light") {
  if (typeof window === "undefined") return;

  const nav = navigator as Navigator & {
    vibrate?: (pattern: number | number[]) => boolean;
  };

  const patterns: Record<HapticStyle, number[]> = {
    light: [10],
    medium: [20],
    heavy: [30],
    success: [10, 50, 10],
    warning: [20, 40, 20],
    error: [40, 80, 40],
  };

  nav.vibrate?.(patterns[style]);
}
