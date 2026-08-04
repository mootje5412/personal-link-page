"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatRelativeTime } from "@/lib/utils";
import { useGenerations } from "@/hooks/useGenerations";

const typeLabels: Record<string, string> = {
  caption: "Caption",
  ideas: "Video Ideas",
  script: "Script",
  hashtags: "Hashtags",
  analyze: "Analysis",
};

export function RecentGenerations() {
  const { generations } = useGenerations();
  const recent = generations.slice(0, 5);

  if (recent.length === 0) {
    return (
      <GlassCard>
        <p className="text-sm text-zinc-500 text-center py-4">
          No generations yet. Try an AI tool to get started!
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-2">
      {recent.map((gen, i) => (
        <motion.div
          key={gen.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <GlassCard padding="sm" className="hover:bg-surface-hover transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-accent-purple">
                    {typeLabels[gen.type] || gen.type}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(gen.createdAt)}
                  </span>
                </div>
                <p className="text-sm font-medium truncate mt-0.5">{gen.title}</p>
                <p className="text-xs text-zinc-500 truncate">{gen.preview}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
            </div>
          </GlassCard>
        </motion.div>
      ))}
      <Link
        href="/profile"
        className="block text-center text-xs text-accent-purple hover:text-accent-pink transition-colors py-2"
      >
        View all history →
      </Link>
    </div>
  );
}
