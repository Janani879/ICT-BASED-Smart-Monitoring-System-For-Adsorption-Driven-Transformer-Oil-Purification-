import ControlPanel from "@/components/ControlPanel";
import { useDashboardContext } from "@/components/dashboard/DashboardShell";

const ControlsPage = () => {
  const {
    draftInputs,
    setDraftInputs,
    simulatedInputs,
    handleSimulate,
    modelInterpretation,
    results,
    isProcessing,
  } = useDashboardContext();

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="xl:col-span-1">
        <ControlPanel
          inputs={draftInputs}
          onInputChange={setDraftInputs}
          onSimulate={handleSimulate}
          modelInterpretation={modelInterpretation}
          isHighEfficiency={results.isHighEfficiency}
          isProcessing={isProcessing}
        />
      </div>

      <div className="xl:col-span-2 space-y-6">
        <div className="surface-card p-6">
          <span className="label-uppercase mb-3 block">Simulation Status</span>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="surface-panel p-4">
              <span className="label-uppercase block mb-2">Best Fit Isotherm</span>
              <p className="text-lg text-foreground">{results.model}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                This updates only after you press Run Simulation.
              </p>
            </div>
            <div className="surface-panel p-4">
              <span className="label-uppercase block mb-2">Applied Inputs</span>
              <p className="text-sm text-foreground">
                {simulatedInputs.temp} deg C, {simulatedInputs.time} min, {simulatedInputs.mass} g
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlsPage;
