"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Hash,
  Music,
  Layers,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CopyButton } from "@/components/ui/CopyButton";
import { callAI } from "@/lib/ai/client";
import type { TrendData } from "@/lib/ai/types";
import { useHaptic } from "@/hooks/useHaptic";

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const trendColors = {
  up: "text-emerald-400",
  down: "text-red-400",
  stable: "text-zinc-400",
};

export default function TrendsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TrendData | null>(null);
  const haptic = useHaptic();

  const loadTrends = async () => {
    setLoading(true);
    haptic("light");
    try {
      const response = await callAI<TrendData>("trends", {});
      setData(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader
        title="Trends"
        subtitle="What's trending right now"
        backHref="/"
      />

      <div className="flex justify-end mb-4">
        <Button variant="ghost" size="sm" onClick={loadTrends} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && !data && <LoadingSpinner text="Loading trends..." />}

      {data && (
        <div className="space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-accent-purple" />
              <h2 className="text-sm font-semibold">Trending Niches</h2>
            </div>
            <div className="space-y-2">
              {data.niches.map((niche, i) => (
                <motion.div
                  key={niche.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GlassCard padding="sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{niche.name}</p>
                        <p className="text-xs text-zinc-500">{niche.posts} posts</p>
                      </div>
                      <Badge variant="success">+{niche.growth}%</Badge>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-accent-pink" />
              <h2 className="text-sm font-semibold">Trending Topics</h2>
            </div>
            <div className="space-y-2">
              {data.topics.map((topic, i) => {
                const Icon = trendIcons[topic.trend];
                return (
                  <GlassCard key={topic.name} padding="sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{topic.name}</p>
                        <p className="text-xs text-zinc-500">{topic.volume} views</p>
                      </div>
                      <Icon className={`w-4 h-4 ${trendColors[topic.trend]}`} />
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Music className="w-4 h-4 text-accent-orange" />
              <h2 className="text-sm font-semibold">Trending Sounds</h2>
              <Badge>Placeholder</Badge>
            </div>
            <div className="space-y-2">
              {data.sounds.map((sound) => (
                <GlassCard key={sound.name} padding="sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{sound.name}</p>
                      <p className="text-xs text-zinc-500">
                        {sound.uses} uses · {sound.platform}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Hash className="w-4 h-4 text-accent-blue" />
              <h2 className="text-sm font-semibold">Trending Hashtags</h2>
            </div>
            <div className="space-y-2">
              {data.hashtags.map((tag) => (
                <GlassCard key={tag.tag} padding="sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{tag.tag}</p>
                      <p className="text-xs text-zinc-500">{tag.posts} posts</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">+{tag.growth}%</Badge>
                      <CopyButton text={tag.tag} label="" className="!px-2" />
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
