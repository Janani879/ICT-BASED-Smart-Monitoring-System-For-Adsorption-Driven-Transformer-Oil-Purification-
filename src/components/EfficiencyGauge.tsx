interface EfficiencyGaugeProps {
  value: number;
  isApproachingSaturation: boolean;
}

const EfficiencyGauge = ({ value, isApproachingSaturation }: EfficiencyGaugeProps) => {
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (circumference * value) / 100;

  return (
    <div className="surface-card p-6 flex flex-col items-center justify-center text-center h-full">
      <div className="mb-8">
        <span className="label-uppercase block">Gauge Panel</span>
        <h3 className="text-sm font-medium text-foreground mt-2">Removal Efficiency</h3>
      </div>
      <div className="relative flex items-center justify-center">
        <svg className="w-40 h-40 transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-secondary"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-primary transition-all duration-1000"
            style={{ transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-mono font-bold text-foreground">{value}%</span>
          <span className="label-uppercase mt-1">PREDICTED</span>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        {value < 70
          ? "Removal remains below the preferred operating range."
          : "Removal performance is within the desired purification window."}
      </p>
      {isApproachingSaturation && (
        <div className="mt-6 animate-pulse-soft alert-warning text-xs font-medium">
          <svg
            className="w-3.5 h-3.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          Adsorbent Saturation Approaching
        </div>
      )}
    </div>
  );
};

export default EfficiencyGauge;
