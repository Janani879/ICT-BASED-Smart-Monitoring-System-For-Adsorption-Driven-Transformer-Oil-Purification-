import { Activity, Layers } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const navItems: Array<{
  id: string;
  label: string;
  description: string;
  to: string;
  icon: typeof Activity;
}> = [
  {
    id: "ohi",
    label: "Oil Health Index",
    description: "Calculator and diagnostics",
    to: "/ohi",
    icon: Activity,
  },
  {
    id: "tab2",
    label: "DGA Fault Analysis",
    description: "Dissolved Gas Analysis",
    to: "/tab2",
    icon: Layers,
  },
  {
    id: "tab3",
    label: "Live Monitoring",
    description: "ESP32 sensor trends",
    to: "/tab3",
    icon: Layers,
  },
  {
    id: "tab4",
    label: "Summary",
    description: "All results overview",
    to: "/tab4",
    icon: Layers,
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

