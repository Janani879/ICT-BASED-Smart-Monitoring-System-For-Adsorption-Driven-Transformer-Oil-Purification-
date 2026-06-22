import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import OilHealthIndexPage from "./pages/dashboard/OilHealthIndexPage.tsx";
import DgaFaultAnalysisPage from "./pages/dashboard/DgaFaultAnalysisPage.tsx";
import PlaceholderTab3 from "./pages/dashboard/PlaceholderTab3.tsx";
import PlaceholderTab4 from "./pages/dashboard/PlaceholderTab4.tsx";

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
            <Route path="/ohi" element={<OilHealthIndexPage />} />
            <Route path="/tab2" element={<DgaFaultAnalysisPage />} />
            <Route path="/tab3" element={<PlaceholderTab3 />} />
            <Route path="/tab4" element={<PlaceholderTab4 />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
