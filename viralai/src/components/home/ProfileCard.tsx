"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { useEffect, useState } from "react";
import { isPremium } from "@/lib/storage";

export function ProfileCard() {
  const [premium, setPremiumState] = useState(false);

  useEffect(() => {
    setPremiumState(isPremium());
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Link href="/profile">
        <GlassCard className="hover:bg-surface-hover transition-all duration-200 active:scale-[0.99]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-purple via-accent-pink to-accent-orange flex items-center justify-center shadow-lg shadow-accent-purple/20">
              <span className="text-xl font-bold">V</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold">Creator</p>
                {premium ? (
                  <Badge variant="premium">
                    <Crown className="w-3 h-3" />
                    Pro
                  </Badge>
                ) : (
                  <Badge>Free</Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {premium ? "Unlimited AI generations" : "3 free generations left today"}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-600" />
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}
