"use client";

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Pin, Star, TrendingUp, Clock, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getHistory } from "@/lib/storage";
import { formatRelativeTime } from "@/lib/utils";
import { SEARCH_LABELS, type SearchType } from "@/types/search";
import { useState, useEffect } from "react";

function AnimatedCounter({ value, label }: { value: number; label: string }) {
  return (
    <GlassCard className="text-center py-4">
      <motion.p
        key={value}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold gradient-text"
      >
        {value}
      </motion.p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
    </GlassCard>
  );
}

export default function DashboardPage() {
  const [history, setHistory] = useState(getHistory());

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const stats = useMemo(() => ({
    total: history.length,
    pinned: history.filter((h) => h.pinned).length,
    favorites: history.filter((h) => h.favorite).length,
    today: history.filter((h) => Date.now() - new Date(h.createdAt).getTime() < 86400000).length,
  }), [history]);

  const recent = history.slice(0, 8);
  const pinned = history.filter((h) => h.pinned);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Search analytics & history</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <AnimatedCounter value={stats.total} label="Total Searches" />
        <AnimatedCounter value={stats.today} label="Today" />
        <AnimatedCounter value={stats.pinned} label="Pinned" />
        <AnimatedCounter value={stats.favorites} label="Favorites" />
      </div>

      {pinned.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Pin className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold">Pinned Searches</h2>
          </div>
          <div className="space-y-2">
            {pinned.map((item) => (
              <HistoryItem key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold">Recent Searches</h2>
          </div>
          <TrendingUp className="w-4 h-4 text-zinc-600" />
        </div>

        {recent.length === 0 ? (
          <GlassCard className="text-center py-10">
            <Search className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No searches yet</p>
            <Link to="/" className="text-blue-400 text-xs mt-2 inline-block">Start investigating →</Link>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {recent.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <HistoryItem item={item} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HistoryItem({ item }: { item: { id: string; query: string; type: SearchType; createdAt: string; favorite?: boolean } }) {
  return (
    <Link to={`/results?q=${encodeURIComponent(item.query)}&type=${item.type}`}>
      <GlassCard className="!p-3 hover:bg-white/5 transition-colors flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Search className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.query}</p>
          <p className="text-[10px] text-zinc-500">{SEARCH_LABELS[item.type]} · {formatRelativeTime(item.createdAt)}</p>
        </div>
        {item.favorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
        <ChevronRight className="w-4 h-4 text-zinc-600" />
      </GlassCard>
    </Link>
  );
}
