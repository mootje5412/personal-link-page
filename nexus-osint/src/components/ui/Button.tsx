import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-white text-black hover:bg-zinc-200 active:scale-[0.98]",
    ghost: "text-zinc-500 hover:text-white hover:bg-white/5 active:scale-[0.98]",
    outline: "border border-white/15 text-white hover:bg-white/5 active:scale-[0.98]",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2.5 text-sm rounded-xl font-medium",
    lg: "px-6 py-3.5 text-base rounded-xl font-medium",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
