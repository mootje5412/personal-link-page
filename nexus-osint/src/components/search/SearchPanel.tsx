"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchType } from "@/types/search";
import { SEARCH_PLACEHOLDERS } from "@/types/search";
import { SUGGESTIONS } from "@/lib/storage";

interface SearchPanelProps {
  type: SearchType;
  onSearch: (query: string) => void;
  loading?: boolean;
}

export function SearchPanel({ type, onSearch, loading }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const submit = () => {
    if (query.trim() && !loading) onSearch(query.trim());
  };

  const filtered = SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div
        className={cn(
          "glass-strong rounded-2xl flex items-center gap-3 px-4 py-3.5 transition-all duration-200",
          focused && "border-white/20"
        )}
      >
        <Search className={cn("w-[18px] h-[18px] shrink-0", focused ? "text-white" : "text-zinc-600")} strokeWidth={1.5} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
          onFocus={() => { setFocused(true); setShowSuggestions(true); }}
          onBlur={() => setTimeout(() => { setFocused(false); setShowSuggestions(false); }, 200)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={SEARCH_PLACEHOLDERS[type]}
          className="flex-1 bg-transparent text-[15px] text-white placeholder:text-zinc-600 outline-none min-w-0 font-light"
          disabled={loading}
        />
        <button
          onClick={submit}
          disabled={!query.trim() || loading}
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
            query.trim()
              ? "bg-white text-black"
              : "bg-white/5 text-zinc-700"
          )}
        >
          <ArrowRight className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>

      {showSuggestions && query && filtered.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-1.5 inset-x-0 glass-strong rounded-xl overflow-hidden z-20"
        >
          {filtered.map((s) => (
            <button
              key={s}
              className="w-full px-4 py-3 text-left text-sm text-zinc-400 hover:text-white hover:bg-white/5 flex items-center gap-2 font-light"
              onMouseDown={() => { setQuery(s); onSearch(s); }}
            >
              <Search className="w-3.5 h-3.5 text-zinc-600" strokeWidth={1.5} />
              {s}
            </button>
          ))}
        </motion.div>
      )}

      <p className="text-center text-[10px] text-zinc-700 mt-3 tracking-wide">
        <kbd className="px-1.5 py-0.5 rounded border border-white/10 text-zinc-600 font-mono text-[9px]">⌘K</kbd>
      </p>
    </div>
  );
}
