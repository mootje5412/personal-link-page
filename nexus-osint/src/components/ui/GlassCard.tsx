import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function GlassCard({
  children,
  className,
  glow,
}: {
  children: ReactNode;
  className?: string;
  glow?: "blue" | "purple";
}) {
  return (
    <div
      className={cn(
        "glass rounded-3xl p-5 transition-all duration-300",
        glow === "blue" && "neon-blue",
        glow === "purple" && "neon-purple",
        className
      )}
    >
      {children}
    </div>
  );
}
