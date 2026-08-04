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
        <div className="glass-strong rounded-[28px] px-2 py-2 shadow-2xl shadow-black/50">
          <div className="flex justify-around">
            {nav.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl min-w-[56px] transition-colors",
                    active ? "text-white" : "text-zinc-600"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-bg"
                      className="absolute inset-0 bg-blue-500/15 rounded-2xl border border-blue-500/20"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className="w-5 h-5 relative z-10" strokeWidth={active ? 2.5 : 2} />
                  <span className="text-[10px] font-medium relative z-10">{item.label}</span>
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
  const sizes = { sm: "w-8 h-8 text-sm", md: "w-11 h-11 text-lg", lg: "w-16 h-16 text-2xl" };
  return (
    <div className={cn("rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 neon-blue", sizes[size])}>
      <Shield className={size === "lg" ? "w-8 h-8" : size === "md" ? "w-5 h-5" : "w-4 h-4"} />
    </div>
  );
}
