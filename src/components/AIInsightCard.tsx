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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl p-5 transition-all duration-300 hover:shadow-md",
        urgency === "high" && "bg-terracotta/6",
        urgency === "medium" && "bg-gold/6",
        urgency === "low" && "bg-sage/6",
      )}
    >
      <div className="flex items-start gap-3.5">
        <div className={cn(
          "rounded-xl p-2 flex-shrink-0",
          urgency === "high" && "bg-terracotta/10 text-terracotta",
          urgency === "medium" && "bg-gold/10 text-gold",
          urgency === "low" && "bg-sage/10 text-sage",
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className="text-sm font-body font-semibold text-foreground">{title}</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{description}</p>
          <Button variant="ghost" size="sm" className="h-7 text-xs font-body text-terracotta hover:text-terracotta hover:bg-terracotta/10 rounded-lg px-3">
            {action} →
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
