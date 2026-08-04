"use client";

import { useState, useEffect } from "react";
import { Bell, Keyboard, Vibrate, Shield } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getSettings, saveSettings, type AppSettings } from "@/lib/storage";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-white" : "bg-white/10"}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${on ? "translate-x-[22px] bg-black" : "translate-x-0.5 bg-zinc-600"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  useEffect(() => { setSettings(getSettings()); }, []);

  const update = (key: keyof AppSettings, val: boolean) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    saveSettings(next);
  };

  const items = [
    { key: "notifications" as const, icon: Bell, label: "Notifications", desc: "Search alerts" },
    { key: "keyboardShortcuts" as const, icon: Keyboard, label: "Shortcuts", desc: "⌘K to search" },
    { key: "haptics" as const, icon: Vibrate, label: "Haptics", desc: "Touch feedback" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-light tracking-tight">Settings</h1>
      </header>

      <div className="space-y-2">
        {items.map(({ key, icon: Icon, label, desc }) => (
          <GlassCard key={key} className="!p-4 flex items-center gap-3">
            <Icon className="w-4 h-4 text-zinc-600 shrink-0" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-sm font-light">{label}</p>
              <p className="text-xs text-zinc-700">{desc}</p>
            </div>
            <Toggle on={settings[key]} onChange={(v) => update(key, v)} />
          </GlassCard>
        ))}
      </div>

      <GlassCard className="text-center py-5">
        <Shield className="w-5 h-5 text-zinc-600 mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-xs text-zinc-600 font-light">Nexus OSINT v1.0</p>
      </GlassCard>
    </div>
  );
}
