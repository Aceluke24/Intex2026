import { GlobalCommandPalette } from "@/components/admin/GlobalCommandPalette";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type PageHeaderState = {
  title: string;
  subtitle?: string;
};

type AdminChromeContextValue = {
  header: PageHeaderState | null;
  setHeader: (h: PageHeaderState | null) => void;
  openCommandPalette: () => void;
};

const AdminChromeContext = createContext<AdminChromeContextValue | null>(null);

export function AdminChromeProvider({ children }: { children: React.ReactNode }) {
  const [header, setHeader] = useState<PageHeaderState | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);

  const openCommandPalette = useCallback(() => setCommandOpen(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(
    () => ({ header, setHeader, openCommandPalette }),
    [header, openCommandPalette]
  );

  return (
    <AdminChromeContext.Provider value={value}>
      <GlobalCommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      {children}
    </AdminChromeContext.Provider>
  );
}

export function useAdminChrome() {
  const ctx = useContext(AdminChromeContext);
  if (!ctx) throw new Error("useAdminChrome must be used within AdminChromeProvider");
  return ctx;
}

/** Register page title for the sticky staff bar (clears on unmount). */
export function usePageHeader(title: string, subtitle?: string) {
  const { setHeader } = useAdminChrome();
  useEffect(() => {
    setHeader({ title, subtitle });
    return () => setHeader(null);
  }, [title, subtitle, setHeader]);
}
