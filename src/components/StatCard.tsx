import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  className?: string;
}

export const StatCard = ({ label, value, change, changeType = "neutral", icon: Icon, className }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md",
      className
    )}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-body font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-display font-bold text-card-foreground">{value}</p>
        {change && (
          <p className={cn("mt-1 text-xs font-body font-medium", {
            "text-sage": changeType === "positive",
            "text-terracotta": changeType === "negative",
            "text-muted-foreground": changeType === "neutral",
          })}>
            {change}
          </p>
        )}
      </div>
      {Icon && (
        <div className="rounded-lg bg-secondary p-2.5">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
    </div>
  </motion.div>
);
