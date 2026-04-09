import { GlobalCommandPalette } from "@/components/admin/GlobalCommandPalette";
import { useEffect, useState } from "react";

/** Wraps admin dashboard routes: global command palette and children. */
export function AdminChromeProvider({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);

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

  return (
    <>
      <GlobalCommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      {children}
    </>
  );
}
