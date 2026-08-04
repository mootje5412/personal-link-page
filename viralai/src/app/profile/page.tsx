"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Crown,
  Settings,
  Heart,
  History,
  Trash2,
  ChevronRight,
  Star,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils";
import { useGenerations } from "@/hooks/useGenerations";
import { isPremium } from "@/lib/storage";
import { useHaptic } from "@/hooks/useHaptic";

const typeLabels: Record<string, string> = {
  caption: "Caption",
  ideas: "Video Ideas",
  script: "Script",
  hashtags: "Hashtags",
  analyze: "Analysis",
};

export default function ProfilePage() {
  const [premium, setPremiumState] = useState(false);
  const [tab, setTab] = useState<"history" | "favorites">("history");
  const { generations, toggleFav, remove } = useGenerations();
  const haptic = useHaptic();

  useEffect(() => {
    setPremiumState(isPremium());
  }, []);

  const filtered =
    tab === "favorites"
      ? generations.filter((g) => g.favorite)
      : generations;

  const menuItems = [
    { href: "/settings", icon: Settings, label: "Settings" },
    { href: "/premium", icon: Crown, label: "Upgrade to Pro" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Profile</h1>
      </header>

      <GlassCard>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple via-accent-pink to-accent-orange flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold">V</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">Creator</p>
              {premium ? (
                <Badge variant="premium">
                  <Crown className="w-3 h-3" />
                  Pro
                </Badge>
              ) : (
                <Badge>Free</Badge>
              )}
            </div>
            <p className="text-sm text-zinc-500 mt-0.5">
              {generations.length} generations · Member since 2026
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={() => haptic("light")}>
              <GlassCard padding="sm" className="hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-zinc-400" />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>

      <section>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              haptic("light");
              setTab("history");
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
              tab === "history"
                ? "bg-white/10 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <History className="w-4 h-4" />
            History
          </button>
          <button
            onClick={() => {
              haptic("light");
              setTab("favorites");
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
              tab === "favorites"
                ? "bg-white/10 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Heart className="w-4 h-4" />
            Favorites
          </button>
        </div>

        {filtered.length === 0 ? (
          <GlassCard>
            <p className="text-sm text-zinc-500 text-center py-6">
              {tab === "favorites"
                ? "No favorites yet. Tap the star on any generation."
                : "No history yet. Start creating!"}
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {filtered.map((gen, i) => (
              <motion.div
                key={gen.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <GlassCard padding="sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-accent-purple">
                          {typeLabels[gen.type]}
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          {formatRelativeTime(gen.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate mt-0.5">
                        {gen.title}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">{gen.preview}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => {
                          haptic("light");
                          toggleFav(gen.id);
                        }}
                        className="p-2 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            gen.favorite
                              ? "fill-amber-400 text-amber-400"
                              : "text-zinc-600"
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => {
                          haptic("light");
                          remove(gen.id);
                        }}
                        className="p-2 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-zinc-600" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
