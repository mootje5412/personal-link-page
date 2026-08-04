"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getDailyTip } from "@/lib/storage";

export function DailyTip() {
  const tip = getDailyTip();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <GlassCard glow className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent-purple/20 to-transparent rounded-bl-full" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Daily Viral Tip
            </span>
          </div>
          <p className="text-sm leading-relaxed text-zinc-300">{tip}</p>
        </div>
      </GlassCard>
    </motion.div>
  );
}
