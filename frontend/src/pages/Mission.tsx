import { PublicLayout } from "@/components/PublicLayout";
import { PublicSafetyNote } from "@/components/PublicSafetyNote";
import { StatCard } from "@/components/StatCard";
import { motion } from "framer-motion";
import { useState } from "react";

const missionValueStats = [
  {
    value: "01",
    label: "Protection First",
    details: [
      "Every decision prioritizes resident safety and immediate harm reduction.",
      "Risk is assessed continuously, from intake through reintegration.",
      "Physical safety and emotional security are preconditions for healing.",
    ],
  },
  {
    value: "02",
    label: "Dignity & Respect",
    details: [
      "Each person is honored for her story, agency, and pace of recovery.",
      "We avoid labels that diminish dignity or reduce identity to trauma.",
      "Privacy and consent guide how information is shared and recorded.",
    ],
  },
  {
    value: "03",
    label: "Long-Term Healing",
    details: [
      "Recovery is measured in years, not weeks, with consistent follow-through.",
      "Programs integrate counseling, education, life skills, and family support.",
      "We plan for transitions that last beyond the shelter stay.",
    ],
  },
  {
    value: "04",
    label: "Accountability & Transparency",
    details: [
      "Donors receive clear reporting on how resources are used and outcomes.",
      "We document outcomes and share learnings with accountability partners.",
      "Internal governance and external oversight keep programs aligned with mission.",
    ],
  },
  {
    value: "05",
    label: "Sustainability",
    details: [
      "Programs are designed to remain operational through stable funding and staffing.",
      "We invest in local capacity so communities can sustain care without dependency.",
      "Environmental and financial stewardship support long-term resilience.",
    ],
  },
  {
    value: "06",
    label: "Local Partnerships",
    details: [
      "We collaborate with trusted community organizations and government partners.",
      "Local partners strengthen referrals, placement, and ongoing support networks.",
      "Shared goals reduce duplication and align care across systems.",
    ],
  },
] as const;

export default function Mission() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <PublicLayout>
      <section className="pt-8 pb-16 sm:pt-10 lg:pt-12 gradient-cream-warm">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-terracotta mb-4">Mission & Values</p>
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-semibold tracking-tight text-foreground leading-[1.12] mb-5">
            Mission
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            We provide safe housing, holistic rehabilitation, and a path to independence for girls rescued from trafficking and abuse.
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mb-12 lg:mb-14"
          >
            <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-foreground mb-3">Values</h2>
            <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
              Six principles that guide care, partnerships, and how we report to supporters. Tap a card to learn more.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {missionValueStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.06 * i,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <StatCard
                  value={stat.value}
                  label={stat.label}
                  details={[...stat.details]}
                  isOpen={openIndex === i}
                  onOpenChange={(open) => setOpenIndex(open ? i : null)}
                />
              </motion.div>
            ))}
          </div>

          <PublicSafetyNote className="mt-10 lg:mt-12" />
        </div>
      </section>
    </PublicLayout>
  );
}
