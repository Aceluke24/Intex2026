import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/lib/theme";
import { Moon, Sun, Menu, X, Heart } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Our Impact", path: "/impact" },
  { label: "Privacy", path: "/privacy" },
];

export const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
                <span className="text-navy font-display font-bold text-sm">NS</span>
              </div>
              <span className="font-display text-lg font-semibold tracking-tight text-foreground">
                North Star <span className="text-gold">Sanctuary</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? "text-foreground bg-secondary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="w-px h-6 bg-border mx-2" />
              <Link to="/login">
                <Button variant="ghost" size="sm" className="font-body">Sign In</Button>
              </Link>
              <Link to="/#donate">
                <Button size="sm" className="bg-gold text-navy hover:bg-gold/90 font-body font-semibold gap-1">
                  <Heart className="w-3.5 h-3.5" /> Donate
                </Button>
              </Link>
              <button
                onClick={toggle}
                className="ml-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </nav>

            <div className="flex md:hidden items-center gap-2">
              <button onClick={toggle} className="p-2 rounded-lg text-muted-foreground" aria-label="Toggle theme">
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg text-foreground" aria-label="Menu">
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
              className="md:hidden overflow-hidden bg-background border-t border-border"
            >
              <div className="px-4 py-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="border-t border-border pt-3 mt-3 flex flex-col gap-2">
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full font-body">Sign In</Button>
                  </Link>
                  <Link to="/#donate" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-gold text-navy hover:bg-gold/90 font-body font-semibold gap-1">
                      <Heart className="w-3.5 h-3.5" /> Donate
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 pt-16 md:pt-20">{children}</main>

      <footer className="bg-navy text-navy-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
                  <span className="text-navy font-display font-bold text-sm">NS</span>
                </div>
                <span className="font-display text-lg font-semibold">North Star Sanctuary</span>
              </div>
              <p className="text-navy-foreground/70 text-sm leading-relaxed max-w-md">
                Guiding survivors toward safety, healing, and new beginnings. Every contribution helps
                us provide shelter, counseling, and a path forward.
              </p>
            </div>
            <div>
              <h4 className="font-body font-semibold text-sm uppercase tracking-wider text-gold mb-4">Quick Links</h4>
              <div className="space-y-2">
                {["Our Impact", "Programs", "Volunteer", "Contact"].map((l) => (
                  <a key={l} href="#" className="block text-sm text-navy-foreground/70 hover:text-gold transition-colors">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-body font-semibold text-sm uppercase tracking-wider text-gold mb-4">Legal</h4>
              <div className="space-y-2">
                <Link to="/privacy" className="block text-sm text-navy-foreground/70 hover:text-gold transition-colors">Privacy Policy</Link>
                <a href="#" className="block text-sm text-navy-foreground/70 hover:text-gold transition-colors">Terms of Service</a>
                <a href="#" className="block text-sm text-navy-foreground/70 hover:text-gold transition-colors">501(c)(3) Status</a>
              </div>
            </div>
          </div>
          <div className="border-t border-navy-foreground/10 mt-12 pt-8 text-center">
            <p className="text-sm text-navy-foreground/50">© 2024 North Star Sanctuary. All rights reserved. EIN: 84-1234567</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
