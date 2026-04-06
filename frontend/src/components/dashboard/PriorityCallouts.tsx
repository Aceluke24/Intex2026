import type { PriorityCallout } from "@/lib/dashboardMockData";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

type PriorityCalloutsProps = {
  items: PriorityCallout[];
};

/** Large flowing intelligence blocks — not a card grid */
export function PriorityCallouts({ items }: PriorityCalloutsProps) {
  return (
    <div className="space-y-4 lg:space-y-5">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease, delay: 0.05 * i }}
          className={cn(
            "rounded-2xl px-6 py-7 shadow-[0_2px_24px_rgba(45,35,48,0.04)] transition-all duration-200 sm:px-8 sm:py-8",
            "bg-gradient-to-br from-[hsl(350,38%,97%)]/90 via-[hsl(36,36%,99%)] to-[hsl(36,32%,98%)]",
            "hover:shadow-[0_8px_40px_rgba(45,35,48,0.07)]",
            item.align === "right" ? "ml-auto max-w-[min(100%,40rem)] lg:max-w-[min(100%,44rem)]" : "mr-auto max-w-[min(100%,44rem)] lg:max-w-[min(100%,48rem)]"
          )}
        >
          <p className="font-display text-[clamp(1.125rem,2.4vw,1.35rem)] font-semibold leading-snug tracking-tight text-foreground">
            {item.headline}
          </p>
          <p className="mt-3 max-w-prose font-body text-[15px] leading-relaxed text-muted-foreground">{item.supporting}</p>
        </motion.div>
      ))}
    </div>
  );
}
