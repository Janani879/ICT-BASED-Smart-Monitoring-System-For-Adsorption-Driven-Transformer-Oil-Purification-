import { useOutletContext } from "react-router-dom";
import type { DashboardContextValue } from "./DashboardLayout";

export function useDashboardContext() {
  return useOutletContext<DashboardContextValue>();
}
