import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/lib/theme";
import {
  LayoutDashboard, Users, FileText, Home, BarChart3, Brain,
  Moon, Sun, LogOut, ChevronLeft, ChevronRight, Heart, ClipboardList, MapPin,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
      { label: "AI Insights", path: "/admin/insights", icon: Brain },
    ],
  },
  {
    label: "Case Management",
    items: [
      { label: "Caseload", path: "/admin/caseload", icon: ClipboardList },
      { label: "Process Recordings", path: "/admin/recordings", icon: FileText },
      { label: "Home Visitations", path: "/admin/visitations", icon: MapPin },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Donors", path: "/admin/donors", icon: Heart },
      { label: "Reports", path: "/admin/reports", icon: BarChart3 },
    ],
  },
];

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                <span className="text-navy font-display font-bold text-xs">NS</span>
              </div>
              <span className="font-display text-sm font-semibold text-sidebar-foreground whitespace-nowrap">
                North Star
              </span>
            </Link>
          )}
          {collapsed && (
            <div className="w-7 h-7 rounded-full bg-gold flex items-center justify-center mx-auto">
              <span className="text-navy font-display font-bold text-xs">NS</span>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-body font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-primary font-medium"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
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

        <div className="p-2 border-t border-sidebar-border space-y-1">
          <button
            onClick={toggle}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-body text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            {!collapsed && <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-body text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
          <Link
            to="/"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-body text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Sign Out</span>}
          </Link>
        </div>
      </aside>

      <main className={cn("flex-1 transition-all duration-300", collapsed ? "ml-16" : "ml-64")}>
        <div className="p-6 md:p-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
};
