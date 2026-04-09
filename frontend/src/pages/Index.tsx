import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { PublicSafetyNote } from "@/components/PublicSafetyNote";
import { AnimatedCount } from "@/components/AnimatedCount";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { Home, HeartPulse, HandHeart, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPublicHomeStats, type PublicHomeStats } from "@/lib/publicImpact";
import { Skeleton } from "@/components/ui/skeleton";

const fromFieldFallback = [
  {
    id: 1,
    date: "March 2026",
    title: "Education milestone reached in a partner safe home",
    story:
      "Girls in one of our partner homes completed their term assessments and are now beginning life-skills mentoring for long-term reintegration.",
  },
  {
    id: 2,
    date: "February 2026",
    title: "Trauma recovery support expanded",
    story:
      "Additional counseling groups were launched with local partners to provide consistent emotional care during the first months after intake.",
  },
  {
    id: 3,
    date: "January 2026",
    title: "Reintegration planning strengthened",
    story:
      "Case teams introduced personalized reintegration plans focused on education continuity, caregiver support, and safety follow-up.",
  },
] as const;

const Index = () => {
  const [homeStats, setHomeStats] = useState<PublicHomeStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setDataError(null);
      setStatsLoading(true);
      const stats = await fetchPublicHomeStats();
      if (cancelled) return;
      setHomeStats(stats);
      setStatsLoading(false);
      const allMissing =
        stats.totalResidents == null &&
        stats.totalSafehouses == null &&
        stats.counselingSessionsCount == null &&
        stats.reintegrationRatePercent == null;
      if (allMissing) {
        setDataError("Live impact data is temporarily unavailable. Showing placeholders.");
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PublicLayout overlayHeader>
      <section className="relative overflow-hidden gradient-hero text-navy-foreground pt-0 pb-24 sm:pb-28 lg:pb-32">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.18), transparent 40%), radial-gradient(circle at 80% 70%, rgba(239,125,92,0.22), transparent 45%)",
          }}
        />
        <div className="max-w-6xl mx-auto px-6 pt-28 sm:pt-32 lg:pt-36">
          {dataError && (
            <div className="mb-8 rounded-xl border border-navy-foreground/25 bg-navy-foreground/10 px-4 py-3 text-sm">
              {dataError}
            </div>
          )}
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-terracotta mb-5">North Star Sanctuary</p>
          <h1 className="font-display text-5xl md:text-6xl font-semibold tracking-tight leading-[1.04] max-w-4xl mb-6">
            A Safe Place to Heal. A Path to Freedom.
          </h1>
          <p className="text-base sm:text-lg text-navy-foreground/70 max-w-3xl leading-relaxed mb-12">
            North Star Sanctuary provides safe housing, rehabilitation, and long-term support for girls escaping trafficking and abuse in vulnerable regions of India.
          </p>
          <p className="text-sm text-navy-foreground/70 max-w-2xl mb-10">
            Working in vulnerable regions across India where support systems are limited.
          </p>
          <div className="flex flex-wrap gap-4 mb-14">
            <Button asChild className="rounded-full bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 h-12 px-7 text-sm transition-all duration-300 ease-out hover:scale-[1.02]">
              <Link to="/donate">Donate Now</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-full bg-navy-foreground/12 text-navy-foreground hover:bg-navy-foreground/18 h-12 px-7 text-sm transition-all duration-300 ease-out hover:scale-[1.02]">
              <Link to="/impact">See Our Impact</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: "Safe Housing", icon: Home },
              { title: "Trauma-Informed Care", icon: HeartPulse },
              { title: "Long-Term Reintegration", icon: HandHeart },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-navy-foreground/6 p-5 transition-all duration-300 ease-out hover:-translate-y-0.5">
                <item.icon className="w-5 h-5 text-terracotta mb-3" />
                <p className="font-medium">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-24 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <RevealOnScroll>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-7">
                <h2 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight text-foreground mb-6">What We Do</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  We operate secure, confidential safe homes in high-risk regions of Northern India, providing emergency shelter, counseling and trauma recovery, education and life skills, and reintegration support.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Every girl receives individualized care from intake to independence.
                </p>
              </div>
              <div className="lg:col-span-5 rounded-xl bg-muted/40 p-7">
                <p className="text-xs uppercase tracking-wide text-terracotta mb-3">Care Pathway</p>
                <p className="text-sm text-foreground leading-relaxed">
                  Intake and safety stabilization. Then clinical support, education continuity, and practical life-skills. Finally, structured reintegration with ongoing follow-up.
                </p>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-20 lg:py-24 bg-muted/30">
        <div className="max-w-5xl mx-auto px-6">
          <RevealOnScroll>
            <h2 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight text-foreground mb-5">Why This Matters</h2>
            <p className="text-muted-foreground leading-relaxed max-w-3xl">
              Rescue is only the beginning. Healing takes time, safety, and consistent care. Without long-term support, many girls are pushed back toward the same conditions they were rescued from.
              <br />
              <br />
              North Star Sanctuary exists to ensure that rescue leads to restoration - not relapse.
            </p>
          </RevealOnScroll>
        </div>
      </section>

      <section className="py-20 lg:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight text-foreground mb-8">Where Your Support Goes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { amount: "$50", detail: "Counseling sessions" },
              { amount: "$150", detail: "Education & supplies" },
              { amount: "$500", detail: "Monthly housing support" },
              { amount: "$1,000", detail: "Full care for one resident" },
            ].map((row) => (
              <div key={row.amount} className="rounded-xl bg-muted/40 p-5 transition-all duration-300 ease-out hover:-translate-y-1">
                <p className="font-display text-2xl font-bold text-terracotta">{row.amount}</p>
                <p className="text-sm text-muted-foreground mt-1">{row.detail}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">Representative examples of how donations are used.</p>
        </div>
      </section>

      <section className="py-20 lg:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight text-foreground mb-8">Impact Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
            {statsLoading
              ? [1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-10 w-24 rounded-md" />
                    <Skeleton className="h-4 w-32 rounded-md" />
                  </div>
                ))
              : [
                  {
                    label: "Residents Served",
                    value: homeStats?.totalResidents ?? null,
                    suffix: "",
                  },
                  {
                    label: "Safehouses",
                    value: homeStats?.totalSafehouses ?? null,
                    suffix: "",
                  },
                  {
                    label: "% Reintegrated",
                    value: homeStats?.reintegrationRatePercent ?? null,
                    suffix: "%",
                  },
                  {
                    label: "Counseling Sessions",
                    value: homeStats?.counselingSessionsCount ?? null,
                    suffix: "",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="font-display text-4xl font-semibold tracking-tight text-foreground">
                      <AnimatedCount value={item.value} suffix={item.suffix} fallback="--" />
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
                  </div>
                ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            All figures come from the live database (public stats API). If the request fails, values show as &quot;--&quot;.
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight text-foreground mb-8">Updates From the Field</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {fromFieldFallback.map((item) => (
              <article key={item.id} className="rounded-xl overflow-hidden bg-muted/40 transition-all duration-300 ease-out hover:-translate-y-1">
                <div className="h-40 bg-muted" />
                <div className="p-6">
                  <p className="text-xs uppercase tracking-wide text-terracotta mb-2">{item.date}</p>
                  <h3 className="font-medium text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.story}</p>
                </div>
              </article>
            ))}
          </div>
          <PublicSafetyNote className="mt-5" />
        </div>
      </section>

      <section className="py-24 lg:py-28 gradient-navy-deep text-navy-foreground">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-semibold tracking-tight mb-5">Be Part of Her Story</h2>
          <p className="text-navy-foreground/65 max-w-2xl mx-auto mb-8">
            Help create a future beyond survival. Your support helps move each girl from crisis to safety, and from safety to long-term independence.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-full bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 gap-2 h-12 px-7 transition-all duration-300 ease-out hover:scale-[1.02]">
              <Link to="/donate">
                <Heart className="w-4 h-4" />
                Donate
              </Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-full bg-navy-foreground/12 text-navy-foreground hover:bg-navy-foreground/18 h-12 px-7 transition-all duration-300 ease-out hover:scale-[1.02]">
              <Link to="/get-involved">Get Involved</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Index;
