"use client";

import { cn } from "@/lib/utils";
import { useHaptic } from "@/hooks/useHaptic";

interface ToneSelectorProps {
  tones: { value: string; label: string; emoji: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function ToneSelector({ tones, value, onChange }: ToneSelectorProps) {
  const haptic = useHaptic();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {tones.map((tone) => (
        <button
          key={tone.value}
          onClick={() => {
            haptic("light");
            onChange(tone.value);
          }}
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200",
            value === tone.value
              ? "bg-gradient-to-r from-accent-purple/30 to-accent-pink/30 border border-accent-purple/40 text-white"
              : "glass text-zinc-400 hover:text-foreground hover:bg-surface-hover"
          )}
        >
          <span>{tone.emoji}</span>
          <span>{tone.label}</span>
        </button>
      ))}
    </div>
  );
}

interface DurationSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function DurationSelector({ value, onChange }: DurationSelectorProps) {
  const haptic = useHaptic();
  const durations = [
    { value: "15", label: "15 sec" },
    { value: "30", label: "30 sec" },
    { value: "60", label: "60 sec" },
  ];

  return (
    <div className="flex gap-2">
      {durations.map((d) => (
        <button
          key={d.value}
          onClick={() => {
            haptic("light");
            onChange(d.value);
          }}
          className={cn(
            "flex-1 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200",
            value === d.value
              ? "bg-gradient-to-r from-accent-purple/30 to-accent-pink/30 border border-accent-purple/40 text-white"
              : "glass text-zinc-400 hover:text-foreground"
          )}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

interface TabSelectorProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function TabSelector({ options, value, onChange }: TabSelectorProps) {
  const haptic = useHaptic();

  return (
    <div className="flex gap-1 p-1 rounded-2xl glass">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => {
            haptic("light");
            onChange(opt.value);
          }}
          className={cn(
            "flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200",
            value === opt.value
              ? "bg-white/10 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
