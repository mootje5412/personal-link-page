import type { GenerationRecord } from "./ai/types";

const STORAGE_KEYS = {
  generations: "viralai_generations",
  favorites: "viralai_favorites",
  settings: "viralai_settings",
  premium: "viralai_premium",
  dismissedInstall: "viralai_dismiss_install",
} as const;

export interface AppSettings {
  darkMode: boolean;
  haptics: boolean;
  notifications: boolean;
}

const defaultSettings: AppSettings = {
  darkMode: true,
  haptics: true,
  notifications: true,
};

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function getGenerations(): GenerationRecord[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(STORAGE_KEYS.generations), []);
}

export function saveGeneration(record: GenerationRecord): void {
  if (typeof window === "undefined") return;
  const existing = getGenerations();
  const updated = [record, ...existing].slice(0, 100);
  localStorage.setItem(STORAGE_KEYS.generations, JSON.stringify(updated));
}

export function toggleFavorite(id: string): void {
  if (typeof window === "undefined") return;
  const existing = getGenerations();
  const updated = existing.map((g) =>
    g.id === id ? { ...g, favorite: !g.favorite } : g
  );
  localStorage.setItem(STORAGE_KEYS.generations, JSON.stringify(updated));
}

export function deleteGeneration(id: string): void {
  if (typeof window === "undefined") return;
  const updated = getGenerations().filter((g) => g.id !== id);
  localStorage.setItem(STORAGE_KEYS.generations, JSON.stringify(updated));
}

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  return safeParse(localStorage.getItem(STORAGE_KEYS.settings), defaultSettings);
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

export function isPremium(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEYS.premium) === "true";
}

export function setPremium(value: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.premium, String(value));
}

export function isInstallBannerDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEYS.dismissedInstall) === "true";
}

export function dismissInstallBanner(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.dismissedInstall, "true");
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const dailyTips = [
  "Post within the first hour of waking up in your audience's timezone for 2x engagement.",
  "Videos with text overlays in the first 3 seconds retain 40% more viewers.",
  "Reply to every comment in the first 30 minutes — the algorithm rewards early engagement.",
  "Use 3-5 niche hashtags + 2 broad ones for optimal reach without shadowban risk.",
  "Hook viewers in 1.5 seconds. If your first frame isn't compelling, they'll scroll.",
  "Consistency beats perfection. Post daily for 30 days to trigger algorithm favor.",
  "Save-worthy content gets 3x more distribution. Make every post worth bookmarking.",
  "Cross-post to Reels, TikTok, and Shorts within 24 hours for maximum viral potential.",
];

export function getDailyTip(): string {
  const dayIndex = Math.floor(Date.now() / 86400000) % dailyTips.length;
  return dailyTips[dayIndex];
}
