import { PublicLayout } from "@/components/PublicLayout";
import { PublicSafetyNote } from "@/components/PublicSafetyNote";
import { cn } from "@/lib/utils";
import { ChevronDown, HandHeart, HeartHandshake, Leaf, ShieldCheck, Sparkles, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const missionValueStats = [
  {
    value: "01",
    label: "Protection First",
    preview: "Safety and stabilization come before every other intervention.",
    icon: ShieldCheck,
    details: [
      "Every decision prioritizes resident safety and immediate harm reduction.",
      "Risk is assessed continuously, from intake through reintegration.",
      "Physical safety and emotional security are preconditions for healing.",
    ],
  },
  {
    value: "02",
    label: "Dignity & Respect",
    preview: "Every girl is treated as a whole person, never a case file.",
    icon: HeartHandshake,
    details: [
      "Each person is honored for her story, agency, and pace of recovery.",
      "We avoid labels that diminish dignity or reduce identity to trauma.",
      "Privacy and consent guide how information is shared and recorded.",
    ],
  },
  {
    value: "03",
    label: "Long-Term Healing",
    preview: "Recovery is sustained over years through consistent, whole-person care.",
    icon: HandHeart,
    details: [
      "Recovery is measured in years, not weeks, with consistent follow-through.",
      "Programs integrate counseling, education, life skills, and family support.",
      "We plan for transitions that last beyond the shelter stay.",
    ],
  },
  {
    value: "04",
    label: "Accountability & Transparency",
    preview: "Trust is earned through measurable outcomes and clear reporting.",
    icon: Sparkles,
    details: [
      "Donors receive clear reporting on how resources are used and outcomes.",
      "We document outcomes and share learnings with accountability partners.",
      "Internal governance and external oversight keep programs aligned with mission.",
    ],
  },
  {
    value: "05",
    label: "Sustainability",
    preview: "Programs are designed to remain resilient for the long run.",
    icon: Leaf,
    details: [
      "Programs are designed to remain operational through stable funding and staffing.",
      "We invest in local capacity so communities can sustain care without dependency.",
      "Environmental and financial stewardship support long-term resilience.",
    ],
  },
  {
    value: "06",
    label: "Local Partnerships",
    preview: "Local collaboration strengthens continuity of care beyond our walls.",
    icon: Users,
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
      <section className="relative overflow-hidden gradient-hero text-navy-foreground pt-24 pb-24 sm:pt-28 sm:pb-28 lg:pt-32 lg:pb-32">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            background:
              "radial-gradient(circle at 22% 28%, rgba(255,255,255,0.18), transparent 40%), radial-gradient(circle at 78% 72%, rgba(239,125,92,0.2), transparent 44%)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-[1160px] px-6 text-center"
        >
          <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.24em] text-terracotta">Mission & Values</p>
          <h1 className="font-display text-[clamp(2.6rem,6vw,4.6rem)] font-semibold tracking-tight leading-[1.04] mb-6">Our Values</h1>
          <p className="mx-auto max-w-3xl text-base leading-relaxed text-navy-foreground/74 sm:text-lg">
            Every choice we make is built to restore safety, dignity, and long-term freedom for girls rebuilding their lives.
          </p>
        </motion.div>
      </section>

      <section className="py-20 lg:py-28 bg-background">
        <div className="mx-auto max-w-[1160px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mb-12 lg:mb-16"
          >
            <h2 className="font-display text-3xl lg:text-[2.3rem] font-semibold tracking-tight text-foreground mb-4">Guiding Principles</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Six commitments shape how we protect residents, partner with communities, and remain accountable to every supporter.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-7">
            {missionValueStats.map((stat, i) => {
              const isOpen = openIndex === i;
              const Icon = stat.icon;
              return (
                <motion.button
                  key={stat.label}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    duration: 0.42,
                    delay: 0.05 * i,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className={cn(
                    "group relative h-full overflow-hidden rounded-[1.2rem] p-6 text-left",
                    "bg-[hsl(36_25%_98%)] shadow-[0_14px_38px_rgba(13,27,51,0.08)]",
                    "transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(13,27,51,0.12)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 focus-visible:ring-offset-2",
                    "dark:bg-[hsl(213_28%_14%)] dark:shadow-[0_14px_40px_rgba(3,8,16,0.45)] dark:hover:shadow-[0_24px_56px_rgba(3,8,16,0.6)]"
                  )}
                >
                  <span className="pointer-events-none absolute -right-3 top-0 text-[4.2rem] font-semibold tracking-tight text-foreground/10 dark:text-white/10">
                    {stat.value}
                  </span>

                  <div className="relative min-h-[168px]">
                    <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-foreground/[0.05] text-foreground/75 dark:bg-white/[0.08] dark:text-white/75">
                      <Icon className="h-5 w-5" strokeWidth={1.9} />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <h3 className="pr-2 text-lg font-semibold leading-snug text-foreground dark:text-white">{stat.label}</h3>
                      <ChevronDown
                        className={cn(
                          "mt-0.5 h-5 w-5 shrink-0 text-foreground/45 transition-transform duration-300 ease-in-out dark:text-white/55",
                          isOpen && "rotate-180"
                        )}
                        aria-hidden
                      />
                    </div>

                    <p className="mt-3 line-clamp-1 text-sm leading-relaxed text-muted-foreground dark:text-white/68">{stat.preview}</p>
                  </div>

                  <motion.div
                    initial={false}
                    animate={{
                      height: isOpen ? "auto" : 0,
                      opacity: isOpen ? 1 : 0,
                    }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <ul className="mt-5 space-y-2.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-foreground/50 dark:text-white/70 dark:marker:text-white/45">
                      {stat.details.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </motion.div>
                </motion.button>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 text-center"
          >
            <p className="mx-auto max-w-3xl text-base leading-relaxed text-muted-foreground dark:text-white/75">
              These values are not statements on a wall. They are the operating standard behind each rescue, each recovery plan, and each long-term outcome we pursue.
            </p>
          </motion.div>

          <PublicSafetyNote className="mt-10 lg:mt-12" />
        </div>
      </section>
    </PublicLayout>
  );
}
