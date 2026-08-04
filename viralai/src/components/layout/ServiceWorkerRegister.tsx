"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    async function setup() {
      if (!("serviceWorker" in navigator)) return;

      try {
        // Purge old Phantom/GeoLoca service workers and caches
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));

        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }

        await navigator.serviceWorker.register("/sw.js?v=3", {
          updateViaCache: "none",
        });
      } catch {
        // Silent fail — app works without SW
      }
    }

    setup();
  }, []);

  return null;
}
