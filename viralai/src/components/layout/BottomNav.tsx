"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Lightbulb, FileText, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptic } from "@/hooks/useHaptic";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/scripts", label: "Scripts", icon: FileText },
  { href: "/analyze", label: "Analyze", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const haptic = useHaptic();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-[var(--safe-bottom)]">
      <div className="mx-auto max-w-lg px-4 pb-2">
        <div className="glass-strong rounded-[28px] px-2 py-2 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-around">
            {tabs.map((tab) => {
              const isActive =
                tab.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(tab.href);
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => haptic("light")}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-colors duration-200 min-w-[56px]",
                    isActive ? "text-white" : "text-zinc-500"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-white/10 rounded-2xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      "w-5 h-5 relative z-10 transition-transform duration-200",
                      isActive && "scale-110"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="text-[10px] font-medium relative z-10">
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
