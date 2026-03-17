import { useCallback, useMemo, useState } from "react";
import { Activity, Download } from "lucide-react";
import { Outlet } from "react-router-dom";
import NavigationSidebar from "@/components/NavigationSidebar";
import {
  calculateAdsorption,
  exportCSV,
  generateIsothermData,
  generateTimeSeriesData,
} from "@/lib/simulation";

export type DashboardInputs = { temp: number; time: number; mass: number };

export type DashboardContextValue = {
  draftInputs: DashboardInputs;
  setDraftInputs: React.Dispatch<React.SetStateAction<DashboardInputs>>;
  simulatedInputs: DashboardInputs;
  isProcessing: boolean;
  handleSimulate: () => void;
  results: ReturnType<typeof calculateAdsorption>;
  isothermData: ReturnType<typeof generateIsothermData>;
  timeSeriesData: ReturnType<typeof generateTimeSeriesData>;
  modelInterpretation: string;
  pendingModel: "Langmuir" | "Freundlich";
  pendingInterpretation: string;
};

const DashboardLayout = () => {
  const [draftInputs, setDraftInputs] = useState<DashboardInputs>({ temp: 45, time: 60, mass: 15 });
  const [simulatedInputs, setSimulatedInputs] = useState<DashboardInputs>({
    temp: 45,
    time: 60,
    mass: 15,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const results = useMemo(
    () => calculateAdsorption(simulatedInputs.temp, simulatedInputs.time, simulatedInputs.mass),
    [simulatedInputs.mass, simulatedInputs.temp, simulatedInputs.time]
  );

  const isothermData = useMemo(() => generateIsothermData(results.model), [results.model]);
  const timeSeriesData = useMemo(
    () => generateTimeSeriesData(simulatedInputs.time, simulatedInputs.temp, simulatedInputs.mass),
    [simulatedInputs.mass, simulatedInputs.temp, simulatedInputs.time]
  );

  const modelInterpretation = `${results.interpretation}. ${results.recommendation}`;
  const pendingModel = draftInputs.temp > 50 ? "Freundlich" : "Langmuir";
  const pendingInterpretation =
    pendingModel === "Freundlich"
      ? "Multilayer adsorption on heterogeneous surface"
      : "Monolayer adsorption on homogeneous surface";

  const handleSimulate = useCallback(() => {
    setIsProcessing(true);
    setTimeout(() => {
      setSimulatedInputs(draftInputs);
      setIsProcessing(false);
    }, 600);
  }, [draftInputs]);

  const contextValue: DashboardContextValue = {
    draftInputs,
    setDraftInputs,
    simulatedInputs,
    isProcessing,
    handleSimulate,
    results,
    isothermData,
    timeSeriesData,
    modelInterpretation,
    pendingModel,
    pendingInterpretation,
  };

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
          <button onClick={() => exportCSV(results, simulatedInputs)} className="btn-secondary">
            <Download size={16} /> Export CSV
          </button>
          <div className="status-live">
            <Activity size={16} className="animate-pulse-soft" /> System Live
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <NavigationSidebar />
        <main className="col-span-12 xl:col-span-10">
          <Outlet context={contextValue} />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
