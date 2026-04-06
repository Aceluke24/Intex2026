import { PublicLayout } from "@/components/PublicLayout";
import { motion } from "framer-motion";
import { Heart, ArrowRight, Shield, BookOpen, Home, Users, Scale, Baby } from "lucide-react";
import { Button } from "@/components/ui/button";
import { impactStats, stories } from "@/lib/mockData";
import { useEffect, useState } from "react";

const AnimatedCounter = ({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end]);
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const programs = [
  { icon: Home, title: "Safe Housing", desc: "Secure, dignified housing for survivors and their families during recovery." },
  { icon: BookOpen, title: "Job Training", desc: "Skills development and employment support for lasting independence." },
  { icon: Shield, title: "Trauma Counseling", desc: "Professional, trauma-informed therapy for healing and growth." },
  { icon: Scale, title: "Legal Aid", desc: "Pro bono legal representation for protective orders and custody cases." },
  { icon: Baby, title: "Children's Programs", desc: "Age-appropriate support and education for children of survivors." },
  { icon: Users, title: "Community Building", desc: "Peer support groups and community events for lasting connections." },
];

const Index = () => {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 gradient-navy-cream" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 30% 70%, hsl(var(--gold) / 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 30%, hsl(var(--terracotta) / 0.2) 0%, transparent 50%)"
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.8 }}>
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold/20 text-gold text-xs font-body font-semibold uppercase tracking-wider mb-6">
                501(c)(3) Nonprofit Organization
              </span>
            </motion.div>
            <motion.h1
              initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.8, delay: 0.15 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold text-navy-foreground leading-[1.1] mb-6"
            >
              Guiding Survivors{" "}
              <span className="italic text-gold">Toward Safety</span>{" "}
              & New Beginnings
            </motion.h1>
            <motion.p
              initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.8, delay: 0.3 }}
              className="text-lg sm:text-xl text-navy-foreground/70 leading-relaxed max-w-xl mb-8 font-body"
            >
              Every person deserves to feel safe. North Star Sanctuary provides shelter, healing,
              and hope to survivors of abuse and trafficking — one life at a time.
            </motion.p>
            <motion.div
              initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.8, delay: 0.45 }}
              className="flex flex-wrap gap-4"
            >
              <Button size="lg" className="bg-gold text-navy hover:bg-gold/90 font-body font-semibold text-base px-8 gap-2 h-12">
                <Heart className="w-4 h-4" /> Donate Now
              </Button>
              <Button size="lg" variant="outline" className="border-navy-foreground/30 text-navy-foreground hover:bg-navy-foreground/10 font-body text-base px-8 gap-2 h-12">
                Learn More <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Impact Stats — Editorial Layout */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }}>
            <p className="text-xs font-body font-semibold uppercase tracking-widest text-gold mb-3">Our Impact</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-16 max-w-lg">
              Numbers that tell <span className="italic">real stories</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {[
              { val: impactStats.survivorsHelped, label: "Survivors Helped", suffix: "+" },
              { val: impactStats.donationsTotal, label: "Donations Raised", prefix: "$", suffix: "" },
              { val: impactStats.successRate, label: "Success Rate", suffix: "%" },
              { val: impactStats.communitiesServed, label: "Communities Served", suffix: "" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} transition={{ duration: 0.6, delay: i * 0.1 }}
                className="relative"
              >
                <p className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground">
                  <AnimatedCounter end={stat.val} suffix={stat.suffix} prefix={stat.prefix || ""} />
                </p>
                <p className="mt-2 text-sm font-body text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <div className="absolute -left-4 top-0 w-0.5 h-12 bg-gold/40 hidden lg:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stories */}
      <section className="py-24 bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }}>
            <p className="text-xs font-body font-semibold uppercase tracking-widest text-gold mb-3">Survivor Stories</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-16 max-w-md">
              Voices of <span className="italic">hope & healing</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stories.map((story, i) => (
              <motion.div
                key={story.id}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} transition={{ duration: 0.6, delay: i * 0.15 }}
                className={`relative rounded-2xl p-8 ${
                  i === 0 ? "bg-navy text-navy-foreground md:col-span-2 md:row-span-2" :
                  "bg-card border border-border"
                }`}
              >
                <div className="text-5xl font-display text-gold/30 mb-4">"</div>
                <blockquote className={`text-lg sm:text-xl font-display italic leading-relaxed mb-6 ${
                  i === 0 ? "text-navy-foreground/90 sm:text-2xl" : "text-card-foreground"
                }`}>
                  {story.quote}
                </blockquote>
                <div>
                  <p className={`text-sm font-body font-semibold ${i === 0 ? "text-gold" : "text-foreground"}`}>{story.name}</p>
                  <p className={`text-xs font-body ${i === 0 ? "text-navy-foreground/50" : "text-muted-foreground"}`}>
                    {story.program} · {story.year}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }} className="mb-16">
            <p className="text-xs font-body font-semibold uppercase tracking-widest text-gold mb-3">Our Programs</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground max-w-lg">
              Comprehensive support for <span className="italic">every step</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((prog, i) => (
              <motion.div
                key={prog.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group p-6 rounded-2xl border border-border bg-card hover:shadow-lg hover:border-gold/20 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <prog.icon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="font-display text-lg font-semibold text-card-foreground mb-2">{prog.title}</h3>
                <p className="text-sm font-body text-muted-foreground leading-relaxed">{prog.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-12">
            <p className="text-xs font-body font-semibold uppercase tracking-widest text-gold mb-3">Transparency & Trust</p>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Where your donation goes</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { pct: "82%", label: "Program Services" },
              { pct: "11%", label: "Fundraising" },
              { pct: "7%", label: "Administration" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl font-display font-bold text-gold">{item.pct}</p>
                <p className="mt-1 text-sm font-body text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="donate" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 gradient-navy-cream" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.8 }}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-navy-foreground mb-6">
              Be someone's <span className="italic text-gold">North Star</span>
            </h2>
            <p className="text-lg text-navy-foreground/70 max-w-xl mx-auto mb-8 font-body">
              Your generosity provides safety, healing, and hope. Every dollar directly funds
              programs that transform lives.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-gold text-navy hover:bg-gold/90 font-body font-semibold text-base px-10 gap-2 h-12">
                <Heart className="w-4 h-4" /> Give Today
              </Button>
              <Button size="lg" variant="outline" className="border-navy-foreground/30 text-navy-foreground hover:bg-navy-foreground/10 font-body text-base px-10 h-12">
                Become a Volunteer
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Index;
