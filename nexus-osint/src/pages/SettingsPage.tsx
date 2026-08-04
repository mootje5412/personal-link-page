"use client";

import { useState, useEffect } from "react";
import { Bell, Keyboard, Vibrate, Shield } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getSettings, saveSettings, type AppSettings } from "@/lib/storage";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-12 h-7 rounded-full transition-colors ${on ? "bg-blue-500" : "bg-white/10"}`}
    >
      <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
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
    { key: "notifications" as const, icon: Bell, label: "Notifications", desc: "Search alerts & updates" },
    { key: "keyboardShortcuts" as const, icon: Keyboard, label: "Keyboard Shortcuts", desc: "⌘K to focus search" },
    { key: "haptics" as const, icon: Vibrate, label: "Haptic Feedback", desc: "Vibration on actions" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Configure your experience</p>
      </header>

      <div className="space-y-3">
        {items.map(({ key, icon: Icon, label, desc }) => (
          <GlassCard key={key} className="!p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-zinc-500">{desc}</p>
            </div>
            <Toggle on={settings[key]} onChange={(v) => update(key, v)} />
          </GlassCard>
        ))}
      </div>

      <GlassCard className="text-center py-6">
        <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
        <p className="text-sm font-medium">Nexus OSINT v1.0</p>
        <p className="text-xs text-zinc-500 mt-1">Enterprise Intelligence Platform</p>
      </GlassCard>
    </div>
  );
}
