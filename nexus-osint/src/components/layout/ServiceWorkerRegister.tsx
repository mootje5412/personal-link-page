"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    async function setup() {
      if (!("serviceWorker" in navigator)) return;
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) {
          if (!r.active?.scriptURL.includes("nexus")) await r.unregister();
        }
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.filter((k) => !k.startsWith("nexus")).map((k) => caches.delete(k)));
        }
        await navigator.serviceWorker.register("/sw.js?v=1", { updateViaCache: "none" });
      } catch { /* ok */ }
    }
    setup();
  }, []);
  return null;
}
