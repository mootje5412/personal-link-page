"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, Plus } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { dismissInstallBanner, isInstallBannerDismissed } from "@/lib/storage";

export function InstallBanner() {
  const { isIOS, isStandalone, promptInstall } = useInstallPrompt();
  const [visible, setVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (!isStandalone && !isInstallBannerDismissed()) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isStandalone]);

  if (isStandalone || !visible) return null;

  const handleDismiss = () => {
    dismissInstallBanner();
    setVisible(false);
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowInstructions(true);
    } else {
      await promptInstall();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 inset-x-0 z-[60] pt-[var(--safe-top)]"
      >
        <div className="mx-auto max-w-lg px-4 pt-2">
          <div className="glass-strong rounded-2xl p-4 shadow-xl shadow-black/30">
            {!showInstructions ? (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold">V</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Install ViralAI</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {isIOS
                      ? "Add to Home Screen for the full app experience"
                      : "Install for offline access and native feel"}
                  </p>
                  <button
                    onClick={handleInstall}
                    className="mt-2 text-xs font-semibold text-accent-purple hover:text-accent-pink transition-colors"
                  >
                    {isIOS ? "Show me how →" : "Install now →"}
                  </button>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold">Add to Home Screen</p>
                  <button
                    onClick={() => setShowInstructions(false)}
                    className="p-1 rounded-lg hover:bg-white/10"
                  >
                    <X className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>
                <ol className="space-y-3 text-xs text-zinc-400">
                  <li className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 font-semibold text-white">
                      1
                    </span>
                    <span className="flex items-center gap-1.5">
                      Tap the <Share className="w-4 h-4 text-blue-400 inline" /> Share button in Safari
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 font-semibold text-white">
                      2
                    </span>
                    <span className="flex items-center gap-1.5">
                      Scroll and tap <Plus className="w-4 h-4 inline" /> Add to Home Screen
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 font-semibold text-white">
                      3
                    </span>
                    <span>Tap Add — enjoy the native app experience!</span>
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
