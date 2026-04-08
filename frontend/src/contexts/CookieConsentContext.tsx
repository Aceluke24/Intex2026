import React, { createContext, useContext, useState } from "react";

type ConsentState = "accepted" | "declined" | null;

const CookieConsentContext = createContext<{
  consent: ConsentState;
  setConsent: (c: ConsentState) => void;
}>({ consent: null, setConsent: () => {} });

export const useCookieConsent = () => useContext(CookieConsentContext);

export const CookieConsentProvider = ({ children }: { children: React.ReactNode }) => {
  const [consent, setConsentState] = useState<ConsentState>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("nss-cookies") : null;
    if (stored === "accepted") return "accepted";
    if (stored === "dismissed") return "declined";
    return null;
  });

  const setConsent = (c: ConsentState) => {
    if (c === "accepted") localStorage.setItem("nss-cookies", "accepted");
    else if (c === "declined") localStorage.setItem("nss-cookies", "dismissed");
    setConsentState(c);
  };

  return (
    <CookieConsentContext.Provider value={{ consent, setConsent }}>
      {children}
    </CookieConsentContext.Provider>
  );
};
