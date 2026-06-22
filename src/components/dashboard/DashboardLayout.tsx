import { Activity } from "lucide-react";
import { Outlet } from "react-router-dom";
import NavigationSidebar from "@/components/NavigationSidebar";

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-background p-4 text-foreground selection:bg-primary/30 lg:p-6">
      <header className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="header-ict-logo" aria-hidden="true">
            <div className="header-ict-ring header-ict-ring-one" />
            <div className="header-ict-ring header-ict-ring-two" />
            <div className="header-ict-core">ICT</div>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            ICT-Smart Monitoring System
            <p className="text-sm font-normal text-muted-foreground">
              Adsorption-Driven Transformer Oil Purification Control Dashboard
            </p>
          </h1>
        </div>
        <div className="flex gap-3">
          <div className="status-live">
            <Activity size={16} className="animate-pulse-soft" /> System Live
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <NavigationSidebar />
        <main className="col-span-12 xl:col-span-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
