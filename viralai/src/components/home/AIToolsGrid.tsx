"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Video,
  FileText,
  Hash,
  BarChart3,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useHaptic } from "@/hooks/useHaptic";

const tools = [
  {
    href: "/caption",
    icon: MessageSquare,
    label: "Captions",
    desc: "AI captions",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    href: "/ideas",
    icon: Video,
    label: "Video Ideas",
    desc: "20 viral ideas",
    gradient: "from-pink-500 to-rose-600",
  },
  {
    href: "/scripts",
    icon: FileText,
    label: "Scripts",
    desc: "Hook to CTA",
    gradient: "from-orange-500 to-amber-600",
  },
  {
    href: "/hashtags",
    icon: Hash,
    label: "Hashtags",
    desc: "Smart tags",
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    href: "/analyze",
    icon: BarChart3,
    label: "Analyzer",
    desc: "Viral score",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    href: "/trends",
    icon: TrendingUp,
    label: "Trends",
    desc: "What's hot",
    gradient: "from-fuchsia-500 to-pink-600",
  },
];

export function AIToolsGrid() {
  const haptic = useHaptic();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">AI Tools</h2>
        <Sparkles className="w-4 h-4 text-accent-purple" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {tools.map((tool, i) => {
          const Icon = tool.icon;
          return (
            <motion.div
              key={tool.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={tool.href}
                onClick={() => haptic("light")}
                className="block"
              >
                <GlassCard padding="sm" className="hover:bg-surface-hover active:scale-[0.98] transition-all duration-200 h-full">
                  <div
                    className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-2.5 shadow-lg`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-semibold">{tool.label}</p>
                  <p className="text-xs text-zinc-500">{tool.desc}</p>
                </GlassCard>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
