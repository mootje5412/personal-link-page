"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function LoadingSpinner({ text = "Generating..." }: { text?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12 gap-4"
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center pulse-glow">
          <Sparkles className="w-7 h-7 text-accent-purple animate-pulse" />
        </div>
      </div>
      <p className="text-sm text-zinc-400">{text}</p>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-accent-purple"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
