import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "@/lib/theme";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLockup } from "@/components/BrandLogo";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE } from "@/lib/apiBase";
import { setLoginRedirect } from "@/lib/loginRedirect";

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

export const PublicLayout = ({
  children,
  overlayHeader = false,
}: {
  children: React.ReactNode;
  overlayHeader?: boolean;
}) => {
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isDonor, refetch } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
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

  const handleLoginIntent = () => {
    setLoginRedirect(location.pathname);
  };

  const navItems = [
    ...baseNavItems,
    ...(isAdmin ? [{ label: "Admin Dashboard", path: "/dashboard/programs" }] : []),
    ...(isDonor && !isAdmin ? [{ label: "My Donations", path: "/donor" }] : []),
  ];

  const isHomeRoute = location.pathname === "/";
  const isScrolledState = scrolled || !isHomeRoute;
  const isTransparentState = isHomeRoute && !scrolled;

  const headerBaseClass = "fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out";
  const headerTransparentClass = "bg-transparent border-b-0 shadow-none";
  const headerScrolledClass =
    "bg-[rgba(10,25,47,0.7)] bg-gradient-to-r from-[rgba(10,25,47,0.78)] to-[rgba(8,20,40,0.82)] backdrop-blur-[12px] shadow-[0_8px_24px_rgba(2,6,23,0.22),inset_0_-1px_0_0_rgba(255,255,255,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.38),inset_0_-1px_0_0_rgba(255,255,255,0.06)]";
  const headerClass = `${headerBaseClass} ${isTransparentState ? headerTransparentClass : headerScrolledClass}`;

  const navDefaultTextClass = "text-white";
  const navActiveTextClass = "text-white";
  const navHoverTextClass = "hover:text-gray-200";
  const iconBtnClass = "rounded-full p-2 text-white transition-colors duration-200 hover:text-gray-200";

  return (
    <div className="min-h-screen flex flex-col">
      <>
        <header className={`${headerClass} text-white`}>
          <div className="relative z-10 mx-auto flex h-[var(--public-header-height)] w-full max-w-7xl items-center justify-between gap-5 px-6 lg:px-12">
            <Link
              to="/"
              className="flex shrink-0 items-center gap-3 rounded-md transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              aria-label="North Star Sanctuary — Home"
            >
              <img
                src="/logo.png"
                alt=""
                className={`h-10 w-10 object-contain transition-all duration-300 ease-in-out ${isScrolledState ? "scale-95 opacity-95" : "scale-100 opacity-100"}`}
                decoding="async"
              />
              <span className="hidden min-[380px]:block text-[17px] font-display font-semibold tracking-[0.5px] text-white transition-colors duration-300 ease-in-out">
                North Star Sanctuary
              </span>
            </Link>

            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-8 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`shrink-0 font-body text-[14px] font-medium tracking-[0.2px] transition-colors duration-200 ${
                    location.pathname === item.path
                      ? navActiveTextClass
                      : `${navDefaultTextClass} ${navHoverTextClass}`
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-4">
              <div className="hidden items-center gap-4 md:flex">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/mfa-setup"
                      className="rounded-full border border-white/20 bg-white/10 px-[14px] py-[10px] font-body text-[14px] font-semibold tracking-[0.2px] text-white transition-all duration-200 ease-in-out hover:-translate-y-[1px] hover:bg-white/15"
                    >
                      2FA Setup
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="font-body text-[14px] font-medium tracking-[0.2px] text-white transition-colors duration-200 hover:text-gray-200"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={handleLoginIntent}
                    className="font-body text-[14px] font-medium tracking-[0.2px] text-white transition-colors duration-200 hover:text-gray-200"
                  >
                    Sign In
                  </Link>
                )}

                <Link to="/donate">
                  <button
                    type="button"
                    className="rounded-full bg-[#E07A5F] px-[18px] py-[10px] font-body text-[14px] font-semibold tracking-[0.2px] text-white transition-all duration-200 ease-in-out hover:-translate-y-[1px] hover:bg-[#d96d51]"
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
              className="fixed left-0 right-0 top-[var(--public-header-height)] z-40 max-h-[min(70vh,calc(100dvh-var(--public-header-height)))] overflow-y-auto border-b border-white/10 bg-[rgba(10,25,47,0.95)] backdrop-blur-[10px] md:hidden"
            >
              <div className="space-y-1 px-6 py-6">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-4 py-3 font-body text-[14px] font-medium tracking-[0.2px] text-[rgba(230,237,243,0.75)] transition-colors duration-200 hover:bg-white/10 hover:text-[#E6EDF3]"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 pt-4">
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/mfa-setup"
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-xl px-4 py-3 font-body text-[14px] font-semibold tracking-[0.2px] text-[#E6EDF3] transition-colors duration-200 hover:bg-white/10"
                      >
                        2FA Setup
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileOpen(false);
                          void handleLogout();
                        }}
                        className="w-full rounded-xl px-4 py-3 text-left font-body text-[14px] font-medium tracking-[0.2px] text-[rgba(230,237,243,0.75)] transition-colors duration-200 hover:bg-white/10 hover:text-[#E6EDF3]"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => {
                        handleLoginIntent();
                        setMobileOpen(false);
                      }}
                      className="block rounded-xl px-4 py-3 font-body text-[14px] font-medium tracking-[0.2px] text-[rgba(230,237,243,0.75)] transition-colors duration-200 hover:bg-white/10 hover:text-[#E6EDF3]"
                    >
                      Sign In
                    </Link>
                  )}
                  <Link to="/donate" onClick={() => setMobileOpen(false)} className="block">
                    <button
                      type="button"
                      className="flex w-full items-center justify-center rounded-full bg-[#E07A5F] px-[18px] py-[10px] font-body text-[14px] font-semibold tracking-[0.2px] text-white transition-all duration-200 ease-in-out hover:-translate-y-[1px] hover:bg-[#d96d51]"
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

      <main
        className={`flex-1 min-h-0 ${overlayHeader ? "pt-0" : "pt-[var(--public-header-height)]"}`}
      >
        {children}
      </main>

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
