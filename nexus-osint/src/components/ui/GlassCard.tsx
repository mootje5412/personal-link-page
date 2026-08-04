import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function GlassCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass rounded-2xl p-5 transition-colors duration-200", className)}>
      {children}
    </div>
  );
}
