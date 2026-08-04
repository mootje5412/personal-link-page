"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Vibrate, Bell, ArrowLeft } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getSettings, saveSettings, type AppSettings } from "@/lib/storage";
import { useHaptic } from "@/hooks/useHaptic";

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
        enabled ? "bg-accent-purple" : "bg-white/10"
      }`}
    >
      <span
        className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
          enabled ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: true,
    haptics: true,
    notifications: true,
  });
  const haptic = useHaptic();

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const update = (key: keyof AppSettings, value: boolean) => {
    haptic("light");
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveSettings(updated);
  };

  const items = [
    {
      key: "darkMode" as const,
      icon: Moon,
      label: "Dark Mode",
      desc: "Always on for premium experience",
    },
    {
      key: "haptics" as const,
      icon: Vibrate,
      label: "Haptic Feedback",
      desc: "Vibration on interactions",
    },
    {
      key: "notifications" as const,
      icon: Bell,
      label: "Notifications",
      desc: "Daily viral tips & updates",
    },
  ];

  return (
    <div>
      <Link
        href="/profile"
        onClick={() => haptic("light")}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <GlassCard key={item.key} padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
                </div>
                <Toggle
                  enabled={settings[item.key]}
                  onChange={(v) => update(item.key, v)}
                />
              </div>
            </GlassCard>
          );
        })}
      </div>

      <GlassCard className="mt-6">
        <p className="text-xs text-zinc-500 text-center">
          ViralAI v1.0.0 · Made with AI
        </p>
      </GlassCard>
    </div>
  );
}
