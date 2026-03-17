import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ControlsPage from "./pages/dashboard/ControlsPage.tsx";
import Index from "./pages/Index.tsx";
import MetricsPage from "./pages/dashboard/MetricsPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import OverviewPage from "./pages/dashboard/OverviewPage.tsx";
import VisualsPage from "./pages/dashboard/VisualsPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route element={<DashboardLayout />}>
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/controls" element={<ControlsPage />} />
            <Route path="/metrics" element={<MetricsPage />} />
            <Route path="/visuals" element={<VisualsPage />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
