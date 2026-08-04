"use client";

import { useToast } from "@/contexts/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

const icons = { info: Info, success: CheckCircle, error: AlertCircle, warning: AlertCircle };

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
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="pointer-events-auto glass-strong rounded-xl px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-md border border-white/10"
            >
              <Icon className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={1.5} />
              <p className="text-sm text-zinc-300 font-light flex-1">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="p-1 rounded hover:bg-white/5">
                <X className="w-3.5 h-3.5 text-zinc-600" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
