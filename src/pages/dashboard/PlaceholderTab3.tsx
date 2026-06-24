import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Calculator,
  Cpu,
  RefreshCw,
  Thermometer,
  Waves,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import MetricCard from "@/components/MetricCard";

interface SensorPoint {
  id: number;
  time: string;
  elapsed: number;
  temperature: number;
  turbidity: number;
}

type InputField = {
  label: string;
  value: string;
  setter: Dispatch<SetStateAction<string>>;
  unit: string;
};

type SerialBridgeMessage =
  | {
      type: "reading";
      temperature: number;
      turbidity: number;
      raw: string;
      timestamp: number;
    }
  | {
      type: "status" | "error";
      connected: boolean;
      serialPath: string;
      baudRate: number;
      message: string;
    }
  | {
      type: "raw";
      raw: string;
      timestamp: number;
    };

const MAX_POINTS = 60;
const DEFAULT_TAN_AT_TIME = "0.0916";
const K2 = 130.638;
const BRIDGE_URL = "ws://127.0.0.1:8787";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getOilHealthStatus = (efficiency: number) => {
  if (efficiency >= 90) return { label: "Excellent", color: "hsl(142 70% 45%)" };
  if (efficiency >= 75) return { label: "Good", color: "hsl(217 91% 60%)" };
  if (efficiency >= 55) return { label: "Moderate", color: "hsl(38 92% 50%)" };
  if (efficiency >= 35) return { label: "Poor", color: "hsl(24 95% 50%)" };
  return { label: "Critical", color: "hsl(0 84% 60%)" };
};

