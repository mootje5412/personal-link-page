"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

const icons = {
  info: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertCircle,
};

const colors = {
  info: "text-blue-400 border-blue-500/30",
  success: "text-emerald-400 border-emerald-500/30",
  error: "text-red-400 border-red-500/30",
  warning: "text-amber-400 border-amber-500/30",
};

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-[calc(var(--safe-top)+1rem)] inset-x-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={cn(
                "pointer-events-auto glass-strong rounded-2xl px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-md border shadow-xl",
                colors[t.type]
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <p className="text-sm flex-1">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="p-1 rounded-lg hover:bg-white/5">
                <X className="w-3.5 h-3.5 text-zinc-500" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
