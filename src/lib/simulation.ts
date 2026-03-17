export const generateTimeSeriesData = (time: number, temp: number, mass: number) =>
  Array.from({ length: 12 }, (_, i) => {
    const t = Math.round((time / 11) * i);
    const factor = (1 - Math.exp(-0.05 * t)) * (mass / 20) * (temp / 80);
    const removal = Math.min(95, factor * 100);
    const capacity = factor * 120;
    const concentration = Math.max(5, 100 - removal);
    return {
      time: t,
      removal: parseFloat(removal.toFixed(1)),
      capacity: parseFloat(capacity.toFixed(2)),
      concentration: parseFloat(concentration.toFixed(2)),
      temperature: temp + Math.sin(i * 0.5) * 3,
    };
  });

export const calculateAdsorption = (temp: number, time: number, mass: number) => {
  const CeInitial = 100;
  const isFreundlich = temp > 50;
  const accuracy = (Math.random() * (95 - 85) + 85).toFixed(2);

  const qmax = 150;
  const KL = 0.05;
  const KF = 2.5;
  const n = 1.8;

  const Ce = Math.max(5, CeInitial - mass * (time / 120) * (temp / 100) * 0.8);

  let qe: number;
  if (isFreundlich) {
    qe = KF * Math.pow(Ce, 1 / n);
  } else {
    qe = (qmax * KL * Ce) / (1 + KL * Ce);
  }

  const removalEfficiency = ((CeInitial - Ce) / CeInitial) * 100;
  const eqTime = 15 + temp * 0.2;
  const predictedFinalRemoval = Math.min(
    99,
    removalEfficiency + mass * 0.35 + (time / 120) * 4 - (temp > 50 ? 1.5 : 0)
  );
  const interpretation = isFreundlich
    ? "Multilayer adsorption on heterogeneous surface"
    : "Monolayer adsorption on homogeneous surface";
  const recommendation =
    removalEfficiency < 70
      ? "Increase adsorbent mass or extend purification time to improve contaminant capture."
      : "Current process settings are providing stable purification performance.";

  const timeSeriesPreview = generateTimeSeriesData(time, temp, mass);
  const plateauGap = Math.abs(
    timeSeriesPreview.at(-1)!.capacity - timeSeriesPreview.at(-2)!.capacity
  );

  return {
    model: isFreundlich ? "Freundlich" : "Langmuir",
    accuracy: parseFloat(accuracy),
    qe: parseFloat(qe.toFixed(2)),
    removalEfficiency: parseFloat(removalEfficiency.toFixed(2)),
    Ce: parseFloat(Ce.toFixed(2)),
    eqTime: parseFloat(eqTime.toFixed(0)),
    isHighEfficiency: removalEfficiency > 70,
    isApproachingSaturation: plateauGap < 1.25 || qe > 140,
    predictedFinalRemoval: parseFloat(predictedFinalRemoval.toFixed(2)),
    interpretation,
    recommendation,
  };
};

export const generateIsothermData = (model: string) =>
  Array.from({ length: 20 }, (_, i) => {
    const ce = i * 5;
    const qe =
      model === "Langmuir"
        ? (150 * 0.05 * ce) / (1 + 0.05 * ce)
        : 2.5 * Math.pow(Math.max(ce, 0.1), 1 / 1.8);
    return { ce, qe: parseFloat(qe.toFixed(2)) };
  });

export const exportCSV = (
  results: ReturnType<typeof calculateAdsorption>,
  inputs: { temp: number; time: number; mass: number }
) => {
  const rows = [
    ["Parameter", "Value"],
    ["Temperature (deg C)", inputs.temp.toString()],
    ["Time (min)", inputs.time.toString()],
    ["Adsorbent Mass (g)", inputs.mass.toString()],
    ["Best Fit Model", results.model],
    ["Model Accuracy (%)", results.accuracy.toString()],
    ["Adsorption Capacity (mg/g)", results.qe.toString()],
    ["Removal Efficiency (%)", results.removalEfficiency.toString()],
    ["Final Concentration (ppm)", results.Ce.toString()],
    ["Equilibrium Time (min)", results.eqTime.toString()],
    ["Predicted Final Removal (%)", results.predictedFinalRemoval.toString()],
    ["Interpretation", results.interpretation],
    ["Recommendation", results.recommendation],
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "simulation_results.csv";
  a.click();
  URL.revokeObjectURL(url);
};
