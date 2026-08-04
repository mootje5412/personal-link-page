"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Clock, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CopyButton } from "@/components/ui/CopyButton";
import { callAI } from "@/lib/ai/client";
import type { VideoIdea } from "@/lib/ai/types";
import { useGenerations } from "@/hooks/useGenerations";
import { useHaptic } from "@/hooks/useHaptic";

const difficultyColors = {
  Easy: "success" as const,
  Medium: "warning" as const,
  Hard: "info" as const,
};

export default function IdeasPage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const { add } = useGenerations();
  const haptic = useHaptic();

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    haptic("medium");
    setLoading(true);
    setIdeas([]);

    try {
      const response = await callAI<VideoIdea[]>("ideas", { topic });
      setIdeas(response.data);
      add({
        type: "ideas",
        title: topic,
        preview: `${response.data.length} viral video ideas`,
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
        title="Video Ideas"
        subtitle="20 viral video ideas tailored to your niche"
      />

      <div className="space-y-4">
        <Input
          label="Your niche or topic"
          placeholder="e.g. productivity, cooking, finance..."
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
          Generate 20 Ideas
        </Button>
      </div>

      {loading && <LoadingSpinner text="Brainstorming viral ideas..." />}

      <AnimatePresence>
        {ideas.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 space-y-2"
          >
            <p className="text-xs text-zinc-500 mb-3">
              {ideas.length} ideas generated
            </p>
            {ideas.map((idea, i) => (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <GlassCard padding="sm">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-xl bg-white/5 flex items-center justify-center text-xs font-bold text-zinc-500 shrink-0">
                      {idea.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">
                        {idea.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant={difficultyColors[idea.difficulty]}>
                          {idea.difficulty}
                        </Badge>
                        <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                          <TrendingUp className="w-3 h-3" />
                          {idea.viralPotential}% viral
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                          <Clock className="w-3 h-3" />
                          {idea.bestUploadTime}
                        </span>
                      </div>
                    </div>
                    <CopyButton text={idea.title} label="" className="shrink-0 !px-2" />
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
