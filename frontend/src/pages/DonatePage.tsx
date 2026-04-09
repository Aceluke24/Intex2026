import { useEffect, useMemo, useState } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Heart, CheckCircle } from "lucide-react";
import { API_BASE } from "@/lib/apiBase";
import { PublicSafetyNote } from "@/components/PublicSafetyNote";
import { useAuth } from "@/contexts/AuthContext";

export default function DonatePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [amount, setAmount] = useState("");
  const [campaign, setCampaign] = useState("");
  const [campaigns, setCampaigns] = useState<string[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const readOnlyInputClass =
    "w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground cursor-not-allowed focus:outline-none";
  const editableInputClass =
    "w-full rounded-xl border border-input bg-background px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setEmail(user.email ?? "");
  }, [isAuthenticated, user]);

  useEffect(() => {
    const loadCampaigns = async () => {
      setCampaignsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/campaigns`);
        if (!res.ok) {
          throw new Error("Unable to load campaigns right now.");
        }
        const data: unknown = await res.json();
        setCampaigns(Array.isArray(data) ? data.filter((x): x is string => typeof x === "string") : []);
      } catch {
        setCampaigns([]);
      } finally {
        setCampaignsLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  const canEditIdentity = useMemo(
    () => !isAuthenticated || anonymous,
    [anonymous, isAuthenticated],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError("Please enter a valid donation amount.");
      setSubmitting(false);
      return;
    }

    const body: Record<string, unknown> = {
      firstName: canEditIdentity ? firstName.trim() || null : user?.firstName ?? null,
      lastName: canEditIdentity ? lastName.trim() || null : user?.lastName ?? null,
      email: canEditIdentity ? email.trim() || null : user?.email ?? null,
      displayName: !canEditIdentity ? [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || user?.email : null,
      isAnonymous: anonymous,
      donationType: "Monetary",
      amount: parsed,
      campaignName: campaign.trim() || null,
      notes: notes.trim() || null,
    };

    try {
      const res = await fetch(`${API_BASE}/api/public/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Submission failed. Please try again.");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <section className="relative min-h-screen pt-8 pb-20 sm:pt-10 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 gradient-cream-warm" />

        <div className="relative max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Heart className="w-5 h-5 text-terracotta" />
              <p className="font-body text-[11px] font-medium uppercase tracking-[0.2em] text-terracotta">
                Give Today
              </p>
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-semibold tracking-tight text-foreground mb-4">
              How Your Gift Makes an Impact
            </h1>
            <p className="font-body text-base text-muted-foreground leading-relaxed mb-10">
              Your contribution helps fund housing, education, health support, and expansion into underserved regions.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {[
              { title: "Housing", text: "Safe homes, daily care, and stable living environments." },
              { title: "Education", text: "School placement, tutoring, and life-skills development." },
              { title: "Health", text: "Counseling, trauma recovery, and medical coordination." },
              { title: "Expansion", text: "New regional partnerships and increased capacity." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-background/70 p-5 transition-all duration-300 ease-out hover:-translate-y-1">
                <h2 className="font-semibold text-foreground mb-1">{item.title}</h2>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
          <PublicSafetyNote className="mb-8" />

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-background/90 rounded-xl p-10 text-center"
            >
              <CheckCircle className="w-12 h-12 text-sage mx-auto mb-4" />
              <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
                Thank You!
              </h2>
              <p className="font-body text-muted-foreground">
                Your generous contribution has been recorded. We'll be in touch soon.
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              onSubmit={handleSubmit}
              className="bg-background/90 rounded-xl p-8 sm:p-10 space-y-6 shadow-sm"
            >
              {!authLoading && (
                <label className="flex items-center gap-2 font-body text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="h-4 w-4 rounded border-input text-terracotta focus:ring-terracotta/50"
                  />
                  Donate anonymously
                </label>
              )}

              {/* Name row */}
              {!anonymous && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-300 ease-out">
                  <div>
                    <label className="block font-body text-[13px] font-medium text-foreground mb-1.5">
                      First name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      disabled={!canEditIdentity}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={!canEditIdentity ? readOnlyInputClass : editableInputClass}
                      placeholder="Jane"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-[13px] font-medium text-foreground mb-1.5">
                      Last name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      disabled={!canEditIdentity}
                      onChange={(e) => setLastName(e.target.value)}
                      className={!canEditIdentity ? readOnlyInputClass : editableInputClass}
                      placeholder="Doe"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              {!anonymous && (
                <div className="transition-all duration-300 ease-out">
                  <label className="block font-body text-[13px] font-medium text-foreground mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled={!canEditIdentity}
                    onChange={(e) => setEmail(e.target.value)}
                    className={!canEditIdentity ? readOnlyInputClass : editableInputClass}
                    placeholder="jane@example.com"
                  />
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block font-body text-[13px] font-medium text-foreground mb-1.5">
                  Amount (USD) <span className="text-terracotta"> *</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-sm text-muted-foreground">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.]?[0-9]*"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full rounded-xl border border-input bg-background py-2.5 pl-8 pr-4 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="100.00"
                  />
                </div>
              </div>

              {/* Campaign */}
              <div>
                <label className="block font-body text-[13px] font-medium text-foreground mb-1.5">
                  Campaign / Program (optional)
                </label>
                <select
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a campaign (optional)</option>
                  {campaigns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {campaignsLoading && (
                  <p className="mt-1 font-body text-xs text-muted-foreground">Loading campaigns…</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block font-body text-[13px] font-medium text-foreground mb-1.5">
                  Message (optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Share why you're giving..."
                />
              </div>

              {error && (
                <p className="font-body text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 font-body font-medium h-11 gap-2 transition-all duration-300 ease-out hover:scale-[1.01]"
              >
                <Heart className="w-4 h-4" />
                {submitting ? "Submitting…" : "Submit Donation"}
              </Button>
            </motion.form>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
