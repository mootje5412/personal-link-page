"use client";

import { motion } from "framer-motion";
import { Sparkles, Crown } from "lucide-react";
import Link from "next/link";
import { AIToolsGrid } from "@/components/home/AIToolsGrid";
import { RecentGenerations } from "@/components/home/RecentGenerations";
import { DailyTip } from "@/components/home/DailyTip";
import { ProfileCard } from "@/components/home/ProfileCard";
import { Badge } from "@/components/ui/Badge";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold gradient-text">ViralAI</h1>
            <Badge variant="premium">
              <Sparkles className="w-3 h-3" />
              AI
            </Badge>
          </div>
          <p className="text-sm text-zinc-400 mt-0.5">
            Your pocket viral content studio
          </p>
        </div>
        <Link
          href="/premium"
          className="w-10 h-10 rounded-2xl glass flex items-center justify-center hover:bg-surface-hover transition-colors"
        >
          <Crown className="w-5 h-5 text-amber-400" />
        </Link>
      </motion.header>

      <ProfileCard />
      <DailyTip />
      <AIToolsGrid />

      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Generations</h2>
        <RecentGenerations />
      </section>
    </div>
  );
}
