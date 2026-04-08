import { PublicLayout } from "@/components/PublicLayout";
import { BrandLogo } from "@/components/BrandLogo";
import { motion, useScroll, useTransform } from "framer-motion";
import { Heart, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
const stories = [
  {
    id: 1,
    quote: "North Star gave me the courage to start over. Today, I have my own apartment and a job I love.",
    name: "Maria S.",
    program: "Safe Housing → Job Training",
    year: 2024,
  },
  {
    id: 2,
    quote: "The counselors here didn't just listen — they helped me find myself again. My children and I are thriving.",
    name: "Anonymous",
    program: "Trauma Counseling",
    year: 2023,
  },
  {
    id: 3,
    quote: "I never thought I'd feel safe again. This place proved me wrong.",
    name: "Jordan T.",
    program: "Emergency Shelter",
    year: 2024,
  },
] as const;
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "@/lib/apiBase";

/* Animated number that counts up on mount */
const Counter = ({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = end / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, end]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
};

/* Reveal wrapper */
const Reveal = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

type ImpactSummary = {
  survivors: number;
  totalDonations: number;
  activePrograms: number;
  completionRate: number;
};

type AllocationBreakdown = {
  direct: number;
  outreach: number;
  operations: number;
};

const Index = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.96]);

  const [residentCount, setResidentCount] = useState(0);
  const [summary, setSummary] = useState<ImpactSummary>({
    survivors: 0,
    totalDonations: 0,
    activePrograms: 0,
    completionRate: 0,
  });
  const [allocation, setAllocation] = useState<AllocationBreakdown>({
    direct: 0,
    outreach: 0,
    operations: 0,
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/public/residents/count`)
      .then((res) => res.json())
      .then((data: { count?: number }) => setResidentCount(typeof data.count === "number" ? data.count : 0))
      .catch(() => setResidentCount(0));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/public/impact/summary`)
      .then((res) => res.json())
      .then((data: Partial<ImpactSummary>) =>
        setSummary({
          survivors: typeof data.survivors === "number" ? data.survivors : 0,
          totalDonations: typeof data.totalDonations === "number" ? data.totalDonations : 0,
          activePrograms: typeof data.activePrograms === "number" ? data.activePrograms : 0,
          completionRate: typeof data.completionRate === "number" ? data.completionRate : 0,
        })
      )
      .catch(() =>
        setSummary({ survivors: 0, totalDonations: 0, activePrograms: 0, completionRate: 0 })
      );
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/public/impact/allocation`)
      .then((res) => res.json())
      .then((data: Partial<AllocationBreakdown>) =>
        setAllocation({
          direct: typeof data.direct === "number" ? data.direct : 0,
          outreach: typeof data.outreach === "number" ? data.outreach : 0,
          operations: typeof data.operations === "number" ? data.operations : 0,
        })
      )
      .catch(() => setAllocation({ direct: 0, outreach: 0, operations: 0 }));
  }, []);

  const donationTotal = Math.max(0, Math.floor(Number(summary.totalDonations)));

  return (
    <PublicLayout>
      {/* ═══════════════════════════════════════════════
          HERO — Full-viewport, immersive, mission-first
         ═══════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative flex min-h-[90vh] min-h-[100dvh] flex-col items-center justify-center overflow-x-hidden px-6 pt-20 sm:min-h-[95vh] sm:pt-24 md:pt-28 lg:min-h-[100vh] pb-16 sm:pb-20 md:pb-24 lg:pb-32"
      >
        {/* Deep navy gradient with warm undertones */}
        <div className="absolute inset-0 gradient-hero" />
        {/* Ambient glow — terracotta warmth */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 80% 60% at 20% 80%, hsl(10 55% 50% / 0.15) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 20%, hsl(43 74% 63% / 0.08) 0%, transparent 70%)"
        }} />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 w-full max-w-5xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="mb-5 sm:mb-8 md:mb-10"
          >
            <BrandLogo variant="hero" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-body text-[11px] font-medium uppercase tracking-[0.3em] text-terracotta mb-5 sm:mb-7"
          >
            A safe place to begin again
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[clamp(2.5rem,7vw,6rem)] font-bold text-navy-foreground leading-[1.05] mb-5 sm:mb-7"
          >
            Every survivor
            <br />
            deserves a{" "}
            <span className="italic text-terracotta">path forward</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-body text-base sm:text-lg text-navy-foreground/60 leading-relaxed max-w-lg mx-auto mb-8 sm:mb-10 md:mb-12"
          >
            We walk alongside survivors of abuse and trafficking — providing safety,
            healing, and the support to rebuild their lives.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Button size="lg" className="rounded-full bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 font-body font-medium text-sm px-8 gap-2 h-12 transition-all duration-300 hover:shadow-xl hover:shadow-terracotta/20 hover:scale-[1.02]">
              <Heart className="w-4 h-4" /> Give Today
            </Button>
            <Button size="lg" variant="ghost" className="rounded-full text-navy-foreground/80 hover:text-navy-foreground hover:bg-navy-foreground/5 font-body text-sm px-8 h-12" asChild>
              <Link to="/about">Learn Our Story</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
            <ArrowDown className="w-4 h-4 text-navy-foreground/30" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════
          MISSION STATEMENT — Oversized type, breathing space
         ═══════════════════════════════════════════════ */}
      <section className="py-32 lg:py-44 gradient-cream-warm">
        <div className="max-w-5xl mx-auto px-6">
          <Reveal>
            <h2 className="font-display text-[clamp(1.8rem,4.5vw,3.8rem)] font-bold text-foreground leading-[1.15] max-w-4xl">
              We believe that{" "}
              <span className="text-terracotta">no one should face</span>{" "}
              their darkest moments alone. North Star Sanctuary has supported{" "}
              <span className="text-terracotta italic">
                <Counter end={residentCount} suffix="+" />
              </span>{" "}
              survivors in building new lives — with shelter, counseling, and
              unwavering hope.
            </h2>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          IMPACT — Large-scale numbers, editorial rhythm
         ═══════════════════════════════════════════════ */}
      <section className="py-28 lg:py-40 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <p className="font-body text-[11px] font-medium uppercase tracking-[0.3em] text-terracotta mb-6">
              Measured impact
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-20 gap-x-16 lg:gap-x-24">
            {[
              { val: donationTotal, label: "Raised for survivors and families", prefix: "$", suffix: "", sub: "Monetary gifts recorded in our system" },
              { val: summary.completionRate, label: "Program completion rate across education services", suffix: "%", sub: "Share of education records marked completed" },
              { val: summary.activePrograms, label: "Active program partnership areas", suffix: "", sub: "Distinct program areas from partner assignments" },
              { val: summary.survivors, label: "Residents in our case management records", suffix: "+", sub: "Total residents on file" },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.1}>
                <div className="group">
                  <p className="font-display text-[clamp(3rem,8vw,5.5rem)] font-bold text-foreground leading-none mb-3 transition-colors duration-500 group-hover:text-terracotta">
                    <Counter end={stat.val} suffix={stat.suffix} prefix={stat.prefix || ""} />
                  </p>
                  <p className="font-body text-sm text-foreground/80 mb-1 max-w-xs">{stat.label}</p>
                  <p className="font-body text-xs text-muted-foreground">{stat.sub}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SURVIVOR STORY — Full-bleed narrative moment
         ═══════════════════════════════════════════════ */}
      <section className="relative py-32 lg:py-44 overflow-hidden">
        <div className="absolute inset-0 gradient-section-blush" />
        <div className="relative max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="max-w-3xl">
              <p className="font-body text-[11px] font-medium uppercase tracking-[0.3em] text-terracotta mb-10">
                A survivor's story
              </p>
              <div className="relative">
                <span className="absolute -top-8 -left-4 font-display text-[8rem] leading-none text-terracotta/10 select-none">"</span>
                <blockquote className="font-display text-[clamp(1.5rem,3.5vw,2.8rem)] text-foreground leading-[1.3] font-medium italic">
                  {stories[0].quote}
                </blockquote>
              </div>
              <div className="mt-10 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-terracotta/15 flex items-center justify-center">
                  <span className="font-display text-sm font-bold text-terracotta">{stories[0].name[0]}</span>
                </div>
                <div>
                  <p className="font-body text-sm font-medium text-foreground">{stories[0].name}</p>
                  <p className="font-body text-xs text-muted-foreground">{stories[0].program} · {stories[0].year}</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          MORE VOICES — Staggered, varied layout
         ═══════════════════════════════════════════════ */}
      <section className="py-28 lg:py-36 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <p className="font-body text-[11px] font-medium uppercase tracking-[0.3em] text-terracotta mb-4">
              Voices of hope
            </p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-20 max-w-md leading-tight">
              Every life changed is a story worth telling.
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6">
            {/* Large featured quote */}
            <Reveal className="lg:col-span-7">
              <div className="gradient-navy-deep rounded-3xl p-10 lg:p-14 h-full flex flex-col justify-between min-h-[320px]">
                <blockquote className="font-display text-xl lg:text-2xl text-navy-foreground/90 italic leading-relaxed">
                  "{stories[1].quote}"
                </blockquote>
                <div className="mt-8">
                  <p className="font-body text-sm font-medium text-terracotta">{stories[1].name}</p>
                  <p className="font-body text-xs text-navy-foreground/40">{stories[1].program}</p>
                </div>
              </div>
            </Reveal>

            {/* Smaller quote */}
            <Reveal className="lg:col-span-5" delay={0.15}>
              <div className="bg-terracotta/8 rounded-3xl p-10 lg:p-12 h-full flex flex-col justify-between min-h-[320px]">
                <blockquote className="font-display text-lg lg:text-xl text-foreground italic leading-relaxed">
                  "{stories[2].quote}"
                </blockquote>
                <div className="mt-8">
                  <p className="font-body text-sm font-medium text-terracotta">{stories[2].name}</p>
                  <p className="font-body text-xs text-muted-foreground">{stories[2].program}</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PROGRAMS — Staggered editorial, no card grid
         ═══════════════════════════════════════════════ */}
      <section className="py-28 lg:py-36 gradient-cream-warm">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <p className="font-body text-[11px] font-medium uppercase tracking-[0.3em] text-terracotta mb-4">
              Our programs
            </p>
            <h2 className="font-display text-3xl lg:text-5xl font-bold text-foreground mb-20 max-w-xl leading-tight">
              Comprehensive support for every step of recovery.
            </h2>
          </Reveal>

          <div className="space-y-16 lg:space-y-24">
            {[
              { num: "01", title: "Safe Housing", desc: "Secure, dignified housing where survivors and their families can begin the healing process in a protected environment." },
              { num: "02", title: "Trauma-Informed Counseling", desc: "Professional, empathetic therapy that addresses the root causes of trauma and builds pathways to lasting emotional health." },
              { num: "03", title: "Workforce Development", desc: "Skills training, mentorship, and employment placement that empowers survivors with economic independence and confidence." },
              { num: "04", title: "Legal Advocacy", desc: "Pro bono legal representation for protective orders, custody, immigration relief, and navigating complex systems." },
              { num: "05", title: "Children's Support", desc: "Age-appropriate therapy, tutoring, and enrichment programs that help children process trauma and thrive academically." },
            ].map((prog, i) => (
              <Reveal key={prog.num} delay={0.05}>
                <div className={`flex flex-col lg:flex-row items-start gap-6 lg:gap-16 ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                  <div className="flex-shrink-0">
                    <span className="font-display text-6xl lg:text-8xl font-bold text-terracotta/15">{prog.num}</span>
                  </div>
                  <div className="max-w-lg">
                    <h3 className="font-display text-xl lg:text-2xl font-bold text-foreground mb-3">{prog.title}</h3>
                    <p className="font-body text-sm text-muted-foreground leading-relaxed">{prog.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TRANSPARENCY — Simple, confident, no boxes
         ═══════════════════════════════════════════════ */}
      <section className="py-28 lg:py-36 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <Reveal>
            <div className="lg:flex items-end justify-between gap-16 mb-20">
              <div>
                <p className="font-body text-[11px] font-medium uppercase tracking-[0.3em] text-terracotta mb-4">
                  Full transparency
                </p>
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground max-w-md leading-tight">
                  We believe donors deserve to know where every dollar goes.
                </h2>
              </div>
              <p className="font-body text-sm text-muted-foreground max-w-xs mt-6 lg:mt-0 leading-relaxed">
                Allocation below reflects how recorded donations are directed across program areas in our database.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-3 gap-8 lg:gap-16">
            {[
              { pct: `${allocation.direct}%`, label: "Direct services (education & wellbeing)", color: "text-terracotta" },
              { pct: `${allocation.outreach}%`, label: "Outreach", color: "text-foreground" },
              { pct: `${allocation.operations}%`, label: "Operations", color: "text-muted-foreground" },
            ].map((item, i) => (
              <Reveal key={item.label} delay={i * 0.1}>
                <div>
                  <p className={`font-display text-[clamp(2rem,5vw,4rem)] font-bold leading-none mb-2 ${item.color}`}>{item.pct}</p>
                  <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FINAL CTA — Immersive, emotional
         ═══════════════════════════════════════════════ */}
      <section id="donate" className="relative py-36 lg:py-48 overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 70% 70% at 50% 100%, hsl(10 55% 50% / 0.2) 0%, transparent 70%)"
        }} />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <div className="flex justify-center mb-8 sm:mb-10">
              <BrandLogo
                variant="inline"
                className="justify-center"
                imgClassName="opacity-[0.94] drop-shadow-sm"
              />
            </div>
            <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] font-bold text-navy-foreground leading-[1.1] mb-8">
              Be someone's
              <br />
              <span className="italic text-terracotta">North Star</span>
            </h2>
            <p className="font-body text-base text-navy-foreground/50 max-w-md mx-auto mb-12 leading-relaxed">
              Your generosity provides safety, healing, and hope.
              Every dollar directly funds programs that transform lives.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="rounded-full bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 font-body font-medium text-sm px-10 gap-2 h-13 transition-all duration-300 hover:shadow-xl hover:shadow-terracotta/25 hover:scale-[1.02]">
                <Heart className="w-4 h-4" /> Give Today
              </Button>
              <Button size="lg" variant="ghost" className="rounded-full text-navy-foreground/70 hover:text-navy-foreground hover:bg-navy-foreground/5 font-body text-sm px-10 h-13">
                Become a Volunteer
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Index;
