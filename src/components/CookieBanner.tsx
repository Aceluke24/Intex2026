import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, X } from "lucide-react";

export const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("nss-cookies");
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("nss-cookies", "accepted");
    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem("nss-cookies", "dismissed");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-50"
        >
          <div className="rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-gold/10 p-2 flex-shrink-0">
                <Shield className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-body font-semibold text-card-foreground mb-1">
                  We respect your privacy
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  We use essential cookies to make our site work. With your consent, we may also use
                  non-essential cookies to improve your experience. You can manage your preferences at any time.
                </p>
                <div className="flex items-center gap-2">
                  <Button onClick={accept} size="sm" className="bg-gold text-navy hover:bg-gold/90 text-xs font-body h-8">
                    Accept All
                  </Button>
                  <Button onClick={dismiss} variant="outline" size="sm" className="text-xs font-body h-8">
                    Essential Only
                  </Button>
                </div>
              </div>
              <button onClick={dismiss} className="text-muted-foreground hover:text-foreground" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
