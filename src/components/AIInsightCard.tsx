import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingUp, User, Share2, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface AIInsightCardProps {
  type: string;
  title: string;
  description: string;
  urgency: "high" | "medium" | "low";
  action: string;
}

const typeIcons: Record<string, any> = {
  churn: AlertTriangle,
  opportunity: TrendingUp,
  resident: User,
  social: Share2,
  prediction: Lightbulb,
};

export const AIInsightCard = ({ type, title, description, urgency, action }: AIInsightCardProps) => {
  const Icon = typeIcons[type] || Lightbulb;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "rounded-xl border p-4 transition-shadow hover:shadow-md",
        urgency === "high" && "border-terracotta/30 bg-terracotta/5",
        urgency === "medium" && "border-gold/30 bg-gold/5",
        urgency === "low" && "border-sage/30 bg-sage/5",
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "rounded-lg p-2 flex-shrink-0",
          urgency === "high" && "bg-terracotta/10 text-terracotta",
          urgency === "medium" && "bg-gold/10 text-gold",
          urgency === "low" && "bg-sage/10 text-sage",
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-body font-semibold text-card-foreground">{title}</h4>
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-body font-bold uppercase",
              urgency === "high" && "bg-terracotta/20 text-terracotta",
              urgency === "medium" && "bg-gold/20 text-gold",
              urgency === "low" && "bg-sage/20 text-sage",
            )}>
              {urgency}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{description}</p>
          <Button variant="outline" size="sm" className="h-7 text-xs font-body">
            {action}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
