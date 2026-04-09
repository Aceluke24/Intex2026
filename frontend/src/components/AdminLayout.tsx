import { StickyStaffBar } from "@/components/admin/StickyStaffBar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "@/lib/theme";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Heart,
  ClipboardList,
  MapPin,
  Activity,
  DollarSign,
  Receipt,
  Megaphone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/BrandLogo";
import Header from "@/components/layout/Header";
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
    label: "Programs & Operations",
    items: [
      { label: "Programs Dashboard", path: "/dashboard/programs", icon: Activity },
      { label: "Caseload Inventory", path: "/dashboard/caseload", icon: ClipboardList },
      { label: "Process Recordings", path: "/dashboard/recordings", icon: FileText },
      { label: "Visitations & Conferences", path: "/dashboard/visitations", icon: MapPin },
      { label: "Reports & Analytics", path: "/dashboard/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Finance & Contributions",
    items: [
      { label: "Finance Dashboard", path: "/dashboard/finance", icon: DollarSign },
      { label: "Donors & Contributions", path: "/dashboard/donors", icon: Heart },
      { label: "Expenses", path: "/dashboard/expenses", icon: Receipt },
    ],
  },
  {
    label: "Outreach",
    items: [
      { label: "Social Media", path: "/dashboard/outreach", icon: Megaphone },
    ],
  },
  {
    label: "Settings & Administration",
    items: [
      { label: "Staff & Users", path: "/dashboard/staff", icon: Users },
    ],
  },
  {
    label: "Overview",
    items: [
      { label: "Command Center", path: "/dashboard", icon: LayoutDashboard },
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
      <div
        className={cn(
          "fixed top-0 right-0 z-50 transition-all duration-300",
          collapsed ? "left-16" : "left-60"
        )}
      >
        <Header
          title={header?.title ?? "Dashboard"}
          subtitle={header?.subtitle ?? null}
          rightContent={
            <>
              {user && (
                <span className="hidden max-w-[160px] truncate font-body text-sm text-gray-500 dark:text-gray-400 md:inline">
                  {user.email}
                </span>
              )}
              <button
                onClick={toggle}
                type="button"
                className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100"
                aria-label="Toggle theme"
              >
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
              <Link
                to="/mfa-setup"
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-gray-100"
                title="Two-Factor Authentication"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">2FA Setup</span>
              </Link>
              <button
                onClick={() => void handleLogout()}
                type="button"
                className="text-sm text-gray-500 hover:underline dark:text-gray-400"
              >
                Sign Out
              </button>
            </>
          }
        />
      </div>

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
