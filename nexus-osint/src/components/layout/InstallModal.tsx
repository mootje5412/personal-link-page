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
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua);
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
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="glass-strong rounded-3xl p-6 w-full max-w-sm neon-blue relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-blue-500/10 to-transparent" />

            <button
              onClick={() => handleDismiss(false)}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/5 z-10"
            >
              <X className="w-4 h-4 text-zinc-500" />
            </button>

            <div className="relative text-center mb-6">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 neon-blue"
              >
                <Smartphone className="w-9 h-9 text-white" />
              </motion.div>
              <h2 className="text-xl font-bold gradient-text">Install Nexus OSINT</h2>
              <p className="text-sm text-zinc-400 mt-1">Add to Home Screen for the native app experience</p>
            </div>

            <ol className="space-y-3 mb-6 relative">
              {steps.map((step, i) => (
                <motion.li
                  key={step.num}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <span className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-400 shrink-0">
                    {step.num}
                  </span>
                  <span className="text-sm text-zinc-300 flex items-center gap-2">
                    {step.text}
                    {step.icon && <step.icon className="w-4 h-4 text-blue-400 inline shrink-0" />}
                  </span>
                </motion.li>
              ))}
            </ol>

            {/* iPhone mockup hint */}
            <div className="glass rounded-2xl p-3 mb-6 flex items-center justify-center gap-2">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center"
              >
                <Share className="w-4 h-4 text-blue-400" />
              </motion.div>
              <div className="h-px flex-1 bg-gradient-to-r from-blue-500/50 to-purple-500/50" />
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xs text-zinc-500 px-2 py-1 rounded-lg border border-white/10"
              >
                Add to Home Screen
              </motion.div>
            </div>

            <div className="flex flex-col gap-2">
              <Button className="w-full" onClick={() => handleDismiss(false)}>
                Continue
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => handleDismiss(false)}>
                  Skip
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => handleDismiss(true)}>
                  Don&apos;t show again
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
