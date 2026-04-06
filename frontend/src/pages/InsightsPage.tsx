import { AdminLayout } from "@/components/AdminLayout";
import { AIInsightCard } from "@/components/AIInsightCard";
import { aiInsights } from "@/lib/mockData";
import { Brain } from "lucide-react";
import { motion } from "framer-motion";

const InsightsPage = () => (
  <AdminLayout>
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center">
          <Brain className="w-5 h-5 text-terracotta" />
        </div>
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">AI Insights</h1>
          <p className="font-body text-sm text-muted-foreground mt-0.5">
            Machine learning–powered recommendations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {aiInsights.map((insight, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <AIInsightCard {...insight} />
          </motion.div>
        ))}
      </div>
    </div>
  </AdminLayout>
);

export default InsightsPage;
