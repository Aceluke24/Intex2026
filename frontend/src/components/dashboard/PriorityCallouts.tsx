import type { PriorityCallout } from "@/lib/dashboardTypes";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

type PriorityCalloutsProps = {
  items: PriorityCallout[];
};

export function PriorityCallouts({ items }: PriorityCalloutsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.slice(0, 5).map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease, delay: 0.05 * i }}
          className="rounded-2xl border border-[hsl(350,42%,86%)] bg-gradient-to-br from-[hsl(350,38%,97%)] via-[hsl(36,36%,99%)] to-[hsl(36,32%,98%)] px-5 py-5 shadow-[0_8px_30px_rgba(45,35,48,0.08)] transition-all duration-200 hover:shadow-[0_14px_36px_rgba(45,35,48,0.12)]"
        >
          <p className="font-display text-lg font-semibold leading-snug tracking-tight text-foreground">
            {item.headline}
          </p>
          <p className="mt-2 font-body text-sm leading-relaxed text-foreground/80">{item.supporting}</p>
        </motion.div>
      ))}
    </div>
  );
}
