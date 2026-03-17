import ChartSection from "@/components/ChartSection";
import { useDashboardContext } from "@/components/dashboard/DashboardShell";

const VisualsPage = () => {
  const { isothermData, timeSeriesData } = useDashboardContext();

  return <ChartSection isothermData={isothermData} timeSeriesData={timeSeriesData} />;
};

export default VisualsPage;