const PlaceholderTab3 = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [bridgeMessage, setBridgeMessage] = useState("Waiting for local COM3 serial bridge...");
  const [lastLine, setLastLine] = useState("Waiting for ESP32 data...");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [sensorData, setSensorData] = useState<SensorPoint[]>([]);

  const [initialTan, setInitialTan] = useState("0.334");
  const [tanAtTime, setTanAtTime] = useState(DEFAULT_TAN_AT_TIME);
  const [oilVolume, setOilVolume] = useState("0.4");
  const [fullerEarthDosage, setFullerEarthDosage] = useState("40");
  const [temperature, setTemperature] = useState("55");
  const [purificationTime, setPurificationTime] = useState("60");

  const socketRef = useRef<WebSocket | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const pointIdRef = useRef(0);

  const latestPoint = sensorData[sensorData.length - 1];

  const addSensorPoint = useCallback((temperatureValue: number, turbidityValue: number, timestamp = Date.now()) => {
    const now = timestamp;
    if (startedAtRef.current === null) startedAtRef.current = now;

    const elapsed = Math.round((now - startedAtRef.current) / 1000);
    const point: SensorPoint = {
      id: pointIdRef.current,
      time: new Date(now).toLocaleTimeString(),
      elapsed,
      temperature: temperatureValue,
      turbidity: turbidityValue,
    };

    pointIdRef.current += 1;
    setSensorData((prev) => [...prev.slice(-(MAX_POINTS - 1)), point]);
  }, []);

  useEffect(() => {
    setBridgeError(null);
    setBridgeMessage(`Connecting to local bridge at ${BRIDGE_URL}...`);

    const socket = new WebSocket(BRIDGE_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      setBridgeError(null);
      setBridgeMessage("Connected to local serial bridge. Waiting for COM3 readings...");
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data)) as SerialBridgeMessage;

        if (message.type === "reading") {
          setLastLine(message.raw);
          addSensorPoint(message.temperature, message.turbidity, message.timestamp);
          return;
        }

        if (message.type === "raw") {
          setLastLine(message.raw);
          return;
        }

        setBridgeMessage(message.message);
        setIsConnected(message.connected);
        setBridgeError(message.type === "error" ? message.message : null);
      } catch {
        setBridgeError("Received an unreadable message from the serial bridge.");
      }
    };

    socket.onerror = () => {
      setBridgeError("Could not connect to the local serial bridge. Start it with npm.cmd run serial:bridge.");
      setIsConnected(false);
    };

    socket.onclose = () => {
      setIsConnected(false);
      setBridgeMessage("Disconnected from local serial bridge.");
    };

    return () => {
      socket.close();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [addSensorPoint, reconnectAttempt]);

  const calculation = useMemo(() => {
    const c0 = Number(initialTan);
    const tanT = Number(tanAtTime);
    const volume = Number(oilVolume);
    const dosage = Number(fullerEarthDosage);
    const processTemperature = Number(temperature);
    const time = Number(purificationTime);

    const hasValidInputs =
      [c0, tanT, volume, dosage, processTemperature, time].every(Number.isFinite) &&
      c0 > 0 &&
      tanT >= 0 &&
      tanT < c0 &&
      volume > 0 &&
      dosage > 0 &&
      time >= 0;

    if (!hasValidInputs) return null;

    const qe = ((c0 - tanT) * volume) / dosage;
    const qt = (K2 * qe * qe * time) / (1 + K2 * qe * time);
    const finalTan = Math.max(tanT, c0 - (dosage * qt) / volume);
    const purificationEfficiency = clamp(((c0 - finalTan) / c0) * 100, 0, 100);
    const adsorbentUtilization = clamp((qt / qe) * 100, 0, 100);
    const remainingAdsorptionCapacity = clamp(100 - adsorbentUtilization, 0, 100);
    const temperatureFactor = clamp(100 - Math.abs(processTemperature - 55) * 1.25, 0, 100);
    const oilHealthIndex = clamp(
      0.55 * purificationEfficiency + 0.25 * adsorbentUtilization + 0.20 * temperatureFactor,
      0,
      100,
    );

    return {
      qe,
      qt,
      finalTan,
      purificationEfficiency,
      adsorbentUtilization,
      remainingAdsorptionCapacity,
      oilHealthIndex,
      temperatureFactor,
      status: getOilHealthStatus(oilHealthIndex),
    };
  }, [fullerEarthDosage, initialTan, oilVolume, purificationTime, tanAtTime, temperature]);

  const chartTooltipStyle = {
    background: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.75rem",
    color: "hsl(var(--foreground))",
    fontSize: "12px",
  };

  const inputFields: InputField[] = [
    { label: "Initial TAN", value: initialTan, setter: setInitialTan, unit: "mg KOH/g" },
    { label: "TAN at time t", value: tanAtTime, setter: setTanAtTime, unit: "mg KOH/g" },
    { label: "Oil Volume", value: oilVolume, setter: setOilVolume, unit: "L" },
    { label: "Fuller Earth Dosage", value: fullerEarthDosage, setter: setFullerEarthDosage, unit: "g" },
    { label: "Temperature", value: temperature, setter: setTemperature, unit: "deg C" },
    { label: "Purification Time", value: purificationTime, setter: setPurificationTime, unit: "min" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="surface-card p-6 xl:col-span-8">
          <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Cpu size={20} className="text-primary" />
              <div>
                <h2 className="text-base font-semibold text-foreground">ESP32 Real-Time Sensor Stream</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Local backend reads COM3 and streams Temperature/Turbidity into this dashboard
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="status-live">
                <Activity size={16} className={isConnected ? "animate-pulse-soft" : ""} />
                {isConnected ? "Bridge Connected" : "Bridge Offline"}
              </div>
              <button onClick={() => setReconnectAttempt((count) => count + 1)} className="btn-secondary text-xs">
                <RefreshCw size={14} />
                Reconnect
              </button>
            </div>
          </div>

          {bridgeError && (
            <div className="alert-warning mt-4">
              <Activity size={14} className="shrink-0" />
              <span>{bridgeError}</span>
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              label="Latest Temperature"
              value={latestPoint ? latestPoint.temperature.toFixed(2) : "--"}
              unit="deg C"
            />
            <MetricCard
              label="Latest Turbidity"
              value={latestPoint ? latestPoint.turbidity.toFixed(2) : "--"}
              unit="NTU"
            />
            <MetricCard label="Samples Captured" value={sensorData.length} unit="points" />
          </div>

          <div className="mt-5 rounded-xl border border-border bg-background/60 p-3 font-mono text-xs text-muted-foreground">
            <div>{bridgeMessage}</div>
            <div className="mt-1 text-foreground">{lastLine}</div>
          </div>
        </div>

        <div className="surface-card p-6 xl:col-span-4">
          <div className="flex items-center gap-3 border-b border-border pb-5">
            <Calculator size={20} className="text-primary" />
            <div>
              <h2 className="text-base font-semibold text-foreground">Adsorption Model Constants</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Second-order adsorption model from Section 3</p>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-xs text-muted-foreground">
            <div className="surface-panel p-3 font-mono">
              qe = ((TANi - TANt) * V) / m
            </div>
            <div className="surface-panel p-3 font-mono">
              k2 = {K2.toFixed(3)}
            </div>
            <div className="surface-panel p-3 font-mono">
              qt = (k2 * qe^2 * t) / (1 + k2 * qe * t)
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="surface-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <Thermometer size={18} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Temperature vs Time</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensorData} margin={{ top: 10, right: 18, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis
                  dataKey="elapsed"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickFormatter={(value) => `${value}s`}
                />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={42} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value: number) => [`${Number(value).toFixed(2)} deg C`, "Temperature"]}
                  labelFormatter={(value) => `Time: ${value}s`}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="hsl(217 91% 60%)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <Waves size={18} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Turbidity vs Time</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensorData} margin={{ top: 10, right: 18, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis
                  dataKey="elapsed"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickFormatter={(value) => `${value}s`}
                />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={42} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value: number) => [`${Number(value).toFixed(2)} NTU`, "Turbidity"]}
                  labelFormatter={(value) => `Time: ${value}s`}
                />
                <Line
                  type="monotone"
                  dataKey="turbidity"
                  stroke="hsl(142 70% 45%)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="surface-card p-6 xl:col-span-4">
          <div className="flex items-center gap-3 border-b border-border pb-5">
            <Calculator size={20} className="text-primary" />
            <div>
              <h2 className="text-base font-semibold text-foreground">Purification Input Form</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Manual process inputs for adsorption calculations</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {inputFields.map((field) => (
              <label key={field.label} className="panel-block block space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider">{field.label}</span>
                  <span className="text-primary font-bold">{field.unit}</span>
                </div>
                <input
                  type="number"
                  step="0.001"
                  value={field.value}
                  onChange={(event) => field.setter(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-all focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="xl:col-span-8 space-y-6">
          {calculation ? (
            <>
              <div className="surface-card p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="label-uppercase block mb-2">Calculated Output</span>
                    <h3 className="text-lg font-semibold text-foreground">Adsorption and Oil Quality Results</h3>
                  </div>
                  <div
                    className="rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider"
                    style={{
                      color: calculation.status.color,
                      borderColor: `${calculation.status.color}33`,
                      background: `${calculation.status.color}0d`,
                    }}
                  >
                    {calculation.status.label}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <MetricCard label="qe" value={calculation.qe.toFixed(6)} unit="mg/g" />
                <MetricCard label="qt" value={calculation.qt.toFixed(6)} unit="mg/g" />
                <MetricCard label="Final TAN" value={calculation.finalTan.toFixed(4)} unit="mg KOH/g" />
                <MetricCard
                  label="Purification Efficiency"
                  value={calculation.purificationEfficiency.toFixed(2)}
                  unit="%"
                />
                <MetricCard
                  label="Adsorbent Utilization"
                  value={calculation.adsorbentUtilization.toFixed(2)}
                  unit="%"
                />
                <MetricCard
                  label="Remaining Capacity"
                  value={calculation.remainingAdsorptionCapacity.toFixed(2)}
                  unit="%"
                />
              </div>

              <div className="surface-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <span className="label-uppercase block mb-2">Oil Health Index</span>
                    <h3 className="text-sm font-semibold text-foreground">Section 3 derived score</h3>
                  </div>
                  <span className="font-mono text-2xl font-bold text-foreground">
                    {calculation.oilHealthIndex.toFixed(2)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${calculation.oilHealthIndex}%`,
                      background: calculation.status.color,
                    }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 text-xs text-muted-foreground sm:grid-cols-3">
                  <div className="surface-panel p-3 font-mono">Ct = C0 - (m * qt) / V</div>
                  <div className="surface-panel p-3 font-mono">PE = ((C0 - Ct) / C0) * 100</div>
                  <div className="surface-panel p-3 font-mono">RAC = 100 - AU</div>
                </div>
              </div>
            </>
          ) : (
            <div className="surface-card p-12 text-center text-sm text-muted-foreground">
Enter valid values. TAN at time t must be lower than Initial TAN.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaceholderTab3;


