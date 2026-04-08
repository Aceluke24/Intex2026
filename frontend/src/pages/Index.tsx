import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { PublicSafetyNote } from "@/components/PublicSafetyNote";
import { Home, HeartPulse, HandHeart, Heart, BarChart3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "@/lib/apiBase";

type ImpactSummary = {
  survivors: number;
  totalDonations: number;
  activePrograms: number;
  completionRate: number;
};

type HomeStats = {
  residentsServed: number | null;
  safehouses: number | null;
  reintegratedPct: number | null;
  counselingSessions: number | null;
};

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

const getNullableNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const Index = () => {
  const [summary, setSummary] = useState<ImpactSummary | null>(null);
  const [residentCount, setResidentCount] = useState<number | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setDataError(null);
        const [residentRes, summaryRes] = await Promise.all([
          fetch(`${API_BASE}/api/public/residents/count`),
          fetch(`${API_BASE}/api/public/impact/summary`),
        ]);

        if (residentRes.ok) {
          const residentJson = await residentRes.json().catch(() => ({}));
          setResidentCount(getNullableNumber(residentJson.count));
        }

        if (summaryRes.ok) {
          const summaryJson = await summaryRes.json().catch(() => ({}));
          setSummary({
            survivors: getNullableNumber(summaryJson.survivors) ?? 0,
            totalDonations: getNullableNumber(summaryJson.totalDonations) ?? 0,
            activePrograms: getNullableNumber(summaryJson.activePrograms) ?? 0,
            completionRate: getNullableNumber(summaryJson.completionRate) ?? 0,
          });
        }

        if (!residentRes.ok && !summaryRes.ok) {
          setDataError("Live impact data is temporarily unavailable. Showing prepared content.");
        }
      } catch (error) {
        console.error("[Index]", error);
        setDataError("Live impact data is temporarily unavailable. Showing prepared content.");
      }
    };
    load();
  }, []);

  const stats: HomeStats = useMemo(
    () => ({
      residentsServed: residentCount ?? getNullableNumber(summary?.survivors),
      safehouses: getNullableNumber(summary?.activePrograms),
      reintegratedPct: getNullableNumber(summary?.completionRate),
      counselingSessions: getNullableNumber(summary?.totalDonations) !== null
        ? Math.max(0, Math.round((summary?.totalDonations ?? 0) / 50))
        : null,
    }),
    [residentCount, summary]
  );

  return (
    <PublicLayout>
      <section className="relative overflow-hidden gradient-hero text-navy-foreground pt-28 pb-20 sm:pt-32 sm:pb-24 lg:pt-40 lg:pb-28">
        <div className="max-w-6xl mx-auto px-6">
          {dataError && (
            <div className="mb-8 rounded-xl border border-navy-foreground/25 bg-navy-foreground/10 px-4 py-3 text-sm">
              {dataError}
            </div>
          )}
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-terracotta mb-5">North Star Sanctuary</p>
          <h1 className="font-display text-[clamp(2rem,5vw,4.5rem)] font-bold leading-[1.08] max-w-4xl mb-5">
            A Safe Place to Heal. A Path to Freedom.
          </h1>
          <p className="text-base sm:text-lg text-navy-foreground/70 max-w-3xl leading-relaxed mb-10">
            North Star Sanctuary provides safe housing, rehabilitation, and long-term support for girls escaping trafficking and abuse in vulnerable regions of India.
          </p>
          <div className="flex flex-wrap gap-3 mb-12">
            <Button asChild className="rounded-full bg-terracotta text-terracotta-foreground hover:bg-terracotta/90">
              <Link to="/donate">Donate Now</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-full bg-navy-foreground/12 text-navy-foreground hover:bg-navy-foreground/18">
              <Link to="/impact">See Our Impact</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: "Safe Housing", icon: Home },
              { title: "Trauma-Informed Care", icon: HeartPulse },
              { title: "Long-Term Reintegration", icon: HandHeart },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-navy-foreground/15 bg-navy-foreground/5 p-5 shadow-sm">
                <item.icon className="w-5 h-5 text-terracotta mb-3" />
                <p className="font-medium">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-24 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-6">What We Do</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            We operate secure, confidential safe homes in high-risk regions of India, providing:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {[
              "Emergency shelter",
              "Counseling and trauma recovery",
              "Education and life skills",
              "Reintegration support",
            ].map((line) => (
              <li key={line} className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm">
                {line}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            Every girl receives individualized care from intake to independence.
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-24 gradient-section-blush">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-5">Why This Matters</h2>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            Every year, thousands of girls are rescued from trafficking and abuse - but rescue is only the beginning. Without long-term care, many are at risk of returning to the same conditions.
            <br />
            <br />
            North Star Sanctuary exists to ensure that rescue leads to restoration - not relapse.
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-8">Where Your Support Goes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { amount: "$50", detail: "Counseling sessions" },
              { amount: "$150", detail: "Education & supplies" },
              { amount: "$500", detail: "Monthly housing support" },
              { amount: "$1,000", detail: "Full care for one resident" },
            ].map((row) => (
              <div key={row.amount} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="font-display text-2xl font-bold text-terracotta">{row.amount}</p>
                <p className="text-sm text-muted-foreground mt-1">{row.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-24 gradient-cream-warm">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-8">Impact Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Residents Served",
                value: stats.residentsServed !== null ? stats.residentsServed.toLocaleString() : "500+",
              },
              {
                label: "Safehouses",
                value: stats.safehouses !== null ? stats.safehouses.toLocaleString() : "4",
              },
              {
                label: "% Reintegrated",
                value: stats.reintegratedPct !== null ? `${stats.reintegratedPct}%` : "78%",
              },
              {
                label: "Counseling Sessions",
                value: stats.counselingSessions !== null ? stats.counselingSessions.toLocaleString() : "2,500+",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="font-display text-2xl font-bold text-foreground">{item.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Stats are shown from available public data endpoints when possible, with graceful placeholders when data is unavailable.
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-8">Updates From the Field</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {fromFieldFallback.map((item) => (
              <article key={item.id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="h-40 bg-secondary flex items-center justify-center">
                  <BarChart3 className="w-7 h-7 text-muted-foreground" />
                </div>
                <div className="p-5">
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

      <section className="py-20 lg:py-24 gradient-navy-deep text-navy-foreground">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-bold mb-5">Be Part of Her Story</h2>
          <p className="text-navy-foreground/65 max-w-2xl mx-auto mb-8">
            Your support helps move each girl from crisis to safety, and from safety to long-term independence.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-full bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 gap-2">
              <Link to="/donate">
                <Heart className="w-4 h-4" />
                Donate
              </Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-full bg-navy-foreground/12 text-navy-foreground hover:bg-navy-foreground/18">
              <Link to="/get-involved">Get Involved</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Index;
