import { StickyStaffBar } from "@/components/admin/StickyStaffBar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "@/lib/theme";
import {
  LayoutDashboard,
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
import { BrandLogo, BrandLockup } from "@/components/BrandLogo";
import { useAuth } from "@/contexts/AuthContext";
import { API_PREFIX } from "@/lib/apiBase";
import { apiFetch } from "@/lib/apiFetch";
import { useAdminChrome } from "@/contexts/AdminChromeContext";

function navItemActive(pathname: string, itemPath: string): boolean {
  if (itemPath === "/dashboard") return pathname === "/dashboard";
  return pathname === itemPath;
}

const navGroups = [
  {
    label: "Overview",
    items: [
      { label: "Command Center", path: "/dashboard", icon: LayoutDashboard },
      { label: "AI Insights", path: "/dashboard/insights", icon: Brain },
    ],
  },
  {
    label: "Case Management",
    items: [
      { label: "Caseload Inventory", path: "/dashboard/caseload", icon: ClipboardList },
      { label: "Process Recordings", path: "/dashboard/recordings", icon: FileText },
      { label: "Visitations & Conferences", path: "/dashboard/visitations", icon: MapPin },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Donors & Contributions", path: "/dashboard/donors", icon: Heart },
      { label: "Reports & Analytics", path: "/dashboard/reports", icon: BarChart3 },
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
  const navigate = useNavigate();
  const { user, refetch } = useAuth();
  const { header } = useAdminChrome();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await apiFetch(`${API_PREFIX}/auth/logout`, { method: "POST" });
    await refetch();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Top header bar ────────────────────────────────────── */}
      <header className={cn(
        "fixed top-0 right-0 z-50 flex items-center h-14 px-4 bg-sidebar border-b border-sidebar-border transition-all duration-300",
        collapsed ? "left-16" : "left-60"
      )}>
        <BrandLockup variant="nav" className="mr-auto text-sidebar-foreground" />

        {header && (
          <div className="hidden sm:flex flex-col items-center mx-auto">
            <span className="font-display text-sm font-semibold text-sidebar-foreground leading-tight">
              {header.title}
            </span>
            {header.subtitle && (
              <span className="font-body text-[11px] text-sidebar-foreground/40 leading-tight">
                {header.subtitle}
              </span>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          {user && (
            <span className="hidden md:block font-body text-[12px] text-sidebar-foreground/50 mr-2 max-w-[160px] truncate">
              {user.email}
            </span>
          )}
          <button
            onClick={toggle}
            type="button"
            className="p-2 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button
            onClick={handleLogout}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-body text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* ── Left sidebar ──────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <div className="flex items-center min-h-14 h-14 px-4 border-b border-sidebar-border">
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
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-body transition-all duration-200",
                        active
                          ? "bg-sidebar-accent text-sidebar-primary font-medium shadow-[inset_3px_0_0_0_hsl(10_55%_58%)] ring-1 ring-white/5"
                          : "text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/45 hover:shadow-sm"
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

        <div className="p-2.5">
          <button
            onClick={() => setCollapsed(!collapsed)}
            type="button"
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] font-body text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-all"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────── */}
      <main className={cn("flex-1 transition-all duration-300 min-h-screen pt-14", collapsed ? "ml-16" : "ml-60")}>
        <div className={cn("p-6 lg:p-10 max-w-6xl", contentClassName)}>
          <StickyStaffBar />
          {children}
        </div>
      </main>
    </div>
  );
};
