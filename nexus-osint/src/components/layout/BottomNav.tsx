"use client";

import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, LayoutDashboard, Settings, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", icon: Home, label: "Search" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-[var(--safe-bottom)]">
      <div className="mx-auto max-w-lg px-4 pb-3">
        <div className="glass-strong rounded-2xl px-1 py-1">
          <div className="flex justify-around">
            {nav.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[56px] transition-colors",
                    active ? "text-white" : "text-zinc-600"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-bg"
                      className="absolute inset-0 bg-white/10 rounded-xl"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <Icon className="w-[18px] h-[18px] relative z-10" strokeWidth={active ? 2 : 1.5} />
                  <span className="text-[9px] font-medium relative z-10 tracking-wide">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };
  return (
    <div className={cn("rounded-xl border border-white/15 flex items-center justify-center bg-white/[0.03]", sizes[size])}>
      <Shield className={cn("text-white", iconSizes[size])} strokeWidth={1.5} />
    </div>
  );
}
