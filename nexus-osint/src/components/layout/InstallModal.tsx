"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share, Plus, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { dismissInstall, isInstallDismissed } from "@/lib/storage";

const steps = [
  { num: 1, text: "Tap the Share button in Safari", icon: Share },
  { num: 2, text: "Scroll down the menu", icon: null },
  { num: 3, text: 'Tap "Add to Home Screen"', icon: Plus },
  { num: 4, text: "Press Add", icon: null },
];

export function InstallModal() {
  const [open, setOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as Navigator & { standalone?: boolean }).standalone;
    setIsIOS(ios);
    if (ios && !standalone && !isInstallDismissed()) {
      setTimeout(() => setOpen(true), 1500);
    }
  }, []);

  const handleDismiss = (permanent: boolean) => {
    if (permanent) dismissInstall();
    setOpen(false);
  };

  if (!isIOS) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="glass-strong rounded-2xl p-6 w-full max-w-sm relative"
          >
            <button
              onClick={() => handleDismiss(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5"
            >
              <X className="w-4 h-4 text-zinc-600" strokeWidth={1.5} />
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto w-14 h-14 rounded-xl border border-white/15 flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-medium tracking-tight">Install Nexus OSINT</h2>
              <p className="text-sm text-zinc-500 mt-1 font-light">Add to Home Screen</p>
            </div>

            <ol className="space-y-3 mb-6">
              {steps.map((step, i) => (
                <motion.li
                  key={step.num}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <span className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-xs text-zinc-500 shrink-0 tabular-nums">
                    {step.num}
                  </span>
                  <span className="text-sm text-zinc-400 font-light flex items-center gap-2">
                    {step.text}
                    {step.icon && <step.icon className="w-3.5 h-3.5 text-white inline shrink-0" strokeWidth={1.5} />}
                  </span>
                </motion.li>
              ))}
            </ol>

            <div className="flex flex-col gap-2">
              <Button className="w-full" onClick={() => handleDismiss(false)}>Continue</Button>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => handleDismiss(false)}>Skip</Button>
                <Button variant="outline" className="flex-1" onClick={() => handleDismiss(true)}>Don&apos;t show again</Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
