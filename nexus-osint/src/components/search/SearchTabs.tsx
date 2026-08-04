"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SearchType } from "@/types/search";
import { SEARCH_LABELS } from "@/types/search";
import {
  User, Mail, Globe, Wifi, Phone, Hash, Building2,
} from "lucide-react";

const tabs: { type: SearchType; icon: typeof User }[] = [
  { type: "username", icon: User },
  { type: "email", icon: Mail },
  { type: "domain", icon: Globe },
  { type: "ip", icon: Wifi },
  { type: "phone", icon: Phone },
  { type: "hash", icon: Hash },
  { type: "company", icon: Building2 },
];

interface SearchTabsProps {
  active: SearchType;
  onChange: (type: SearchType) => void;
}

export function SearchTabs({ active, onChange }: SearchTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
      {tabs.map(({ type, icon: Icon }) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={cn(
            "relative flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-medium whitespace-nowrap transition-all shrink-0",
            active === type
              ? "text-white"
              : "text-zinc-500 hover:text-zinc-300 glass"
          )}
        >
          {active === type && (
            <motion.div
              layoutId="tab-bg"
              className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <Icon className="w-3.5 h-3.5 relative z-10" />
          <span className="relative z-10">{SEARCH_LABELS[type]}</span>
        </button>
      ))}
    </div>
  );
}
