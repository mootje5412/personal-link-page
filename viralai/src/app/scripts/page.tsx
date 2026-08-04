"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { DurationSelector } from "@/components/ui/Selectors";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CopyButton } from "@/components/ui/CopyButton";
import { ShareButton } from "@/components/ui/ShareButton";
import { callAI } from "@/lib/ai/client";
import type { ScriptResult, ScriptDuration } from "@/lib/ai/types";
import { useGenerations } from "@/hooks/useGenerations";
import { useHaptic } from "@/hooks/useHaptic";

export default function ScriptsPage() {
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("30");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScriptResult | null>(null);
  const { add } = useGenerations();
  const haptic = useHaptic();

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    haptic("medium");
    setLoading(true);
    setResult(null);

    try {
      const response = await callAI<ScriptResult>("script", {
        topic,
        duration: duration as ScriptDuration,
      });
      setResult(response.data);
      add({
        type: "script",
        title: `${topic} (${duration}s)`,
        preview: response.data.hook.slice(0, 80),
        data: response.data,
      });
      haptic("success");
    } finally {
      setLoading(false);
    }
  };

  const sections = result
    ? [
        { label: "Hook", value: result.hook, color: "text-accent-purple" },
        { label: "Body", value: result.body, color: "text-foreground" },
        { label: "Ending", value: result.ending, color: "text-accent-pink" },
        { label: "Call to Action", value: result.cta, color: "text-accent-orange" },
      ]
    : [];

  const fullScript = result
    ? `${result.hook}\n\n${result.body}\n\n${result.ending}\n\n${result.cta}`
    : "";

  return (
    <div>
      <PageHeader
        title="Script Generator"
        subtitle="Hook, body, ending & CTA — ready to film"
      />

      <div className="space-y-4">
        <Input
          label="Video topic"
          placeholder="e.g. 5 morning habits that changed my life"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <div>
          <p className="text-sm font-medium text-zinc-400 mb-2">Duration</p>
          <DurationSelector value={duration} onChange={setDuration} />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!topic.trim() || loading}
          size="lg"
          className="w-full"
        >
          <Sparkles className="w-4 h-4" />
          Generate Script
        </Button>
      </div>

      {loading && <LoadingSpinner text="Writing your viral script..." />}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-3"
          >
            <div className="flex gap-2 mb-2">
              <CopyButton text={fullScript} label="Copy Full Script" />
              <ShareButton title="Viral Script" text={fullScript} />
            </div>

            {sections.map((section, i) => (
              <motion.div
                key={section.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-sm font-bold ${section.color}`}>
                      {section.label}
                    </h3>
                    <CopyButton text={section.value} />
                  </div>
                  <p className="text-sm leading-relaxed">{section.value}</p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
