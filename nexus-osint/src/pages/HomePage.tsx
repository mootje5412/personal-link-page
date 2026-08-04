"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "@/components/layout/BottomNav";
import { SearchPanel } from "@/components/search/SearchPanel";
import { SearchTabs } from "@/components/search/SearchTabs";
import type { SearchType } from "@/types/search";
import { addSearch } from "@/lib/storage";
import { generateId } from "@/lib/utils";

export default function HomePage() {
  const [type, setType] = useState<SearchType>("username");
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    addSearch({ id: generateId(), query, type, createdAt: new Date().toISOString() });
    navigate(`/results?q=${encodeURIComponent(query)}&type=${type}`);
  };

  return (
    <div className="min-h-[calc(100dvh-8rem)] flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-10"
      >
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>
        <h1 className="text-4xl sm:text-[2.75rem] font-light tracking-tight text-white mb-2">
          Nexus OSINT
        </h1>
        <p className="text-sm text-zinc-500 font-light max-w-xs mx-auto">
          Open Source Intelligence Platform
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full space-y-4"
      >
        <SearchTabs active={type} onChange={setType} />
        <SearchPanel type={type} onSearch={handleSearch} />
      </motion.div>
    </div>
  );
}
