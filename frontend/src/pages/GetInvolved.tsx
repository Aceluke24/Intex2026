import { PublicLayout } from "@/components/PublicLayout";
import { PublicSafetyNote } from "@/components/PublicSafetyNote";
import { useState } from "react";
import { API_BASE } from "@/lib/apiBase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function GetInvolved() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Please enter your email.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/public/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const payload = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) {
        throw new Error(payload?.message || "Could not complete signup.");
      }
      toast.success(payload?.message || "You are now on the updates list.");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not complete signup.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <section className="pt-8 pb-16 sm:pt-10 lg:pt-12 gradient-cream-warm">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-terracotta mb-4">Get Involved</p>
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-semibold tracking-tight text-foreground leading-[1.12] mb-5">
            Join the work beyond giving
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            Your time, skills, and voice can help create safe, sustainable support systems for girls rebuilding their lives.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-background">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-xl bg-muted/40 p-6 transition-all duration-300 ease-out hover:-translate-y-1">
            <h2 className="font-semibold text-foreground mb-2">Volunteer Opportunities</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Support events, mentorship pathways, community partnerships, and outreach coordination based on local needs.
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 p-6 transition-all duration-300 ease-out hover:-translate-y-1">
            <h2 className="font-semibold text-foreground mb-2">Skill-Based Contributions</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Contribute professional expertise in education, counseling support, legal aid, training, communications, or operations.
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 p-6 transition-all duration-300 ease-out hover:-translate-y-1">
            <h2 className="font-semibold text-foreground mb-2">Social Media Advocacy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Share verified updates, fundraising campaigns, and awareness resources to help connect more supporters to the mission.
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-8">
          <div className="rounded-xl border border-border bg-muted/30 p-6 md:p-8">
            <h2 className="font-semibold text-foreground mb-2">Stay Connected</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Join our updates list for volunteer opportunities, campaign launches, and ways to support.
            </p>
            <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11"
                required
              />
              <Button type="submit" className="h-11" disabled={submitting}>
                {submitting ? "Joining..." : "Join"}
              </Button>
            </form>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6">
          <PublicSafetyNote className="mt-5" />
        </div>
      </section>
    </PublicLayout>
  );
}
