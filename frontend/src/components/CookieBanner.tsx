import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, X } from "lucide-react";
import { useCookieConsent } from "@/contexts/CookieConsentContext";

export const CookieBanner = () => {
  const { consent, setConsent } = useCookieConsent();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (consent === null) {
      const timer = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [consent]);

  const accept = () => {
    setConsent("accepted");
    setVisible(false);
  };

  const decline = () => {
    setConsent("declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 30 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-sm z-50"
        >
          <div className="rounded-2xl bg-card p-5 shadow-2xl shadow-foreground/5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-terracotta/10 p-2 flex-shrink-0">
                <Shield className="w-4 h-4 text-terracotta" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground leading-relaxed mb-4 font-body">
                  We use essential cookies for site functionality. With your consent, we may use preference cookies (e.g., theme) to improve your experience.
                </p>
                <div className="flex items-center gap-2">
                  <Button onClick={accept} size="sm" className="rounded-lg bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 text-xs font-body h-7 px-4">
                    Accept
                  </Button>
                  <Button onClick={decline} variant="ghost" size="sm" className="text-xs font-body h-7 text-muted-foreground">
                    Decline
                  </Button>
                </div>
              </div>
              <button onClick={decline} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Close">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
