import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/lib/theme";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Brain,
  Moon,
  Sun,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Heart,
  ClipboardList,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/BrandLogo";

function navItemActive(pathname: string, itemPath: string): boolean {
  if (itemPath === "/dashboard") return pathname === "/dashboard";
  return pathname === itemPath;
}

const navGroups = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "AI Insights", path: "/dashboard/insights", icon: Brain },
    ],
  },
  {
    label: "Case Management",
    items: [
      { label: "Caseload", path: "/dashboard/caseload", icon: ClipboardList },
      { label: "Recordings", path: "/dashboard/recordings", icon: FileText },
      { label: "Visitations", path: "/dashboard/visitations", icon: MapPin },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Donors", path: "/dashboard/donors", icon: Heart },
      { label: "Reports", path: "/dashboard/reports", icon: BarChart3 },
    ],
  },
];

export const AdminLayout = ({
  children,
  contentClassName,
}: {
  children: React.ReactNode;
  /** Wider main column (e.g. data-heavy dashboard) */
  contentClassName?: string;
}) => {
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <div className="flex items-center min-h-16 h-16 px-4">
          <Link to="/" className="flex items-center gap-2 min-w-0" aria-label="North Star Sanctuary — Home">
            <BrandLogo variant="compact" className="shrink-0" />
            {!collapsed && (
              <span className="font-display text-sm font-semibold text-sidebar-foreground whitespace-nowrap truncate">
                North Star
              </span>
            )}
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-2.5 space-y-7">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-3 mb-2.5 text-[10px] font-body font-medium uppercase tracking-[0.2em] text-sidebar-foreground/30">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = navItemActive(location.pathname, item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-body transition-all duration-200",
                        active
                          ? "bg-sidebar-accent text-sidebar-primary font-medium"
                          : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                      )}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-2.5 space-y-0.5">
          <button
            onClick={toggle}
            type="button"
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] font-body text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-all"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            {!collapsed && <span>{theme === "light" ? "Dark" : "Light"}</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            type="button"
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] font-body text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-all"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
          <Link
            to="/"
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] font-body text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-all"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Sign Out</span>}
          </Link>
        </div>
      </aside>

      <main className={cn("flex-1 transition-all duration-300 min-h-screen", collapsed ? "ml-16" : "ml-60")}>
        <div className={cn("p-6 lg:p-10 max-w-6xl", contentClassName)}>{children}</div>
      </main>
    </div>
  );
};
