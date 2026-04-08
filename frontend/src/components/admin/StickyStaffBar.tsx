import { useAdminChrome } from "@/contexts/AdminChromeContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

export function StickyStaffBar() {
  const { openCommandPalette } = useAdminChrome();

  return (
    <motion.header
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "sticky top-0 z-30 mb-8 flex flex-col gap-3 border-b border-border/40 pb-4",
        "bg-[hsl(36_32%_97%)]/85 backdrop-blur-xl supports-[backdrop-filter]:bg-[hsl(36_32%_97%)]/70",
        "dark:bg-[hsl(213_40%_10%)]/90 dark:supports-[backdrop-filter]:bg-[hsl(213_40%_10%)]/75"
      )}
    >
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={openCommandPalette}
          className={cn(
            "group flex min-w-0 w-full flex-1 items-center gap-3 rounded-2xl border border-gray-200 bg-white/80 px-4 py-2.5 text-left shadow-sm transition-all duration-200",
            "hover:border-[hsl(340_35%_82%)] hover:bg-white hover:shadow-md",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(340_35%_65%)]/30",
            "dark:border-white/10 dark:bg-white/[0.08] dark:hover:bg-white/[0.12]"
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform duration-200 group-hover:scale-105" strokeWidth={1.5} />
          <span className="min-w-0 flex-1 font-body text-sm text-muted-foreground">Search or jump anywhere…</span>
          <kbd className="hidden shrink-0 rounded-lg border border-border/60 bg-background/80 px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-block">
            ⌘K
          </kbd>
        </button>
      </div>
    </motion.header>
  );
}
