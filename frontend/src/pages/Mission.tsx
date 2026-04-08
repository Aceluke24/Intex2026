import { PublicLayout } from "@/components/PublicLayout";
import { PublicSafetyNote } from "@/components/PublicSafetyNote";

const values = [
  "Protection First",
  "Dignity & Respect",
  "Long-Term Healing",
  "Accountability & Transparency",
  "Sustainability",
  "Local Partnerships",
] as const;

export default function Mission() {
  return (
    <PublicLayout>
      <section className="pt-28 pb-16 sm:pt-32 lg:pt-36 gradient-cream-warm">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-terracotta mb-4">Mission & Values</p>
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-bold text-foreground leading-[1.12] mb-5">
            Mission
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            We provide safe housing, holistic rehabilitation, and a path to independence for girls rescued from trafficking and abuse.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-6">Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {values.map((value) => (
              <div key={value} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="font-medium text-foreground">{value}</p>
              </div>
            ))}
          </div>
          <PublicSafetyNote className="mt-5" />
        </div>
      </section>
    </PublicLayout>
  );
}
