"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
}

export function PageHeader({ title, subtitle, backHref }: PageHeaderProps) {
  const haptic = useHaptic();

  return (
    <header className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          onClick={() => haptic("light")}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      )}
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>}
    </header>
  );
}
