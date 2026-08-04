"use client";

import { type ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { InstallBanner } from "./InstallBanner";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-bg min-h-screen">
      <ServiceWorkerRegister />
      <InstallBanner />
      <main className="mx-auto max-w-lg px-4 pt-[calc(var(--safe-top)+1rem)] pb-28">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
