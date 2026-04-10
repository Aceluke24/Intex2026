import React, { createContext, useContext, useEffect, useState } from "react";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { API_BASE } from "@/lib/apiBase";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "light", toggle: () => {} });

export const useTheme = () => useContext(ThemeContext);

function canSyncThemeViaApi(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  // Same-origin deployments can safely use the backend cookie endpoint.
  if (!API_BASE) {
    return true;
  }

  try {
    const apiOrigin = new URL(API_BASE, window.location.origin).origin;
    return apiOrigin === window.location.origin;
  } catch {
    return false;
  }
}

function syncThemeCookie(theme: Theme, consent: "accepted" | "declined" | null) {
  // Keep localStorage as the reliable cross-deployment source of truth.
  localStorage.setItem("nss-theme", theme);

  if (consent === "accepted") {
    // Avoid cross-origin credentialed requests for theme sync.
    if (canSyncThemeViaApi()) {
      fetch(`${API_BASE}/api/preferences/theme`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ theme }),
      }).catch(() => {
        // Non-critical: fall back silently if the request fails
      });
    }
  }
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
