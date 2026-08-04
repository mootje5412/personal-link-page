"use client";

import { useState, useEffect } from "react";
import { Shield, Star, Pin, Search } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getHistory, toggleFavorite, togglePin } from "@/lib/storage";
import { formatRelativeTime } from "@/lib/utils";
import { SEARCH_LABELS } from "@/types/search";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const [history, setHistory] = useState(getHistory());

  useEffect(() => { setHistory(getHistory()); }, []);

  const refresh = () => setHistory(getHistory());

  return (
    <div className="space-y-6">
      <GlassCard glow="blue" className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center neon-blue">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <div>
          <p className="text-lg font-bold">Investigator</p>
          <p className="text-sm text-zinc-500">{history.length} searches · Pro Plan</p>
        </div>
      </GlassCard>

      <section>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-400" /> Saved Investigations
        </h2>
        {history.length === 0 ? (
          <GlassCard className="text-center py-8 text-sm text-zinc-500">No saved searches</GlassCard>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 10).map((item) => (
              <GlassCard key={item.id} className="!p-3">
                <div className="flex items-center gap-3">
                  <Link to={`/results?q=${encodeURIComponent(item.query)}&type=${item.type}`} className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.query}</p>
                    <p className="text-[10px] text-zinc-500">{SEARCH_LABELS[item.type]} · {formatRelativeTime(item.createdAt)}</p>
                  </Link>
                  <button onClick={() => { togglePin(item.id); refresh(); }} className="p-2 rounded-xl hover:bg-white/5">
                    <Pin className={`w-4 h-4 ${item.pinned ? "text-blue-400 fill-blue-400" : "text-zinc-600"}`} />
                  </button>
                  <button onClick={() => { toggleFavorite(item.id); refresh(); }} className="p-2 rounded-xl hover:bg-white/5">
                    <Star className={`w-4 h-4 ${item.favorite ? "text-amber-400 fill-amber-400" : "text-zinc-600"}`} />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
