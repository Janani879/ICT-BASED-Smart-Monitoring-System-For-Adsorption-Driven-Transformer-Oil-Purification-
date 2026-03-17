import { useCallback, useMemo, useState } from "react";
import { Activity, Download, FlaskConical, TimerReset } from "lucide-react";
import { motion } from "framer-motion";
import MetricCard from "@/components/MetricCard";
import EfficiencyGauge from "@/components/EfficiencyGauge";
import ControlPanel from "@/components/ControlPanel";
import ChartSection from "@/components/ChartSection";
import NavigationSidebar from "@/components/NavigationSidebar";
import {
  calculateAdsorption,
  generateIsothermData,
  generateTimeSeriesData,
  exportCSV,
} from "@/lib/simulation";

type SectionId = "overview" | "controls" | "metrics" | "visuals";

const Dashboard = () => {
  const [inputs, setInputs] = useState({ temp: 45, time: 60, mass: 15 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [simKey, setSimKey] = useState(0);
  const [activeSection, setActiveSection] = useState<SectionId>("overview");

  const results = useMemo(
    () => calculateAdsorption(inputs.temp, inputs.time, inputs.mass),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputs.temp, inputs.time, inputs.mass, simKey]
  );

  const isothermData = useMemo(() => generateIsothermData(results.model), [results.model]);
  const timeSeriesData = useMemo(
    () => generateTimeSeriesData(inputs.time, inputs.temp, inputs.mass),
    [inputs.time, inputs.temp, inputs.mass]
  );

  const modelInterpretation = `${results.interpretation}. ${results.recommendation}`;

  const handleSimulate = useCallback(() => {
    setIsProcessing(true);
    setTimeout(() => {
      setSimKey((k) => k + 1);
      setIsProcessing(false);
    }, 600);
  }, []);

  const handleNavigate = useCallback((section: SectionId) => {
    setActiveSection(section);
    const element = document.getElementById(section);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 text-foreground selection:bg-primary/30 lg:p-6">
      <header className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            ICT-Smart Monitoring System
          </h1>
          <p className="text-sm text-muted-foreground">
            Adsorption-Driven Transformer Oil Purification Control Dashboard
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportCSV(results, inputs)} className="btn-secondary">
            <Download size={16} /> Export CSV
          </button>
          <div className="status-live">
            <Activity size={16} className="animate-pulse-soft" /> System Live
          </div>
        </div>
      </header>

      <section id="overview" className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="surface-card flex items-start gap-3 p-4">
          <FlaskConical size={18} className="mt-0.5 text-primary" />
          <div>
            <span className="label-uppercase mb-1 block">Best Fit Isotherm</span>
            <p className="text-sm text-foreground">{results.model}</p>
          </div>
        </div>
        <div className="surface-card flex items-start gap-3 p-4">
          <Activity size={18} className="mt-0.5 text-accent" />
          <div>
            <span className="label-uppercase mb-1 block">Interpretation</span>
            <p className="text-sm text-foreground">{results.interpretation}</p>
          </div>
        </div>
        <div className="surface-card flex items-start gap-3 p-4">
          <TimerReset size={18} className="mt-0.5 text-warning" />
          <div>
            <span className="label-uppercase mb-1 block">Recommendation</span>
            <p className="text-sm text-foreground">{results.recommendation}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-6">
        <NavigationSidebar activeSection={activeSection} onNavigate={handleNavigate} />

        <div id="controls" className="col-span-12 xl:col-span-3">
        <ControlPanel
          inputs={inputs}
          onInputChange={setInputs}
          onSimulate={handleSimulate}
          modelInterpretation={modelInterpretation}
          isHighEfficiency={results.isHighEfficiency}
          isProcessing={isProcessing}
        />
        </div>

        <main className="col-span-12 space-y-6 xl:col-span-7">
          <motion.div
            id="metrics"
            key={simKey}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          >
            <MetricCard label="Best Fit Model" value={results.model} unit={`(${results.accuracy}%)`} />
            <MetricCard label="Adsorption Capacity" value={results.qe} unit="mg/g" />
            <MetricCard label="Final Concentration" value={results.Ce} unit="ppm" />
            <MetricCard label="Equilibrium Time" value={results.eqTime} unit="min" />
            <MetricCard label="Removal Efficiency" value={`${results.removalEfficiency}`} unit="%" />
            <MetricCard label="Predicted Final Removal" value={`${results.predictedFinalRemoval}`} unit="%" />
            <MetricCard label="Model Accuracy" value={`${results.accuracy}`} unit="%" />
          </motion.div>

          <div id="visuals" className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-12">
              <ChartSection
                isothermData={isothermData}
                timeSeriesData={timeSeriesData}
              />
            </div>
          </div>
        </main>

        <aside className="col-span-12 xl:col-span-2">
          <div className="grid grid-cols-1 gap-6 xl:sticky xl:top-6">
            <EfficiencyGauge
              value={results.removalEfficiency}
              isApproachingSaturation={results.isApproachingSaturation}
            />
            <div className="surface-card p-5">
              <span className="label-uppercase mb-3 block">Process Advisory</span>
              <div className="space-y-3 text-sm text-foreground">
                <p>{results.recommendation}</p>
                <p>
                  Final concentration is projected at{" "}
                  <span className="font-mono">{results.Ce} ppm</span> with
                  equilibrium around{" "}
                  <span className="font-mono">{results.eqTime} min</span>.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
