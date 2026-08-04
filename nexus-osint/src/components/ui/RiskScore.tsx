"use client";

import { motion } from "framer-motion";

interface RiskScoreProps {
  score: number;
  size?: number;
}

export function RiskScore({ score, size = 100 }: RiskScoreProps) {
  const stroke = 2;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const opacity = 0.3 + (score / 100) * 0.7;
  const label = score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`rgba(255,255,255,${opacity})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-light tabular-nums tracking-tight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {score}
        </motion.span>
        <span className="text-[9px] text-zinc-600 uppercase tracking-[0.15em] mt-0.5">{label}</span>
      </div>
    </div>
  );
}
