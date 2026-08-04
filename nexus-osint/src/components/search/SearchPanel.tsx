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
      <motion.div
        animate={{
          boxShadow: focused
            ? "0 0 40px rgba(59,130,246,0.25), 0 0 80px rgba(139,92,246,0.1)"
            : "0 0 0px rgba(59,130,246,0)",
        }}
        className={cn(
          "glass-strong rounded-[28px] flex items-center gap-3 px-5 py-4 transition-all duration-300",
          focused && "border-blue-500/30"
        )}
      >
        <Search className={cn("w-5 h-5 shrink-0 transition-colors", focused ? "text-blue-400" : "text-zinc-500")} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
          onFocus={() => { setFocused(true); setShowSuggestions(true); }}
          onBlur={() => setTimeout(() => { setFocused(false); setShowSuggestions(false); }, 200)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={SEARCH_PLACEHOLDERS[type]}
          className="flex-1 bg-transparent text-base text-white placeholder:text-zinc-500 outline-none min-w-0"
          disabled={loading}
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={submit}
          disabled={!query.trim() || loading}
          className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
            query.trim()
              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
              : "bg-white/5 text-zinc-600"
          )}
        >
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {showSuggestions && query && filtered.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 inset-x-0 glass-strong rounded-2xl overflow-hidden z-20"
        >
          {filtered.map((s) => (
            <button
              key={s}
              className="w-full px-5 py-3 text-left text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-2"
              onMouseDown={() => { setQuery(s); onSearch(s); }}
            >
              <Search className="w-3.5 h-3.5 text-zinc-600" />
              {s}
            </button>
          ))}
        </motion.div>
      )}

      <p className="text-center text-[10px] text-zinc-600 mt-3">
        Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">⌘K</kbd> to focus
      </p>
    </div>
  );
}
