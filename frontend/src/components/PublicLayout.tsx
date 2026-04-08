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

  const iconBtnClass =
    "rounded-full p-2 text-white/85 hover:text-white transition-colors duration-200";

  return (
    <div className="min-h-screen flex flex-col">
      <>
        <header
          className={`
            fixed top-0 left-0 w-full z-50 overflow-hidden
            border-b border-white/10
            transition-all duration-300 ease-in-out
            ${
              headerScrolledStyle
                ? `bg-[linear-gradient(90deg,#0B1D2A_0%,#11293B_35%,#163D57_70%,#1A4A6A_100%)] shadow-md before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.06),transparent_40%)] before:pointer-events-none before:content-[''] ${
                    scrolled ? "backdrop-blur-md bg-[#0B1D2A]/90" : ""
                  }`
                : "bg-transparent"
            }
          `}
        >
          <div className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between px-8 py-3 gap-4">
            <Link to="/" className="flex items-center gap-3 shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" aria-label="North Star Sanctuary — Home">
              <img src="/logo.png" alt="" className="h-10 w-10 object-contain" decoding="async" />
              <span className="text-[17px] font-semibold tracking-tight text-white">North Star Sanctuary</span>
            </Link>

            <nav className="hidden md:flex items-center gap-10 flex-1 justify-center min-w-0">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-[14px] font-medium shrink-0 transition-colors duration-200 ${
                    location.pathname === item.path
                      ? "text-white"
                      : "text-white/85 hover:text-white"
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
                    className="text-[14px] font-medium text-white/70 hover:text-white transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="text-[14px] font-medium text-white/70 hover:text-white transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                )}

                <Link to="/donate">
                  <button
                    type="button"
                    className="
                      px-5 py-2.5 rounded-full text-[14px] font-semibold
                      bg-[#E07A5F]/90 text-white backdrop-blur-sm
                      border border-white/10
                      shadow-[0_4px_14px_rgba(224,122,95,0.35)]
                      hover:bg-[#E07A5F]
                      hover:shadow-[0_6px_18px_rgba(224,122,95,0.45)]
                      hover:scale-[1.02]
                      transition-all duration-200
                    "
                  >
                    Donate
                  </button>
                </Link>

                <button type="button" onClick={toggle} className={iconBtnClass} aria-label="Toggle theme">
                  {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex items-center gap-1 md:hidden">
                <button type="button" onClick={toggle} className={iconBtnClass} aria-label="Toggle theme">
                  {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className={iconBtnClass}
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
              className="fixed left-0 right-0 top-[4.5rem] z-40 max-h-[min(70vh,calc(100dvh-4.5rem))] overflow-y-auto border-b border-white/10 bg-[linear-gradient(90deg,#0B1D2A_0%,#11293B_35%,#163D57_70%,#1A4A6A_100%)] backdrop-blur-md md:hidden"
            >
              <div className="space-y-1 px-6 py-6">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-4 py-3 text-[14px] font-medium text-white/85 transition-colors duration-200 hover:text-white hover:bg-white/10"
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
                      className="w-full rounded-xl px-4 py-3 text-left text-[14px] font-medium text-white/85 transition-colors duration-200 hover:text-white hover:bg-white/10"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-xl px-4 py-3 text-[14px] font-medium text-white/85 transition-colors duration-200 hover:text-white hover:bg-white/10"
                    >
                      Sign In
                    </Link>
                  )}
                  <Link to="/donate" onClick={() => setMobileOpen(false)} className="block">
                    <button
                      type="button"
                      className="
                        w-full flex items-center justify-center
                        px-5 py-2.5 rounded-full text-[14px] font-semibold
                        bg-[#E07A5F]/90 text-white backdrop-blur-sm
                        border border-white/10
                        shadow-[0_4px_14px_rgba(224,122,95,0.35)]
                        hover:bg-[#E07A5F]
                        hover:shadow-[0_6px_18px_rgba(224,122,95,0.45)]
                        hover:scale-[1.02]
                        transition-all duration-200
                      "
                    >
                      Donate
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>

      <main className="flex-1 pt-24">{children}</main>

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
