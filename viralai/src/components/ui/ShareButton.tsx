"use client";

import { Share2 } from "lucide-react";
import { shareContent } from "@/lib/utils";
import { useHaptic } from "@/hooks/useHaptic";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  title: string;
  text: string;
  className?: string;
}

export function ShareButton({ title, text, className }: ShareButtonProps) {
  const haptic = useHaptic();

  const handleShare = async () => {
    haptic("light");
    await shareContent({ title, text });
  };

  return (
    <button
      onClick={handleShare}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium",
        "glass hover:bg-surface-hover transition-all duration-200 active:scale-95",
        className
      )}
    >
      <Share2 className="w-3.5 h-3.5" />
      <span>Share</span>
    </button>
  );
}
