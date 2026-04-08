import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useId, useState } from "react";

export interface StatCardProps {
  value: string;
  label: string;
  details: string[];
  /** Controlled; when omitted, expand state is local to the card */
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function StatCard({ value, label, details, isOpen: controlledOpen, onOpenChange }: StatCardProps) {
  const panelId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const toggle = () => {
    const next = !open;
    if (isControlled) onOpenChange?.(next);
    else setUncontrolledOpen(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-controls={panelId}
      className={cn(
        "group w-full rounded-2xl border border-gray-200 bg-white p-6 text-left",
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-3xl font-semibold tabular-nums tracking-tight text-gray-900">{value}</p>
          <p className="mt-1 text-gray-500">{label}</p>
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
          strokeWidth={1.75}
        />
      </div>

      <motion.div
        id={panelId}
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        className="overflow-hidden"
      >
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-600">
          {details.map((line, i) => (
            <li key={i} className="leading-relaxed">
              {line}
            </li>
          ))}
        </ul>
      </motion.div>
    </button>
  );
}
