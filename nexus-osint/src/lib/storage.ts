import type { SearchRecord } from "@/types/search";

const KEYS = {
  history: "nexus_history",
  settings: "nexus_settings",
  installDismissed: "nexus_install_dismissed",
} as const;

export interface AppSettings {
  notifications: boolean;
  keyboardShortcuts: boolean;
  haptics: boolean;
}

const defaultSettings: AppSettings = {
  notifications: true,
  keyboardShortcuts: true,
  haptics: true,
};

function parse<T>(val: string | null, fallback: T): T {
  if (!val) return fallback;
  try { return JSON.parse(val) as T; } catch { return fallback; }
}

export function getHistory(): SearchRecord[] {
  return parse(localStorage.getItem(KEYS.history), []);
}

export function saveHistory(records: SearchRecord[]) {
  localStorage.setItem(KEYS.history, JSON.stringify(records.slice(0, 100)));
}

export function addSearch(record: SearchRecord) {
  const existing = getHistory().filter((r) => !(r.query === record.query && r.type === record.type));
  saveHistory([record, ...existing]);
}

export function togglePin(id: string) {
  saveHistory(getHistory().map((r) => (r.id === id ? { ...r, pinned: !r.pinned } : r)));
}

export function toggleFavorite(id: string) {
  saveHistory(getHistory().map((r) => (r.id === id ? { ...r, favorite: !r.favorite } : r)));
}

export function getSettings(): AppSettings {
  return parse(localStorage.getItem(KEYS.settings), defaultSettings);
}

export function saveSettings(s: AppSettings) {
  localStorage.setItem(KEYS.settings, JSON.stringify(s));
}

export function isInstallDismissed(): boolean {
  return localStorage.getItem(KEYS.installDismissed) === "true";
}

export function dismissInstall() {
  localStorage.setItem(KEYS.installDismissed, "true");
}

export const SUGGESTIONS = [
  "johndoe", "admin@company.com", "example.com", "8.8.8.8", "+15550100", "Acme Corp",
];
