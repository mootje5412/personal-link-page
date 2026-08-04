"use client";

export function CyberBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute inset-0 cyber-bg" />
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/[0.06]" />
    </div>
  );
}
