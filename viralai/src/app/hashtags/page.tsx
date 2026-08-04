"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CopyButton } from "@/components/ui/CopyButton";
import { callAI } from "@/lib/ai/client";
import type { HashtagResult } from "@/lib/ai/types";
import { useGenerations } from "@/hooks/useGenerations";
import { useHaptic } from "@/hooks/useHaptic";

const categories = [
  { key: "trending" as const, label: "Trending", color: "text-accent-purple" },
  { key: "niche" as const, label: "Niche", color: "text-accent-pink" },
  { key: "lowCompetition" as const, label: "Low Competition", color: "text-emerald-400" },
  { key: "highReach" as const, label: "High Reach", color: "text-accent-orange" },
];

export default function HashtagsPage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HashtagResult | null>(null);
  const { add } = useGenerations();
  const haptic = useHaptic();

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    haptic("medium");
    setLoading(true);
    setResult(null);

    try {
      const response = await callAI<HashtagResult>("hashtags", { topic });
      setResult(response.data);
      add({
        type: "hashtags",
        title: topic,
        preview: response.data.trending.slice(0, 3).join(" "),
        data: response.data,
      });
      haptic("success");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Hashtag Generator"
        subtitle="Smart hashtags for maximum reach"
        backHref="/"
      />

      <div className="space-y-4">
        <Input
          label="Content topic"
          placeholder="e.g. travel, tech reviews, cooking..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <Button
          onClick={handleGenerate}
          disabled={!topic.trim() || loading}
          size="lg"
          className="w-full"
        >
          <Sparkles className="w-4 h-4" />
          Generate Hashtags
        </Button>
      </div>

      {loading && <LoadingSpinner text="Finding the best hashtags..." />}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-3"
          >
            {categories.map((cat, i) => {
              const tags = result[cat.key];
              const allTags = tags.join(" ");
              return (
                <motion.div
                  key={cat.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <GlassCard>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-sm font-semibold ${cat.color}`}>
                        {cat.label}
                      </h3>
                      <CopyButton text={allTags} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-xl bg-white/5 text-xs font-medium text-zinc-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                const all = Object.values(result).flat().join(" ");
                navigator.clipboard.writeText(all);
                haptic("success");
              }}
            >
              Copy All Hashtags
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
