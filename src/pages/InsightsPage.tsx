import { AdminLayout } from "@/components/AdminLayout";
import { AIInsightCard } from "@/components/AIInsightCard";
import { aiInsights } from "@/lib/mockData";
import { Brain } from "lucide-react";
import { motion } from "framer-motion";

const InsightsPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">AI Insights</h1>
            <p className="text-sm text-muted-foreground font-body mt-0.5">
              Machine learning–powered recommendations across all operations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiInsights.map((insight, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <AIInsightCard {...insight} />
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default InsightsPage;
