interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
}

const MetricCard = ({ label, value, unit }: MetricCardProps) => (
  <div className="surface-metric flex min-h-[96px] flex-col justify-between gap-1">
    <span className="label-uppercase">{label}</span>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-mono font-medium text-foreground">{value}</span>
      {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
    </div>
  </div>
);

export default MetricCard;
