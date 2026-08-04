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
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
      {tabs.map(({ type, icon: Icon }) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={cn(
            "relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
            active === type ? "text-white" : "text-zinc-600 hover:text-zinc-400"
          )}
        >
          {active === type && (
            <motion.div
              layoutId="tab-bg"
              className="absolute inset-0 bg-white/10 rounded-xl border border-white/10"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <Icon className="w-3.5 h-3.5 relative z-10" strokeWidth={1.5} />
          <span className="relative z-10">{SEARCH_LABELS[type]}</span>
        </button>
      ))}
    </div>
  );
}
