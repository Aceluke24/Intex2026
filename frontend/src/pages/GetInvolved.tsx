import { PublicLayout } from "@/components/PublicLayout";
import { PublicSafetyNote } from "@/components/PublicSafetyNote";

export default function GetInvolved() {
  return (
    <PublicLayout>
      <section className="pt-28 pb-16 sm:pt-32 lg:pt-36 gradient-cream-warm">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-terracotta mb-4">Get Involved</p>
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-bold text-foreground leading-[1.12] mb-5">
            Join the work beyond giving
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            Your time, skills, and voice can help create safe, sustainable support systems for girls rebuilding their lives.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-background">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-semibold text-foreground mb-2">Volunteer Opportunities</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Support events, mentorship pathways, community partnerships, and outreach coordination based on local needs.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-semibold text-foreground mb-2">Skill-Based Contributions</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Contribute professional expertise in education, counseling support, legal aid, training, communications, or operations.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-semibold text-foreground mb-2">Social Media Advocacy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Share verified updates, fundraising campaigns, and awareness resources to help connect more supporters to the mission.
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6">
          <PublicSafetyNote className="mt-5" />
        </div>
      </section>
    </PublicLayout>
  );
}
