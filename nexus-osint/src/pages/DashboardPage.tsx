"use client";

import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Pin, Star, Clock, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getHistory } from "@/lib/storage";
import { formatRelativeTime } from "@/lib/utils";
import { SEARCH_LABELS, type SearchType } from "@/types/search";

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <GlassCard className="text-center py-4">
      <motion.p
        key={value}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-3xl font-light tabular-nums tracking-tight"
      >
        {value}
      </motion.p>
      <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-[0.12em]">{label}</p>
    </GlassCard>
  );
}

export default function DashboardPage() {
  const [history, setHistory] = useState(getHistory());
  useEffect(() => { setHistory(getHistory()); }, []);

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
        <h1 className="text-2xl font-light tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-600 mt-0.5 font-light">Search history</p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <Stat value={stats.total} label="Total" />
        <Stat value={stats.today} label="Today" />
        <Stat value={stats.pinned} label="Pinned" />
        <Stat value={stats.favorites} label="Saved" />
      </div>

      {pinned.length > 0 && (
        <section>
          <h2 className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 mb-3 flex items-center gap-2">
            <Pin className="w-3 h-3" strokeWidth={1.5} /> Pinned
          </h2>
          <div className="space-y-1.5">
            {pinned.map((item) => <HistoryItem key={item.id} item={item} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 mb-3 flex items-center gap-2">
          <Clock className="w-3 h-3" strokeWidth={1.5} /> Recent
        </h2>
        {recent.length === 0 ? (
          <GlassCard className="text-center py-10">
            <Search className="w-6 h-6 text-zinc-800 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-zinc-600 font-light">No searches yet</p>
            <Link to="/" className="text-white text-xs mt-2 inline-block underline underline-offset-4 decoration-white/20">Search</Link>
          </GlassCard>
        ) : (
          <div className="space-y-1.5">
            {recent.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
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
      <GlassCard className="!p-3 hover:bg-white/[0.03] transition-colors flex items-center gap-3">
        <Search className="w-4 h-4 text-zinc-600 shrink-0" strokeWidth={1.5} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-light truncate">{item.query}</p>
          <p className="text-[10px] text-zinc-700">{SEARCH_LABELS[item.type]} · {formatRelativeTime(item.createdAt)}</p>
        </div>
        {item.favorite && <Star className="w-3.5 h-3.5 text-white fill-white" strokeWidth={1.5} />}
        <ChevronRight className="w-4 h-4 text-zinc-800" strokeWidth={1.5} />
      </GlassCard>
    </Link>
  );
}
