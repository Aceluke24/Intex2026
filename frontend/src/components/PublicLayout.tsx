import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/lib/theme";
import { Moon, Sun, Menu, X, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/BrandLogo";

const navItems = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Our Impact", path: "/impact" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "Privacy", path: "/privacy" },
];

export const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Floating nav — glass morphism */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/70 backdrop-blur-xl shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[4.25rem] h-[4.25rem] lg:min-h-[5rem] lg:h-[5rem]">
            <BrandLockup variant="nav" />

            <nav className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-full text-[13px] font-body font-medium transition-all duration-300 ${
                    location.pathname === item.path
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="w-px h-5 bg-foreground/10 mx-3" />
              <Link to="/login">
                <Button variant="ghost" size="sm" className="font-body text-[13px] rounded-full text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link to="/#donate">
                <Button size="sm" className="rounded-full bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 font-body font-medium text-[13px] px-5 gap-1.5 ml-1 transition-all duration-300 hover:shadow-lg hover:shadow-terracotta/20">
                  <Heart className="w-3 h-3" /> Donate
                </Button>
              </Link>
              <button
                onClick={toggle}
                className="ml-3 p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              </button>
            </nav>

            <div className="flex md:hidden items-center gap-1">
              <button onClick={toggle} className="p-2 rounded-full text-muted-foreground" aria-label="Toggle theme">
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-full text-foreground" aria-label="Menu">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden bg-background/95 backdrop-blur-xl"
            >
              <div className="px-6 py-6 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-xl text-sm font-body font-medium text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 flex flex-col gap-2">
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full font-body rounded-xl border-0 bg-secondary/50">Sign In</Button>
                  </Link>
                  <Link to="/#donate" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 font-body font-medium gap-1.5 rounded-xl">
                      <Heart className="w-3.5 h-3.5" /> Donate
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

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
            </div>
            <div className="lg:col-span-3">
              <p className="font-body font-medium text-[11px] uppercase tracking-[0.2em] text-terracotta mb-5">Navigate</p>
              <div className="space-y-3">
                {["Our Impact", "Programs", "Volunteer", "Contact"].map((l) => (
                  <a key={l} href="#" className="block text-sm font-body text-navy-foreground/50 hover:text-terracotta transition-colors duration-300">{l}</a>
                ))}
              </div>
            </div>
            <div className="lg:col-span-3">
              <p className="font-body font-medium text-[11px] uppercase tracking-[0.2em] text-terracotta mb-5">Legal</p>
              <div className="space-y-3">
                <Link to="/privacy" className="block text-sm font-body text-navy-foreground/50 hover:text-terracotta transition-colors duration-300">Privacy Policy</Link>
                <a href="#" className="block text-sm font-body text-navy-foreground/50 hover:text-terracotta transition-colors duration-300">Terms of Service</a>
                <a href="#" className="block text-sm font-body text-navy-foreground/50 hover:text-terracotta transition-colors duration-300">501(c)(3) Status</a>
              </div>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-navy-foreground/8">
            <p className="text-[12px] font-body text-navy-foreground/30">
              © 2024 North Star Sanctuary. All rights reserved. EIN: 84-1234567
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
