import { Activity, BarChart3, Gauge, SlidersHorizontal } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const navItems: Array<{
  id: string;
  label: string;
  description: string;
  to: string;
  icon: typeof Activity;
}> = [
  {
    id: "overview",
    label: "Overview",
    description: "System status and interpretation",
    to: "/overview",
    icon: Activity,
  },
  {
    id: "controls",
    label: "Controls",
    description: "Simulation parameters",
    to: "/controls",
    icon: SlidersHorizontal,
  },
  {
    id: "metrics",
    label: "Metrics",
    description: "Model outputs and gauge",
    to: "/metrics",
    icon: Gauge,
  },
  {
    id: "visuals",
    label: "Visuals",
    description: "Charts and process trends",
    to: "/visuals",
    icon: BarChart3,
  },
];

const NavigationSidebar = () => {
  return (
    <aside className="col-span-12 xl:col-span-2">
      <div className="surface-card sticky top-6 p-4">
        <div className="mb-4">
          <span className="label-uppercase block mb-2">Navigation</span>
          <h2 className="text-sm font-medium text-foreground">Dashboard Sections</h2>
        </div>

        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.id}
                to={item.to}
                className="nav-rail-item"
                activeClassName="nav-rail-item-active"
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    <Icon size={16} className={isActive ? "text-primary" : "text-muted-foreground"} />
                    <div className="text-left">
                      <div className="text-sm font-medium text-foreground">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default NavigationSidebar;
