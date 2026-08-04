import { Outlet } from "react-router-dom";
import { CyberBackground } from "./CyberBackground";
import { BottomNav } from "./BottomNav";
import { InstallModal } from "./InstallModal";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";

export function AppLayout() {
  return (
    <div className="min-h-dvh relative">
      <CyberBackground />
      <ServiceWorkerRegister />
      <InstallModal />
      <ToastContainer />
      <main className="mx-auto max-w-lg px-4 pt-[calc(var(--safe-top)+1rem)] pb-28">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
