import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const variants = {
      primary:
        "bg-gradient-to-r from-accent-purple via-accent-pink to-accent-orange text-white shadow-lg shadow-accent-purple/25 hover:shadow-accent-pink/30 active:scale-[0.97]",
      secondary: "glass text-foreground hover:bg-surface-hover active:scale-[0.97]",
      ghost: "text-zinc-400 hover:text-foreground hover:bg-white/5 active:scale-[0.97]",
      outline:
        "border border-white/10 text-foreground hover:bg-white/5 active:scale-[0.97]",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded-xl",
      md: "px-5 py-2.5 text-sm font-medium rounded-2xl",
      lg: "px-6 py-3.5 text-base font-semibold rounded-2xl",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
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
);

Button.displayName = "Button";
export { Button };
