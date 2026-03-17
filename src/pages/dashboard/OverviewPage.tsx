import { Activity, FlaskConical, TimerReset } from "lucide-react";
import { useDashboardContext } from "@/components/dashboard/DashboardShell";

const OverviewPage = () => {
  const { results, simulatedInputs } = useDashboardContext();

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="surface-card p-6">
          <span className="label-uppercase mb-3 block">Current Inputs</span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="surface-panel p-4">
              <span className="label-uppercase block mb-2">Temperature</span>
              <p className="font-mono text-xl text-foreground">{simulatedInputs.temp} deg C</p>
            </div>
            <div className="surface-panel p-4">
              <span className="label-uppercase block mb-2">Time</span>
              <p className="font-mono text-xl text-foreground">{simulatedInputs.time} min</p>
            </div>
            <div className="surface-panel p-4">
              <span className="label-uppercase block mb-2">Mass</span>
              <p className="font-mono text-xl text-foreground">{simulatedInputs.mass} g</p>
            </div>
          </div>
        </div>

        <div className="surface-card p-6">
          <span className="label-uppercase mb-3 block">Process Summary</span>
          <div className="space-y-3 text-sm text-foreground">
            <p>
              The system predicts a final concentration of{" "}
              <span className="font-mono">{results.Ce} ppm</span> with adsorption capacity of{" "}
              <span className="font-mono">{results.qe} mg/g</span>.
            </p>
            <p>
              Estimated equilibrium time is{" "}
              <span className="font-mono">{results.eqTime} min</span>, while removal efficiency is{" "}
              <span className="font-mono">{results.removalEfficiency}%</span>.
            </p>
            <p>
              Model accuracy is currently simulated at{" "}
              <span className="font-mono">{results.accuracy}%</span>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OverviewPage;
