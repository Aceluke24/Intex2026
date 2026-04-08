import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "@/lib/theme";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLockup } from "@/components/BrandLogo";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE } from "@/lib/apiBase";

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
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isDonor, refetch } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const isHome = location.pathname === "/";
  /** Transparent-until-scroll only on home hero; inner public pages use the bar so white nav stays readable. */
  const headerScrolledStyle = scrolled || !isHome;

  const textColor = headerScrolledStyle ? "text-white" : "text-white dark:text-white";

  return (
    <div className="min-h-screen flex flex-col">
      <>
        <header
          className={`
            fixed top-0 left-0 w-full z-50
            transition-all duration-300 ease-in-out

            ${
              headerScrolledStyle
                ? "bg-gradient-to-r from-[#0B1D2A] via-[#12324A] to-[#1A4A6A] shadow-md border-b border-white/10 backdrop-blur-md"
                : "bg-transparent"
            }
          `}
        >
          <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3 shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" aria-label="North Star Sanctuary — Home">
              <img src="/logo.png" alt="" className="h-10 w-10 object-contain" decoding="async" />
              <span className={`text-lg font-semibold tracking-tight ${textColor}`}>North Star Sanctuary</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm flex-1 justify-center min-w-0">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${textColor} opacity-90 hover:opacity-70 transition shrink-0 ${
                    location.pathname === item.path ? "opacity-100 font-medium" : ""
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4 shrink-0">
              <div className="hidden md:flex items-center gap-4">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className={`${textColor} text-sm opacity-80 hover:opacity-100 transition`}
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link to="/login" className={`${textColor} text-sm opacity-90 hover:opacity-70 transition`}>
                    Sign In
                  </Link>
                )}

                <Link to="/donate">
                  <button
                    type="button"
                    className="
                    flex items-center gap-2
                    px-4 py-2 rounded-full text-sm font-medium
                    bg-[#E07A5F] text-white
                    hover:bg-[#d96d51]
                    transition
                  "
                  >
                    ❤️ Donate
                  </button>
                </Link>

                <button
                  type="button"
                  onClick={toggle}
                  className={`rounded-full p-2 ${textColor} opacity-90 hover:opacity-70 transition`}
                  aria-label="Toggle theme"
                >
                  {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex items-center gap-1 md:hidden">
                <button
                  type="button"
                  onClick={toggle}
                  className={`rounded-full p-2 ${textColor} opacity-90 hover:opacity-70 transition`}
                  aria-label="Toggle theme"
                >
                  {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className={`rounded-full p-2 ${textColor} opacity-90 hover:opacity-70 transition`}
                  aria-label="Menu"
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed left-0 right-0 top-[4.5rem] z-40 max-h-[min(70vh,calc(100dvh-4.5rem))] overflow-y-auto border-b border-white/10 bg-gradient-to-r from-[#0B1D2A] via-[#12324A] to-[#1A4A6A] backdrop-blur-md md:hidden"
            >
              <div className="space-y-1 px-6 py-6">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-4 py-3 text-sm font-medium text-white opacity-90 transition hover:opacity-100 hover:bg-white/10"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 pt-4">
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        void handleLogout();
                      }}
                      className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-white opacity-90 transition hover:opacity-100 hover:bg-white/10"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-xl px-4 py-3 text-sm font-medium text-white opacity-90 transition hover:opacity-100 hover:bg-white/10"
                    >
                      Sign In
                    </Link>
                  )}
                  <Link to="/donate" onClick={() => setMobileOpen(false)} className="block">
                    <button
                      type="button"
                      className="
                        w-full flex items-center justify-center gap-2
                        px-4 py-3 rounded-full text-sm font-medium
                        bg-[#E07A5F] text-white
                        hover:bg-[#d96d51]
                        transition
                      "
                    >
                      ❤️ Donate
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>

      <main className="flex-1 pt-20">{children}</main>

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
