import { AlertTriangle, Database, RefreshCw, Settings2 } from "lucide-react";

interface ControlPanelProps {
  inputs: { temp: number; time: number; mass: number };
  onInputChange: (inputs: { temp: number; time: number; mass: number }) => void;
  onSimulate: () => void;
  modelInterpretation: string;
  isHighEfficiency: boolean;
  isProcessing: boolean;
}

const ControlPanel = ({
  inputs,
  onInputChange,
  onSimulate,
  modelInterpretation,
  isHighEfficiency,
  isProcessing,
}: ControlPanelProps) => {
  return (
    <aside className="col-span-12 lg:col-span-3 space-y-6">
      <div className="surface-card p-6 space-y-6">
        <div className="flex items-center gap-2 text-foreground font-medium">
          <Settings2 size={18} className="text-primary" />
          Control Parameters
        </div>

        <div className="panel-block space-y-4">
          <div className="flex justify-between text-xs font-mono">
            <label className="text-muted-foreground">TEMPERATURE</label>
            <span className="text-primary">{inputs.temp} deg C</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            value={inputs.temp}
            onChange={(e) => onInputChange({ ...inputs, temp: parseInt(e.target.value) })}
            className="input-range"
          />
        </div>

        <div className="panel-block space-y-4">
          <div className="flex justify-between text-xs font-mono">
            <label className="text-muted-foreground">PURIFICATION TIME</label>
            <span className="text-primary">{inputs.time} MIN</span>
          </div>
          <input
            type="range"
            min="10"
            max="120"
            value={inputs.time}
            onChange={(e) => onInputChange({ ...inputs, time: parseInt(e.target.value) })}
            className="input-range"
          />
        </div>

        <div className="panel-block space-y-4">
          <label className="text-xs font-mono block text-muted-foreground uppercase">
            Adsorbent Mass (g)
          </label>
          <div className="relative">
            <Database className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
            <input
              type="number"
              min="1"
              value={inputs.mass}
              onChange={(e) =>
                onInputChange({ ...inputs, mass: Math.max(1, parseFloat(e.target.value) || 1) })
              }
              className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all font-mono"
            />
          </div>
        </div>

        <button
          onClick={onSimulate}
          disabled={isProcessing}
          className="btn-simulate disabled:opacity-50"
        >
          <RefreshCw size={16} className={isProcessing ? "animate-spin" : ""} />
          {isProcessing ? "Processing..." : "Run Simulation"}
        </button>
      </div>

      <div className="surface-card p-4">
        <h4 className="label-uppercase mb-3">Model Interpretation</h4>
        <p className="text-sm text-foreground leading-relaxed">{modelInterpretation}</p>
        {!isHighEfficiency && (
          <div className="mt-4 alert-warning">
            <AlertTriangle size={14} className="shrink-0" />
            <span>Recommendation: Increase adsorbent mass or time for &gt;70% efficiency.</span>
          </div>
        )}
        {isHighEfficiency && (
          <div
            className="mt-4 flex gap-2 text-xs p-2 rounded border text-accent"
            style={{
              background: "hsl(142 70% 45% / 0.05)",
              borderColor: "hsl(142 70% 45% / 0.2)",
            }}
          >
            <span>Efficient adsorption detected. System performing within optimal range.</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default ControlPanel;
