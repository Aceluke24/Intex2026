import { AdminLayout } from "@/components/AdminLayout";
import { CommandCenterKpis, PriorityCallouts, ResidentsList, DonationChart } from "@/components/dashboard";
import {
  attentionItems,
  donationActivity,
  donationTrendInsight,
  lightweightInsights,
  liveContext,
  primaryMetric,
  priorityCallouts,
  reintegrationSuccessMetric,
  residentsOverview,
  supportingMetrics,
} from "@/lib/dashboardMockData";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const DashboardPage = () => {
  usePageHeader("Command Center", "Live operations overview");

  return (
    <AdminLayout contentClassName="max-w-[1200px]">
      <div className="relative pb-24">
        <div
          className="pointer-events-none fixed inset-0 -z-10 opacity-95"
          style={{
            background:
              "radial-gradient(ellipse 110% 70% at 0% 0%, hsl(350 36% 96% / 0.85) 0%, transparent 48%), radial-gradient(ellipse 90% 55% at 100% 15%, hsl(36 38% 98% / 0.95) 0%, transparent 44%), hsl(36 32% 99%)",
          }}
        />

        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="mb-14 max-w-2xl lg:mb-16"
        >
          <p className="font-body text-sm font-medium text-[hsl(340,24%,42%)]">North Star Sanctuary</p>
          <h1 className="mt-2 font-display text-[clamp(1.95rem,4vw,2.5rem)] font-bold tracking-tight text-foreground">
            Command Center
          </h1>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-muted-foreground">
            What needs attention today — anonymized preview until your systems connect.
          </p>
        </motion.header>

        <section className="mb-16 lg:mb-20" aria-labelledby="kpi-heading">
          <h2 id="kpi-heading" className="mb-8 font-display text-xl font-semibold tracking-tight text-foreground">
            Operations At A Glance
          </h2>
          <CommandCenterKpis
            primary={primaryMetric}
            supporting={supportingMetrics}
            reintegration={reintegrationSuccessMetric}
            activityItems={attentionItems}
          />
        </section>

        {/* Priority intelligence */}
        <section className="mb-20 lg:mb-24" aria-labelledby="priority-heading">
          <h2 id="priority-heading" className="mb-3 font-display text-xl font-semibold tracking-tight text-foreground">
            Priority Intelligence
          </h2>
          <p className="mb-8 font-body text-sm text-muted-foreground">Signals that may need a response this week</p>
          <PriorityCallouts items={priorityCallouts} />
        </section>

        {/* Live context */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, ease }}
          className="mb-20 space-y-8 lg:mb-24"
          aria-labelledby="context-heading"
        >
          <h2 id="context-heading" className="font-display text-xl font-semibold tracking-tight text-foreground">
            Live Context
          </h2>
          <div className="max-w-3xl space-y-6 font-body text-[17px] leading-[1.65] text-foreground/88 sm:text-lg">
            <p>
              Currently supporting{" "}
              <strong className="font-semibold text-foreground tabular-nums">{liveContext.residentCount}</strong>{" "}
              residents across{" "}
              <strong className="font-semibold text-foreground tabular-nums">{liveContext.safehouseCount}</strong>{" "}
              safehouses.
            </p>
            <p>
              <strong className="font-semibold tabular-nums text-foreground">{liveContext.donationMonthLabel}</strong>{" "}
              in donations this month, {liveContext.donationTrendPhrase}. Donor retention is holding at{" "}
              <strong className="font-semibold tabular-nums text-foreground">{liveContext.retentionLabel}</strong>.
            </p>
          </div>
        </motion.section>

        {/* Donation trends */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, ease }}
          className="mb-20 lg:mb-24"
          aria-labelledby="donations-heading"
        >
          <h2 id="donations-heading" className="mb-8 font-display text-xl font-semibold tracking-tight text-foreground">
            Donation Trends
          </h2>
          <DonationChart data={donationActivity} insight={donationTrendInsight} />
        </motion.section>

        {/* Residents */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, ease }}
          className="mb-20 lg:mb-24"
          aria-labelledby="residents-heading"
        >
          <div className="mb-8 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 id="residents-heading" className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Resident Overview
              </h2>
              <p className="mt-2 font-body text-sm text-muted-foreground">Status and last touchpoint</p>
            </div>
            <p className="font-body text-xs text-muted-foreground">IDs are anonymized.</p>
          </div>
          <ResidentsList rows={residentsOverview} />
        </motion.section>

        {/* Insights */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, ease }}
          className="border-t border-[hsl(350,16%,92%)]/80 pt-16"
          aria-labelledby="insights-heading"
        >
          <h2 id="insights-heading" className="font-display text-xl font-semibold tracking-tight text-foreground">
            Insights
          </h2>
          <p className="mt-2 font-body text-sm text-muted-foreground">Light signals from mock analytics</p>
          <ul className="mt-10 max-w-2xl space-y-6 border-l-2 border-[hsl(340,22%,88%)] pl-8">
            {lightweightInsights.map((line, i) => (
              <li key={i} className="font-body text-[15px] leading-relaxed text-foreground/85">
                {line}
              </li>
            ))}
          </ul>
        </motion.section>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
