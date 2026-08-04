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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="flex justify-center mb-5"
        >
          <Logo size="lg" />
        </motion.div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight gradient-text mb-2">
          Nexus OSINT
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-xs mx-auto">
          Professional Open Source Intelligence Platform
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="w-full space-y-5"
      >
        <SearchTabs active={type} onChange={setType} />
        <SearchPanel type={type} onSearch={handleSearch} />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-[10px] text-zinc-600 mt-8 text-center"
      >
        Enterprise-grade intelligence · Encrypted · GDPR compliant
      </motion.p>
    </div>
  );
}
