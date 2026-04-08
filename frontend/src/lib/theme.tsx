import React, { createContext, useContext, useEffect, useState } from "react";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { API_BASE } from "@/lib/apiBase";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "light", toggle: () => {} });

export const useTheme = () => useContext(ThemeContext);

function syncThemeCookie(theme: Theme, consent: "accepted" | "declined" | null) {
  if (consent === "accepted") {
    // User consented — persist theme as a browser-accessible cookie via the backend
    fetch(`${API_BASE}/api/preferences/theme`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ theme }),
    }).catch(() => {
      // Non-critical: fall back silently if the request fails
    });
  }
  // Always keep localStorage in sync as the authoritative source when no cookie
  localStorage.setItem("nss-theme", theme);
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { consent } = useCookieConsent();

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("nss-theme") as Theme) || "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    syncThemeCookie(theme, consent);
  }, [theme, consent]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};
