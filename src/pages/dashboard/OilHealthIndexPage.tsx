import { useState, useEffect } from "react";
import { AlertCircle, Calculator, Settings2 } from "lucide-react";
import { motion } from "framer-motion";
import MetricCard from "@/components/MetricCard";

interface CalculationResults {
  sTan: number;
  sViscosity: number;
  sOptical: number;
  ohi: number;
  status: string;
  color: string;
  bg: string;
  border: string;
  statusColorVal: string;
  description: string;
}

const OilHealthIndexPage = () => {
  const [tan, setTan] = useState<string>("0.15");
  const [viscosity, setViscosity] = useState<string>("2.5");
  const [transmission, setTransmission] = useState<string>("85");

  const [errors, setErrors] = useState<{
    tan?: string;
    viscosity?: string;
    transmission?: string;
  }>({});

  const [results, setResults] = useState<CalculationResults | null>(null);

  // Validate fields on the fly
  const validateField = (name: string, val: string) => {
    const newErrors = { ...errors };
    const num = parseFloat(val);

    if (name === "tan") {
      if (val.trim() === "" || isNaN(num)) {
        newErrors.tan = "TAN is required.";
      } else if (num < 0 || num > 0.4) {
        newErrors.tan = "TAN must be between 0 and 0.4.";
      } else {
        delete newErrors.tan;
      }
    }

    if (name === "viscosity") {
      if (val.trim() === "" || isNaN(num)) {
        newErrors.viscosity = "Viscosity is required.";
      } else if (num < 0 || num > 4) {
        newErrors.viscosity = "Viscosity must be between 0 and 4.";
      } else {
        delete newErrors.viscosity;
      }
    }

    if (name === "transmission") {
      if (val.trim() === "" || isNaN(num)) {
        newErrors.transmission = "Transmission is required.";
      } else if (num < 1 || num > 100) {
        newErrors.transmission = "Transmission must be between 1 and 100%.";
      } else {
        delete newErrors.transmission;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateOhi = (tStr: string, vStr: string, trStr: string) => {
    const tVal = parseFloat(tStr);
    const vVal = parseFloat(vStr);
    const trVal = parseFloat(trStr);

    if (isNaN(tVal) || isNaN(vVal) || isNaN(trVal)) return;

    // Score formulas
    // S_TAN = 100 * (1 - TAN / 0.4)
    // S_viscosity = 100 * ((4 - μ) / 2)
    // S_optical = Transmission (%)
    const sTanRaw = 100 * (1 - tVal / 0.4);
    const sViscRaw = 100 * ((4 - vVal) / 2);
    const sOptRaw = trVal;

    // Clamping component scores to [0, 100] as specified in the plan
    const sTan = Math.max(0, Math.min(100, sTanRaw));
    const sViscosity = Math.max(0, Math.min(100, sViscRaw));
    const sOptical = Math.max(0, Math.min(100, sOptRaw));

    // Oil Health Index calculation
    // OHI = 0.45 * S_TAN + 0.20 * S_viscosity + 0.35 * S_optical
    const ohi = 0.45 * sTan + 0.20 * sViscosity + 0.35 * sOptical;

    // Status interpretation
    let status = "Excellent";
    let color = "text-accent";
    let bg = "hsl(142 70% 45% / 0.05)";
    let border = "hsl(142 70% 45% / 0.2)";
    let statusColorVal = "hsl(142 70% 45%)";
    let description = "";

    if (ohi >= 80) {
      status = "Excellent";
      color = "text-accent";
      bg = "hsl(142 70% 45% / 0.05)";
      border = "hsl(142 70% 45% / 0.2)";
      statusColorVal = "hsl(142 70% 45%)";
      description = "The transformer oil is in excellent condition. Ideal dielectric strength and minimum acid content.";
    } else if (ohi >= 60) {
      status = "Good";
      color = "text-primary";
      bg = "hsl(217 91% 60% / 0.05)";
      border = "hsl(217 91% 60% / 0.2)";
      statusColorVal = "hsl(217 91% 60%)";
      description = "The transformer oil is in good condition. Minor signs of degradation but fully operational and safe.";
    } else if (ohi >= 40) {
      status = "Moderate";
      color = "text-warning";
      bg = "hsl(38 92% 50% / 0.05)";
      border = "hsl(38 92% 50% / 0.2)";
      statusColorVal = "hsl(38 92% 50%)";
      description = "Moderate degradation detected. Purification or monitoring is recommended soon to avoid sludge buildup.";
    } else if (ohi >= 20) {
      status = "Poor";
      color = "text-amber-500 font-medium";
      bg = "hsl(24 95% 50% / 0.05)";
      border = "hsl(24 95% 50% / 0.2)";
      statusColorVal = "hsl(24 95% 50%)";
      description = "Poor oil quality. Purification is required immediately to prevent erosion of paper insulation.";
    } else {
      status = "Critical";
      color = "text-destructive font-semibold";
      bg = "hsl(0 84% 60% / 0.05)";
      border = "hsl(0 84% 60% / 0.2)";
      statusColorVal = "hsl(0 84% 60%)";
      description = "Critical level of contamination. Immediate oil replacement or intensive purification is required to prevent catastrophic failure.";
    }

    setResults({
      sTan,
      sViscosity,
      sOptical,
      ohi,
      status,
      color,
      bg,
      border,
      statusColorVal,
      description,
    });
  };

  // Perform initial calculation on mount
  useEffect(() => {
    calculateOhi("0.15", "2.5", "85");
  }, []);

  const handleCalculate = () => {
    // Validate all fields
    const isTanValid = validateField("tan", tan);
    const isViscValid = validateField("viscosity", viscosity);
    const isTransValid = validateField("transmission", transmission);

    if (!isTanValid || !isViscValid || !isTransValid) {
      return;
    }

    calculateOhi(tan, viscosity, transmission);
  };

  // Circumference for the circular gauge SVG
  const circumference = 2 * Math.PI * 70;
  const ohiValue = results ? results.ohi : 0;
  const strokeOffset = circumference - (circumference * ohiValue) / 100;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Left Column: Input controls */}
      <div className="xl:col-span-4 space-y-6">
        <div className="surface-card p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <Settings2 size={20} className="text-primary" />
            <div>
              <h2 className="text-base font-semibold text-foreground">Oil Health Index (OHI)</h2>
              <p className="text-xs text-muted-foreground mt-0.5">OHI Range: 0–100</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* TAN Input */}
            <div className="panel-block space-y-3">
              <div className="flex justify-between text-xs font-mono">
                <label className="text-muted-foreground uppercase font-bold tracking-wider">TAN (Total Acid Number)</label>
                <span className="text-primary font-bold">Max: 0.40</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                max="0.4"
                value={tan}
                onChange={(e) => {
                  setTan(e.target.value);
                  validateField("tan", e.target.value);
                }}
                className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all font-mono"
                placeholder="e.g. 0.15"
              />
              {errors.tan && (
                <div className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errors.tan}</span>
                </div>
              )}
            </div>

            {/* Viscosity Input */}
            <div className="panel-block space-y-3">
              <div className="flex justify-between text-xs font-mono">
                <label className="text-muted-foreground uppercase font-bold tracking-wider">Viscosity (μ)</label>
                <span className="text-primary font-bold">Max: 4.00</span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="4"
                value={viscosity}
                onChange={(e) => {
                  setViscosity(e.target.value);
                  validateField("viscosity", e.target.value);
                }}
                className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all font-mono"
                placeholder="e.g. 2.5"
              />
              {errors.viscosity && (
                <div className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errors.viscosity}</span>
                </div>
              )}
            </div>

            {/* Optical Transmission Input */}
            <div className="panel-block space-y-4">
              <div className="flex justify-between text-xs font-mono">
                <label className="text-muted-foreground uppercase font-bold tracking-wider">Transmission (%)</label>
                <span className="text-primary font-bold">{transmission}%</span>
              </div>
              <div className="space-y-3">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={transmission || 1}
                  onChange={(e) => {
                    setTransmission(e.target.value);
                    validateField("transmission", e.target.value);
                  }}
                  className="input-range"
                />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={transmission}
                  onChange={(e) => {
                    setTransmission(e.target.value);
                    validateField("transmission", e.target.value);
                  }}
                  className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all font-mono"
                  placeholder="e.g. 85"
                />
              </div>
              {errors.transmission && (
                <div className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errors.transmission}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleCalculate}
              className="btn-simulate mt-2"
            >
              <Calculator size={16} />
              Calculate OHI
            </button>
          </div>
        </div>

        <div className="surface-card p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <AlertCircle size={20} className="text-primary" />
            <div>
              <h2 className="text-base font-semibold text-foreground">What is Oil Health Index?</h2>
              <p className="text-xs text-muted-foreground mt-0.5">A single 0-100 score for transformer oil condition</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            Oil Health Index combines chemical, physical, and optical indicators into one condition score. A higher score means the oil is cleaner, less acidic, and better able to support transformer insulation and cooling.
          </p>

          <div className="grid grid-cols-1 gap-3 text-xs">
            <div className="surface-panel p-3">
              <span className="label-uppercase block mb-1">TAN</span>
              <p className="text-muted-foreground">Measures acidity. Higher TAN means oxidation and ageing products are increasing.</p>
            </div>
            <div className="surface-panel p-3">
              <span className="label-uppercase block mb-1">Viscosity</span>
              <p className="text-muted-foreground">Represents oil flow quality. Poor viscosity can reduce cooling performance.</p>
            </div>
            <div className="surface-panel p-3">
              <span className="label-uppercase block mb-1">Transmission</span>
              <p className="text-muted-foreground">Represents optical clarity. Lower transmission indicates contamination or darkened oil.</p>
            </div>
          </div>

          <div className="surface-panel p-3 text-xs text-muted-foreground font-mono leading-relaxed">
            OHI = 0.45*S_TAN + 0.20*S_viscosity + 0.35*S_optical
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
            <div><b className="text-foreground">80-100:</b> Excellent</div>
            <div><b className="text-foreground">60-79:</b> Good</div>
            <div><b className="text-foreground">40-59:</b> Moderate</div>
            <div><b className="text-foreground">0-39:</b> Poor/Critical</div>
          </div>
        </div>
      </div>

      {/* Right Column: Visualization & Detailed results */}
      <div className="xl:col-span-8 space-y-6">
        {results ? (
          <motion.div
            initial={{ opacity: 0.6, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6"
          >
            {/* Circular Gauge */}
            <div className="md:col-span-5 surface-card p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-6">
                <span className="label-uppercase block">Health Rating</span>
                <h3 className="text-sm font-medium text-foreground mt-2">Overall Quality</h3>
              </div>

              <div className="relative flex items-center justify-center">
                <svg className="w-44 h-44 transform -rotate-90">
                  <circle
                    cx="88"
                    cy="88"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-secondary"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                    style={{
                      transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
                      stroke: results.statusColorVal,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-mono font-bold text-foreground">
                    {results.ohi.toFixed(2)}
                  </span>
                  <span className="label-uppercase mt-1">OHI / 100</span>
                </div>
              </div>

              <div
                className="mt-6 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border"
                style={{
                  color: results.statusColorVal,
                  borderColor: `${results.statusColorVal}33`,
                  background: `${results.statusColorVal}0d`,
                }}
              >
                {results.status}
              </div>
            </div>

            {/* Diagnostic Details */}
            <div className="md:col-span-7 space-y-6">
              <div className="surface-card p-6 space-y-6">
                <div>
                  <span className="label-uppercase mb-2 block">OHI Diagnostics</span>
                  <h3 className="text-lg font-semibold text-foreground">Interpretation</h3>
                </div>

                <div
                  className="p-4 rounded-xl border space-y-2 text-sm leading-relaxed"
                  style={{
                    color: results.statusColorVal,
                    borderColor: `${results.statusColorVal}33`,
                    background: `${results.statusColorVal}0d`,
                  }}
                >
                  <div className="font-semibold text-xs uppercase tracking-wider">
                    Status: {results.status}
                  </div>
                  <p className="text-foreground">{results.description}</p>
                </div>

                <div className="space-y-4">
                  <span className="label-uppercase block">Formula Details</span>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs leading-relaxed text-muted-foreground font-mono">
                    <div className="surface-panel p-3">
                      <span className="text-[10px] uppercase font-bold block mb-1">TAN Formula</span>
                      <span>S_TAN = 100 * (1 - TAN / 0.4)</span>
                    </div>
                    <div className="surface-panel p-3">
                      <span className="text-[10px] uppercase font-bold block mb-1">Viscosity Formula</span>
                      <span>S_visc = 100 * ((4 - μ) / 2)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Component Metric Cards */}
            <div className="md:col-span-12">
              <div className="space-y-3">
                <span className="label-uppercase tracking-wider">Component Scores</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <MetricCard
                    label="TAN Score (S_TAN)"
                    value={results.sTan.toFixed(2)}
                    unit="/ 100"
                  />
                  <MetricCard
                    label="Viscosity Score (S_visc)"
                    value={results.sViscosity.toFixed(2)}
                    unit="/ 100"
                  />
                  <MetricCard
                    label="Optical Score (S_opt)"
                    value={results.sOptical.toFixed(2)}
                    unit="/ 100"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="surface-card p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
            <p className="text-muted-foreground">Awaiting OHI inputs. Adjust parameters and click Calculate.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OilHealthIndexPage;


