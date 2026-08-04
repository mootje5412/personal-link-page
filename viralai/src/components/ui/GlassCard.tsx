import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glow?: boolean;
  padding?: "sm" | "md" | "lg";
}

export function GlassCard({
  children,
  className,
  glow = false,
  padding = "md",
  ...props
}: GlassCardProps) {
  const paddings = {
    sm: "p-3",
    md: "p-4",
    lg: "p-5",
  };

  return (
    <div
      className={cn(
        "glass rounded-3xl transition-all duration-300",
        glow && "gradient-border pulse-glow",
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
