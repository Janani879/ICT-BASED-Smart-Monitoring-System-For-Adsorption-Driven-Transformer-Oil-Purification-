import { Activity, AlertTriangle, CheckCircle2, ClipboardList, Gauge, LineChart, ShieldCheck, Waves } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import { getSampleExplanation } from "@/lib/dga";

const summarySample = {
  sampleNum: 1,
  h2: 120,
  ch4: 80,
  c2h6: 35,
  c2h4: 160,
  c2h2: 18,
  r1: 0.667,
  r2: 0.438,
  r3: 4.571,
  r4: 0.113,
  rogersFault: "High Energy Discharge",
  i1: 0.113,
  i2: 0.667,
  i3: 4.571,
  iecFault: "High Energy Discharge",
  sumDuval: 258,
  pctCh4: 31.0,
  pctC2h4: 62.0,
  pctC2h2: 7.0,
  duvalZone: "T3",
  chartX: 22.5,
  chartY: 26.8,
};

const ohiSummary = {
  tan: 0.15,
  viscosity: 2.5,
  transmission: 85,
  score: 76.25,
  status: "Good",
};

const liveSummary = {
  temperature: 28.56,
  turbidity: 3716,
  samples: 1,
  bridge: "Connected",
};

const purificationSummary = {
  qe: 0.002424,
  qt: 0.002303,
  finalTan: 0.1037,
  efficiency: 68.95,
  utilization: 95.0,
  remainingCapacity: 5.0,
};

const getSystemDecision = () => {
  if (summarySample.duvalZone === "D2" || summarySample.rogersFault.includes("High Energy")) {
    return {
      label: "High Attention Required",
      tone: "text-destructive",
      icon: AlertTriangle,
      action: "Run confirmatory DGA testing and schedule electrical inspection before extended operation.",
    };
  }

  if (ohiSummary.score >= 70 && purificationSummary.efficiency >= 60) {
    return {
      label: "Operational With Monitoring",
      tone: "text-primary",
      icon: ShieldCheck,
      action: "Oil quality is acceptable, but continue DGA trend monitoring and purification tracking.",
    };
  }

  return {
    label: "Monitor Closely",
    tone: "text-warning",
    icon: Activity,
    action: "Repeat oil tests and compare sensor trends against the next purification cycle.",
  };
};

const PlaceholderTab4 = () => {
  const explanation = getSampleExplanation(summarySample);
  const decision = getSystemDecision();
  const DecisionIcon = decision.icon;

  return (
    <div className="space-y-6">
      <div className="surface-card p-6">
        <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList size={22} className="text-primary" />
            <div>
              <h2 className="text-base font-semibold text-foreground">Overall System Summary</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Consolidated view of oil health, DGA fault diagnosis, live sensor monitoring, and adsorption purification results.
              </p>
            </div>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-2 text-xs font-bold uppercase tracking-wider ${decision.tone}`}>
            <DecisionIcon size={16} />
            {decision.label}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Oil Health Index" value={ohiSummary.score.toFixed(2)} unit={ohiSummary.status} />
          <MetricCard label="DGA Fault Signal" value={summarySample.duvalZone} unit="Duval zone" />
          <MetricCard label="Purification Efficiency" value={purificationSummary.efficiency.toFixed(2)} unit="%" />
          <MetricCard label="Live Samples" value={liveSummary.samples} unit="points" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="surface-card p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <Gauge size={20} className="text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Oil Health Summary</h3>
              <p className="text-xs text-muted-foreground">Derived from TAN, viscosity, and optical transmission inputs.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="surface-panel p-3 text-xs"><span className="label-uppercase block mb-1">TAN</span><b>{ohiSummary.tan}</b></div>
            <div className="surface-panel p-3 text-xs"><span className="label-uppercase block mb-1">Viscosity</span><b>{ohiSummary.viscosity}</b></div>
            <div className="surface-panel p-3 text-xs"><span className="label-uppercase block mb-1">Transmission</span><b>{ohiSummary.transmission}%</b></div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            The oil health score is currently in the <b className="text-foreground">{ohiSummary.status}</b> band, meaning the oil is usable but should remain under routine quality tracking.
          </p>
        </div>

        <div className="surface-card p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <AlertTriangle size={20} className="text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">DGA Fault Summary</h3>
              <p className="text-xs text-muted-foreground">Combined interpretation from Rogers, IEC, and Duval methods.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="surface-panel p-3 text-xs"><span className="label-uppercase block mb-1">Rogers</span><b>{summarySample.rogersFault}</b></div>
            <div className="surface-panel p-3 text-xs"><span className="label-uppercase block mb-1">IEC</span><b>{summarySample.iecFault}</b></div>
            <div className="surface-panel p-3 text-xs"><span className="label-uppercase block mb-1">Duval</span><b>{summarySample.duvalZone}</b></div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{explanation.overall.expert}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="surface-card p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <Waves size={20} className="text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Live Monitoring Summary</h3>
              <p className="text-xs text-muted-foreground">Latest ESP32 bridge readings from the monitoring tab.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="surface-panel p-3 text-xs"><span className="label-uppercase block mb-1">Bridge</span><b>{liveSummary.bridge}</b></div>
            <div className="surface-panel p-3 text-xs"><span className="label-uppercase block mb-1">Samples</span><b>{liveSummary.samples}</b></div>
            <div className="surface-panel p-3 text-xs"><span className="label-uppercase block mb-1">Temperature</span><b>{liveSummary.temperature.toFixed(2)} deg C</b></div>
            <div className="surface-panel p-3 text-xs"><span className="label-uppercase block mb-1">Turbidity</span><b>{liveSummary.turbidity.toFixed(2)} NTU</b></div>
          </div>
        </div>

        <div className="surface-card p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <LineChart size={20} className="text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Adsorption Purification Summary</h3>
              <p className="text-xs text-muted-foreground">Second-order adsorption model results from live monitoring tab.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="surface-panel p-3 text-xs"><span className="label-uppercase block mb-1">qe</span><b>{purificationSummary.qe.toFixed(6)} mg/g</b></div>
            <div className="surface-panel p-3 text-xs"><span className="label-uppercase block mb-1">qt</span><b>{purificationSummary.qt.toFixed(6)} mg/g</b></div>
            <div className="surface-panel p-3 text-xs"><span className="label-uppercase block mb-1">Final TAN</span><b>{purificationSummary.finalTan.toFixed(4)}</b></div>
            <div className="surface-panel p-3 text-xs"><span className="label-uppercase block mb-1">Capacity Left</span><b>{purificationSummary.remainingCapacity.toFixed(2)}%</b></div>
          </div>
        </div>
      </div>

      <div className="surface-card p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={20} className="mt-0.5 text-primary" />
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Final Recommendation</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{decision.action}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{explanation.recommendations.expert}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderTab4;
