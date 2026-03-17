import { BarChart3, Beaker, Droplets, LineChart as LineChartIcon, Thermometer } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";

const chartTooltipStyle = {
  backgroundColor: "hsl(240 10% 6%)",
  border: "1px solid hsl(240 5% 15%)",
  borderRadius: "8px",
  fontSize: "12px",
};

interface ChartSectionProps {
  isothermData: Array<{ ce: number; qe: number }>;
  timeSeriesData: Array<{
    time: number;
    removal: number;
    capacity: number;
    concentration: number;
    temperature: number;
  }>;
}

type ChartKey =
  | "isotherm"
  | "temperature"
  | "removal"
  | "capacity"
  | "concentration";

const chartItems: Array<{
  key: ChartKey;
  title: string;
  subtitle: string;
  icon: typeof BarChart3;
}> = [
  {
    key: "isotherm",
    title: "Isotherm Curve",
    subtitle: "qe vs Ce adsorption profile",
    icon: Beaker,
  },
  {
    key: "temperature",
    title: "Temperature vs Time",
    subtitle: "Thermal stability trend",
    icon: Thermometer,
  },
  {
    key: "removal",
    title: "Removal % vs Time",
    subtitle: "Purification progress",
    icon: Droplets,
  },
  {
    key: "capacity",
    title: "Capacity vs Time",
    subtitle: "Adsorbent loading pattern",
    icon: LineChartIcon,
  },
  {
    key: "concentration",
    title: "Concentration vs Capacity",
    subtitle: "Final concentration response",
    icon: BarChart3,
  },
];

const ChartSection = ({ isothermData, timeSeriesData }: ChartSectionProps) => {
  const [activeChart, setActiveChart] = useState<ChartKey>("isotherm");

  return (
    <section className="surface-card p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="label-uppercase">Visualization</span>
          <h3 className="mt-2 text-base font-medium text-foreground">
            Process Trends and Adsorption Curves
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the chart navigator to inspect each simulated process relationship in detail.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[260px_minmax(0,1fr)]">
        <div className="chart-nav-panel">
          {chartItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === activeChart;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveChart(item.key)}
                className={`chart-nav-item ${isActive ? "chart-nav-item-active" : ""}`}
              >
                <Icon size={16} className={isActive ? "text-primary" : "text-muted-foreground"} />
                <div className="text-left">
                  <div className="text-sm font-medium text-foreground">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="surface-panel h-[380px] p-5">
            {activeChart === "isotherm" && (
              <>
                <div className="mb-4">
                  <span className="label-uppercase">Primary View</span>
                  <h4 className="mt-2 text-sm font-medium text-foreground">Isotherm Curve - qe vs Ce</h4>
                </div>
                <ResponsiveContainer width="100%" height="82%">
                  <AreaChart data={isothermData}>
                    <defs>
                      <linearGradient id="colorQe" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 15%)" vertical={false} />
                    <XAxis dataKey="ce" stroke="hsl(240 5% 45%)" />
                    <YAxis stroke="hsl(240 5% 45%)" />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Area type="monotone" dataKey="qe" stroke="hsl(217 91% 60%)" fill="url(#colorQe)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </>
            )}

            {activeChart === "temperature" && (
              <>
                <div className="mb-4">
                  <span className="label-uppercase">Primary View</span>
                  <h4 className="mt-2 text-sm font-medium text-foreground">Temperature vs Time</h4>
                </div>
                <ResponsiveContainer width="100%" height="82%">
                  <ComposedChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 15%)" vertical={false} />
                    <XAxis dataKey="time" stroke="hsl(240 5% 45%)" />
                    <YAxis stroke="hsl(240 5% 45%)" />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Area type="monotone" dataKey="temperature" stroke="hsl(0 84% 60%)" fill="hsl(0 84% 60% / 0.12)" />
                    <Line type="monotone" dataKey="temperature" stroke="hsl(0 84% 60%)" strokeWidth={3} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </>
            )}

            {activeChart === "removal" && (
              <>
                <div className="mb-4">
                  <span className="label-uppercase">Primary View</span>
                  <h4 className="mt-2 text-sm font-medium text-foreground">Removal Percentage vs Time</h4>
                </div>
                <ResponsiveContainer width="100%" height="82%">
                  <AreaChart data={timeSeriesData}>
                    <defs>
                      <linearGradient id="colorRemoval" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142 70% 45%)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(142 70% 45%)" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 15%)" vertical={false} />
                    <XAxis dataKey="time" stroke="hsl(240 5% 45%)" />
                    <YAxis stroke="hsl(240 5% 45%)" />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Area type="monotone" dataKey="removal" stroke="hsl(142 70% 45%)" fill="url(#colorRemoval)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </>
            )}

            {activeChart === "capacity" && (
              <>
                <div className="mb-4">
                  <span className="label-uppercase">Primary View</span>
                  <h4 className="mt-2 text-sm font-medium text-foreground">Adsorption Capacity vs Time</h4>
                </div>
                <ResponsiveContainer width="100%" height="82%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 15%)" vertical={false} />
                    <XAxis dataKey="time" stroke="hsl(240 5% 45%)" />
                    <YAxis stroke="hsl(240 5% 45%)" />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line type="monotone" dataKey="capacity" stroke="hsl(262 83% 58%)" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}

            {activeChart === "concentration" && (
              <>
                <div className="mb-4">
                  <span className="label-uppercase">Primary View</span>
                  <h4 className="mt-2 text-sm font-medium text-foreground">Final Concentration vs Adsorption Capacity</h4>
                </div>
                <ResponsiveContainer width="100%" height="82%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 15%)" />
                    <XAxis
                      type="number"
                      dataKey="capacity"
                      name="Capacity"
                      stroke="hsl(240 5% 45%)"
                    />
                    <YAxis
                      type="number"
                      dataKey="concentration"
                      name="Concentration"
                      stroke="hsl(240 5% 45%)"
                    />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={chartTooltipStyle} />
                    <Scatter data={timeSeriesData} fill="hsl(38 92% 50%)" />
                  </ScatterChart>
                </ResponsiveContainer>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="surface-panel h-[180px] p-4">
              <span className="label-uppercase mb-2 block">Temperature</span>
              <ResponsiveContainer width="100%" height="78%">
                <LineChart data={timeSeriesData}>
                  <Line type="monotone" dataKey="temperature" stroke="hsl(0 84% 60%)" strokeWidth={2.5} dot={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="surface-panel h-[180px] p-4">
              <span className="label-uppercase mb-2 block">Removal</span>
              <ResponsiveContainer width="100%" height="78%">
                <AreaChart data={timeSeriesData}>
                  <Area type="monotone" dataKey="removal" stroke="hsl(142 70% 45%)" fill="hsl(142 70% 45% / 0.16)" strokeWidth={2.5} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="surface-panel h-[180px] p-4">
              <span className="label-uppercase mb-2 block">Capacity</span>
              <ResponsiveContainer width="100%" height="78%">
                <LineChart data={timeSeriesData}>
                  <Line type="monotone" dataKey="capacity" stroke="hsl(262 83% 58%)" strokeWidth={2.5} dot={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="surface-panel h-[180px] p-4">
              <span className="label-uppercase mb-2 block">Concentration</span>
              <ResponsiveContainer width="100%" height="78%">
                <LineChart data={timeSeriesData}>
                  <Line type="monotone" dataKey="concentration" stroke="hsl(38 92% 50%)" strokeWidth={2.5} dot={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChartSection;
