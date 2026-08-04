import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/contexts/ToastContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ResultSkeleton } from "@/components/ui/Skeleton";

const HomePage = lazy(() => import("@/pages/HomePage"));
const ResultsPage = lazy(() => import("@/pages/ResultsPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function PageLoader() {
  return (
    <div className="py-12">
      <ResultSkeleton />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Suspense fallback={<PageLoader />}><HomePage /></Suspense>} />
              <Route path="results" element={<Suspense fallback={<PageLoader />}><ResultsPage /></Suspense>} />
              <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
              <Route path="profile" element={<Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
