"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { ToneSelector } from "@/components/ui/Selectors";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CopyButton } from "@/components/ui/CopyButton";
import { ShareButton } from "@/components/ui/ShareButton";
import { callAI } from "@/lib/ai/client";
import type { CaptionResult, CaptionTone } from "@/lib/ai/types";
import { useGenerations } from "@/hooks/useGenerations";
import { useHaptic } from "@/hooks/useHaptic";

const tones = [
  { value: "motivational", label: "Motivational", emoji: "🔥" },
  { value: "luxury", label: "Luxury", emoji: "✨" },
  { value: "funny", label: "Funny", emoji: "😂" },
  { value: "business", label: "Business", emoji: "💼" },
  { value: "fitness", label: "Fitness", emoji: "💪" },
  { value: "storytelling", label: "Storytelling", emoji: "📖" },
];

export default function CaptionPage() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("motivational");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CaptionResult | null>(null);
  const { add } = useGenerations();
  const haptic = useHaptic();

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    haptic("medium");
    setLoading(true);
    setResult(null);

    try {
      const response = await callAI<CaptionResult>("caption", {
        topic,
        tone: tone as CaptionTone,
      });
      setResult(response.data);
      add({
        type: "caption",
        title: topic,
        preview: response.data.caption.slice(0, 80),
        data: response.data,
      });
      haptic("success");
    } finally {
      setLoading(false);
    }
  };

  const sections = result
    ? [
        { label: "Caption", value: result.caption },
        { label: "Call to Action", value: result.cta },
        { label: "Emoji Version", value: result.emojiVersion },
        { label: "Short Version", value: result.shortVersion },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="Caption Generator"
        subtitle="AI-powered captions that convert"
        backHref="/"
      />

      <div className="space-y-4">
        <Input
          label="Topic or niche"
          placeholder="e.g. morning routine, fitness tips..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <div>
          <p className="text-sm font-medium text-zinc-400 mb-2">Select tone</p>
          <ToneSelector tones={tones} value={tone} onChange={setTone} />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!topic.trim() || loading}
          size="lg"
          className="w-full"
        >
          <Sparkles className="w-4 h-4" />
          Generate Caption
        </Button>
      </div>

      {loading && <LoadingSpinner text="Crafting your viral caption..." />}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-3"
          >
            {sections.map((section) => (
              <GlassCard key={section.label}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-zinc-400">
                    {section.label}
                  </h3>
                  <div className="flex gap-2">
                    <CopyButton text={section.value} />
                    <ShareButton title={section.label} text={section.value} />
                  </div>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {section.value}
                </p>
              </GlassCard>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
