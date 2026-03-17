import { motion } from "framer-motion";
import EfficiencyGauge from "@/components/EfficiencyGauge";
import MetricCard from "@/components/MetricCard";
import { useDashboardContext } from "@/components/dashboard/DashboardShell";

const MetricsPage = () => {
  const { results } = useDashboardContext();
  const interpretationPoints = [];
  const advisoryPoints = [];
  let advisoryTone = "text-foreground";

  if (results.removalEfficiency < 50) {
    interpretationPoints.push(
      "Removal efficiency is low, indicating that the current operating conditions are not removing contaminants effectively."
    );
  } else if (results.removalEfficiency < 70) {
    interpretationPoints.push(
      "Removal efficiency is moderate, which means purification is occurring but may still benefit from stronger operating conditions."
    );
  } else {
    interpretationPoints.push(
      "Removal efficiency is high, suggesting the purification process is performing effectively under the current simulated conditions."
    );
  }

  if (results.qe < 20) {
    interpretationPoints.push(
      "Adsorption capacity is relatively low, which suggests the adsorbent is not yet capturing contaminants at a strong rate."
    );
  } else if (results.qe < 40) {
    interpretationPoints.push(
      "Adsorption capacity is in a moderate range, indicating a stable but not yet peak adsorption response."
    );
  } else {
    interpretationPoints.push(
      "Adsorption capacity is high, indicating strong contaminant uptake by the adsorbent."
    );
  }

  if (results.Ce > 60) {
    interpretationPoints.push(
      "Final concentration remains high, so the purified oil may still contain a noticeable level of contaminants."
    );
  } else if (results.Ce > 30) {
    interpretationPoints.push(
      "Final concentration has reduced to an acceptable intermediate range, showing partial purification."
    );
  } else {
    interpretationPoints.push(
      "Final concentration is low, which suggests the purification outcome is comparatively cleaner."
    );
  }

  if (results.eqTime > 25) {
    interpretationPoints.push(
      "Equilibrium time is relatively long, meaning the adsorption process may require more time before stabilizing."
    );
  } else {
    interpretationPoints.push(
      "Equilibrium time is comparatively short, indicating the adsorption process reaches stability quickly."
    );
  }

  interpretationPoints.push(
    `The current best-fit isotherm is ${results.model}, which means the simulated adsorption behavior follows ${results.interpretation.toLowerCase()}.`
  );

  if (results.removalEfficiency < 50) {
    advisoryTone = "text-destructive";
    advisoryPoints.push(
      "Purification performance is weak. Increase adsorption time or adsorbent mass before the next run."
    );
  } else if (results.removalEfficiency < 70) {
    advisoryTone = "text-warning";
    advisoryPoints.push(
      "Purification is partially effective, but stronger operating conditions may improve contaminant removal."
    );
  } else {
    advisoryTone = "text-accent";
    advisoryPoints.push(
      "Purification performance is strong under the current simulated conditions."
    );
  }

  if (results.Ce > 50) {
    advisoryPoints.push(
      "Final concentration is still high, so the output oil may require further purification."
    );
  } else {
    advisoryPoints.push(
      "Final concentration has reduced to a cleaner range, indicating better oil quality after treatment."
    );
  }

  if (results.isApproachingSaturation) {
    advisoryPoints.push(
      "Adsorbent saturation is approaching. Monitor capacity closely or consider replacing/regenerating the adsorbent."
    );
  }

  if (results.eqTime > 25) {
    advisoryPoints.push(
      "The process is taking longer to stabilize, so sufficient contact time is important for reliable purification."
    );
  } else {
    advisoryPoints.push(
      "The process stabilizes quickly, allowing faster evaluation of purification performance."
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="xl:col-span-8 space-y-6">
        <motion.div
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

        <div className="surface-card p-6">
          <span className="label-uppercase mb-3 block">Metric Interpretation</span>
          <div className="space-y-3 text-sm text-foreground">
            {interpretationPoints.map((point) => (
              <p key={point}>{point}</p>
            ))}
          </div>
        </div>
      </div>

      <aside className="xl:col-span-4">
        <div className="grid grid-cols-1 gap-6">
          <EfficiencyGauge
            value={results.removalEfficiency}
            isApproachingSaturation={results.isApproachingSaturation}
          />
          <div className="surface-card p-5">
            <span className="label-uppercase mb-3 block">Process Advisory</span>
            <div className={`space-y-3 text-sm ${advisoryTone}`}>
              {advisoryPoints.map((point) => (
                <p key={point}>{point}</p>
              ))}
              <p className="text-foreground">
                Final concentration is projected at{" "}
                <span className="font-mono">{results.Ce} ppm</span> with equilibrium around{" "}
                <span className="font-mono">{results.eqTime} min</span>.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default MetricsPage;
