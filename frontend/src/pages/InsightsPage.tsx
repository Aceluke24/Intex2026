import { AdminLayout } from "@/components/AdminLayout";
import { AIInsightCard } from "@/components/AIInsightCard";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { aiInsights } from "@/lib/mockData";
import { Brain } from "lucide-react";
import { motion } from "framer-motion";

const InsightsPage = () => {
  usePageHeader("AI Insights", "Recommendations & signals");

  return (
    <AdminLayout contentClassName="max-w-[1000px]">
      <div className="space-y-10 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 rounded-[1.25rem] border border-white/50 bg-white/45 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[hsl(340_32%_94%)] dark:bg-[hsl(340_22%_18%)]">
            <Brain className="h-6 w-6 text-[hsl(340_35%_48%)]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground lg:text-3xl">AI Insights</h1>
            <p className="mt-2 font-body text-sm leading-relaxed text-muted-foreground">
              Machine learning–powered recommendations — demo content only.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {aiInsights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="transition-transform duration-200 hover:-translate-y-1"
            >
              <AIInsightCard {...insight} />
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default InsightsPage;
