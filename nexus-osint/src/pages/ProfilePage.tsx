"use client";

import { useState, useEffect } from "react";
import { Shield, Star, Pin } from "lucide-react";
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
      <GlassCard className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl border border-white/15 flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-lg font-light tracking-tight">Investigator</p>
          <p className="text-sm text-zinc-600 font-light">{history.length} searches</p>
        </div>
      </GlassCard>

      <section>
        <h2 className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 mb-3">Saved</h2>
        {history.length === 0 ? (
          <GlassCard className="text-center py-8 text-sm text-zinc-600 font-light">Empty</GlassCard>
        ) : (
          <div className="space-y-1.5">
            {history.slice(0, 10).map((item) => (
              <GlassCard key={item.id} className="!p-3">
                <div className="flex items-center gap-3">
                  <Link to={`/results?q=${encodeURIComponent(item.query)}&type=${item.type}`} className="flex-1 min-w-0">
                    <p className="text-sm font-light truncate">{item.query}</p>
                    <p className="text-[10px] text-zinc-700">{SEARCH_LABELS[item.type]} · {formatRelativeTime(item.createdAt)}</p>
                  </Link>
                  <button onClick={() => { togglePin(item.id); refresh(); }} className="p-2 rounded-lg hover:bg-white/5">
                    <Pin className={`w-3.5 h-3.5 ${item.pinned ? "text-white fill-white" : "text-zinc-700"}`} strokeWidth={1.5} />
                  </button>
                  <button onClick={() => { toggleFavorite(item.id); refresh(); }} className="p-2 rounded-lg hover:bg-white/5">
                    <Star className={`w-3.5 h-3.5 ${item.favorite ? "text-white fill-white" : "text-zinc-700"}`} strokeWidth={1.5} />
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
