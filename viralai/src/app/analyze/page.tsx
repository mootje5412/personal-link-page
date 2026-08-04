"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { TabSelector } from "@/components/ui/Selectors";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { callAI } from "@/lib/ai/client";
import type { AnalyzerResult } from "@/lib/ai/types";
import { useGenerations } from "@/hooks/useGenerations";
import { useHaptic } from "@/hooks/useHaptic";

export default function AnalyzePage() {
  const [input, setInput] = useState("");
  const [inputType, setInputType] = useState("caption");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzerResult | null>(null);
  const { add } = useGenerations();
  const haptic = useHaptic();

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    haptic("medium");
    setLoading(true);
    setResult(null);

    try {
      const response = await callAI<AnalyzerResult>("analyze", {
        input,
        inputType: inputType as "caption" | "video-idea",
      });
      setResult(response.data);
      add({
        type: "analyze",
        title: input.slice(0, 40),
        preview: `Score: ${response.data.viralScore}/100`,
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
        title="Viral Analyzer"
        subtitle="Score your content and get actionable improvements"
      />

      <div className="space-y-4">
        <TabSelector
          options={[
            { value: "caption", label: "Caption" },
            { value: "video-idea", label: "Video Idea" },
          ]}
          value={inputType}
          onChange={setInputType}
        />

        <Textarea
          label="Paste your content"
          placeholder={
            inputType === "caption"
              ? "Paste your caption here..."
              : "Describe your video idea..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <Button
          onClick={handleAnalyze}
          disabled={!input.trim() || loading}
          size="lg"
          className="w-full"
        >
          <Sparkles className="w-4 h-4" />
          Analyze Content
        </Button>
      </div>

      {loading && <LoadingSpinner text="Analyzing viral potential..." />}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <GlassCard className="flex flex-col items-center py-6">
              <ScoreRing score={result.viralScore} label="Viral Score" />
            </GlassCard>

            <div className="grid grid-cols-2 gap-3">
              <GlassCard padding="sm" className="text-center">
                <p className="text-2xl font-bold text-accent-purple">
                  {result.hookScore}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Hook Score</p>
              </GlassCard>
              <GlassCard padding="sm" className="text-center">
                <p className="text-sm font-semibold">{result.watchTimePrediction}</p>
                <p className="text-xs text-zinc-500 mt-1">Watch Time</p>
              </GlassCard>
              <GlassCard padding="sm" className="text-center col-span-2">
                <p className="text-sm font-semibold">{result.engagementPrediction}</p>
                <p className="text-xs text-zinc-500 mt-1">Engagement Prediction</p>
              </GlassCard>
            </div>

            <GlassCard>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold">Improvements</h3>
              </div>
              <ul className="space-y-2">
                {result.improvements.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-amber-400 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold">Suggested Changes</h3>
              </div>
              <ul className="space-y-2">
                {result.suggestedChanges.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-emerald-400 mt-0.5">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
