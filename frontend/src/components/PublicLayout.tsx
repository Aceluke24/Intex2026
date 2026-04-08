import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "@/lib/theme";
import { Moon, Sun, Menu, X, Heart, LogOut } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/BrandLogo";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE } from "@/lib/apiBase";
import Header from "@/components/layout/Header";
import { primaryButtonClasses } from "@/lib/primaryButton";

const baseNavItems = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Mission", path: "/mission" },
  { label: "Our Impact", path: "/impact" },
  { label: "Get Involved", path: "/get-involved" },
];

const footerNavigateLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Mission", path: "/mission" },
  { label: "Our Impact", path: "/impact" },
  { label: "Donate", path: "/donate" },
  { label: "Get Involved", path: "/get-involved" },
].filter((item) => item.path && item.path.trim().length > 0);

const footerLegalLinks = [{ label: "Privacy Policy", path: "/privacy" }].filter(
  (item) => item.path && item.path.trim().length > 0
);

export const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isDonor, refetch } = useAuth();

  const handleLogout = async () => {
    await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
    await refetch();
    navigate("/");
  };

  const navItems = [
    ...baseNavItems,
    ...(isAdmin ? [{ label: "Dashboard", path: "/dashboard" }] : []),
    ...(isDonor && !isAdmin ? [{ label: "My Donations", path: "/donor" }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
        <Header
          title="Safety, Healing, and Empowerment"
          subtitle={null}
          rightContent={
            <>
              <nav className="hidden md:flex max-w-[min(100%,28rem)] flex-wrap items-center justify-end gap-0.5">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`rounded-full px-3 py-1.5 font-body text-[13px] font-medium transition-colors ${
                      location.pathname === item.path
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="mx-2 hidden h-5 w-px shrink-0 bg-gray-200 dark:bg-white/15 sm:block" aria-hidden />
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-[13px] text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </button>
                ) : (
                  <Link to="/login" className="shrink-0">
                    <button type="button" className={primaryButtonClasses}>
                      Sign In
                    </button>
                  </Link>
                )}
                <Link to="/donate" className="shrink-0">
                  <Button
                    size="sm"
                    className="rounded-full bg-terracotta font-body text-[13px] font-medium text-terracotta-foreground hover:bg-terracotta/90 gap-1.5 px-4 transition-all hover:shadow-lg hover:shadow-terracotta/20"
                  >
                    <Heart className="h-3 w-3" /> Donate
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={toggle}
                  className="rounded-full p-2 text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  aria-label="Toggle theme"
                >
                  {theme === "light" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                </button>
              </nav>

              <div className="flex items-center gap-1 md:hidden">
                <button
                  type="button"
                  onClick={toggle}
                  className="rounded-full p-2 text-gray-600 dark:text-gray-400"
                  aria-label="Toggle theme"
                >
                  {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="rounded-full p-2 text-gray-900 dark:text-white"
                  aria-label="Menu"
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </>
          }
        />

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-b border-gray-200 bg-white dark:border-white/10 dark:bg-[#0B1D2A] md:hidden"
            >
              <div className="space-y-1 px-6 py-6">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-4 py-3 font-body text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-white/10"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 pt-4">
                  {isAuthenticated ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMobileOpen(false);
                        void handleLogout();
                      }}
                      className="w-full gap-1.5 rounded-xl border-gray-200 bg-gray-50 font-body dark:border-white/10 dark:bg-white/5"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign Out
                    </Button>
                  ) : (
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="block w-full">
                      <button type="button" className={`${primaryButtonClasses} w-full`}>
                        Sign In
                      </button>
                    </Link>
                  )}
                  <Link to="/donate" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full gap-1.5 rounded-xl bg-terracotta font-body font-medium text-terracotta-foreground hover:bg-terracotta/90">
                      <Heart className="h-3.5 w-3.5" /> Donate
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main className="flex-1">{children}</main>

      {/* Footer — minimal, editorial */}
      <footer className="gradient-navy-deep text-navy-foreground">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-6">
              <div className="mb-6">
                <BrandLockup variant="footer" />
              </div>
              <p className="text-navy-foreground/50 text-sm font-body leading-relaxed max-w-sm">
                Guiding survivors toward safety, healing, and new beginnings.
                Every contribution helps us provide shelter, counseling, and
                a path forward for those who need it most.
              </p>
              <p className="text-navy-foreground/40 text-xs font-body leading-relaxed max-w-sm mt-4">
                To protect the safety of those we serve, identifying details are never shared.
              </p>
            </div>
            <div className="lg:col-span-3">
              <p className="font-body font-medium text-[11px] uppercase tracking-[0.2em] text-terracotta mb-5">Navigate</p>
              <div className="space-y-3">
                {footerNavigateLinks.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="block text-sm font-body text-navy-foreground/50 hover:text-terracotta transition-colors duration-300"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="lg:col-span-3">
              <p className="font-body font-medium text-[11px] uppercase tracking-[0.2em] text-terracotta mb-5">Legal</p>
              <div className="space-y-3">
                {footerLegalLinks.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="block text-sm font-body text-navy-foreground/50 hover:text-terracotta transition-colors duration-300"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-navy-foreground/8">
            <p className="text-[12px] font-body text-navy-foreground/30">
              © 2026 North Star Sanctuary. All rights reserved. EIN: 84-1234567
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
