"use client";

import { useCallback } from "react";
import { triggerHaptic, type HapticStyle } from "@/lib/haptics";
import { getSettings } from "@/lib/storage";

export function useHaptic() {
  const haptic = useCallback((style: HapticStyle = "light") => {
    const settings = getSettings();
    if (settings.haptics) {
      triggerHaptic(style);
    }
  }, []);

  return haptic;
}
