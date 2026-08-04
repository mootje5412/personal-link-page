"use client";

import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Zap, History, TrendingUp, Rocket } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { setPremium } from "@/lib/storage";
import { useHaptic } from "@/hooks/useHaptic";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["3 generations/day", "Basic AI tools", "Viral analyzer", "Daily tips"],
    cta: "Current Plan",
    popular: false,
  },
  {
    id: "monthly",
    name: "Pro Monthly",
    price: "$9.99",
    period: "/month",
    features: [
      "Unlimited generations",
      "Advanced AI models",
      "Trend analysis",
      "Full history",
      "Priority speed",
    ],
    cta: "Start Pro",
    popular: true,
  },
  {
    id: "yearly",
    name: "Pro Yearly",
    price: "$79.99",
    period: "/year",
    features: [
      "Everything in Pro",
      "Save 33%",
      "Early access features",
      "Priority support",
      "Custom AI training",
    ],
    cta: "Best Value",
    popular: false,
    savings: "Save $40",
  },
];

const premiumFeatures = [
  { icon: Sparkles, label: "Unlimited generations" },
  { icon: Zap, label: "Advanced AI" },
  { icon: TrendingUp, label: "Trend analysis" },
  { icon: History, label: "Full history" },
  { icon: Rocket, label: "Priority speed" },
];

export default function PremiumPage() {
  const haptic = useHaptic();

  const handleUpgrade = (planId: string) => {
    if (planId === "free") return;
    haptic("success");
    setPremium(true);
  };

  return (
    <div>
      <PageHeader
        title="Go Pro"
        subtitle="Unlock the full power of ViralAI"
        backHref="/"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-6"
      >
        <GlassCard glow className="text-center py-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold gradient-text">ViralAI Pro</h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-xs mx-auto">
            Create unlimited viral content with advanced AI and premium features
          </p>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-2 gap-2 mb-6">
        {premiumFeatures.map((feat) => {
          const Icon = feat.icon;
          return (
            <GlassCard key={feat.label} padding="sm" className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-accent-purple shrink-0" />
              <span className="text-xs font-medium">{feat.label}</span>
            </GlassCard>
          );
        })}
      </div>

      <div className="space-y-4">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard
              className={plan.popular ? "gradient-border" : ""}
              glow={plan.popular}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">{plan.name}</h3>
                    {plan.popular && <Badge variant="premium">Popular</Badge>}
                    {"savings" in plan && plan.savings && (
                      <Badge variant="success">{plan.savings}</Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-xs text-zinc-500">{plan.period}</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-2 mb-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "primary" : "secondary"}
                className="w-full"
                onClick={() => handleUpgrade(plan.id)}
                disabled={plan.id === "free"}
              >
                {plan.cta}
              </Button>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-xs text-zinc-600 mt-6">
        Payment integration coming soon. Tap to preview Pro experience.
      </p>

      <Link
        href="/"
        className="block text-center text-sm text-accent-purple mt-4 hover:text-accent-pink transition-colors"
      >
        ← Back to app
      </Link>
    </div>
  );
}
