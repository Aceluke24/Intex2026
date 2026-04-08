import { useState } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Heart, CheckCircle } from "lucide-react";
import { API_BASE } from "@/lib/apiBase";
import { PublicSafetyNote } from "@/components/PublicSafetyNote";

const DONATION_TYPES = ["Monetary", "InKind", "Time", "Skills", "SocialMedia"] as const;

export default function DonatePage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [donationType, setDonationType] = useState<string>("Monetary");
  const [amount, setAmount] = useState("");
  const [campaign, setCampaign] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body: Record<string, unknown> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      donationType,
      campaignName: campaign.trim() || null,
      notes: notes.trim() || null,
    };

    if (donationType === "Monetary") {
      const parsed = parseFloat(amount);
      if (!parsed || parsed <= 0) {
        setError("Please enter a valid donation amount.");
        setSubmitting(false);
        return;
      }
      body.amount = parsed;
    } else {
      body.estimatedValue = parseFloat(amount) || null;
    }

    try {
      const res = await fetch(`${API_BASE}/api/public/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      <section className="relative min-h-screen pt-28 pb-20 sm:pt-32 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 gradient-cream-warm" />

        <div className="relative max-w-2xl mx-auto px-6">
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
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
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
              <div key={item.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
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
              className="bg-card border border-border rounded-2xl p-10 text-center"
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
              className="bg-card border border-border rounded-2xl p-8 sm:p-10 space-y-6"
            >
              {/* Name row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-[13px] font-medium text-foreground mb-1.5">
                    First name <span className="text-terracotta">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className="block font-body text-[13px] font-medium text-foreground mb-1.5">
                    Last name <span className="text-terracotta">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block font-body text-[13px] font-medium text-foreground mb-1.5">
                  Email <span className="text-terracotta">*</span>
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="jane@example.com"
                />
              </div>

              {/* Donation type */}
              <div>
                <label className="block font-body text-[13px] font-medium text-foreground mb-1.5">
                  Contribution type
                </label>
                <div className="flex flex-wrap gap-2">
                  {DONATION_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDonationType(t)}
                      className={`px-4 py-1.5 rounded-full font-body text-[13px] font-medium border transition-all duration-200 ${
                        donationType === t
                          ? "bg-terracotta text-terracotta-foreground border-terracotta"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 bg-background"
                      }`}
                    >
                      {t === "InKind" ? "In-Kind" : t === "SocialMedia" ? "Social Media" : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block font-body text-[13px] font-medium text-foreground mb-1.5">
                  {donationType === "Monetary" ? "Amount (USD)" : "Estimated value (optional)"}
                  {donationType === "Monetary" && <span className="text-terracotta"> *</span>}
                </label>
                <div className="relative">
                  {donationType === "Monetary" && (
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-sm text-muted-foreground">$</span>
                  )}
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.]?[0-9]*"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required={donationType === "Monetary"}
                    className={`w-full rounded-xl border border-input bg-background py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                      donationType === "Monetary" ? "pl-8 pr-4" : "px-4"
                    }`}
                    placeholder={donationType === "Monetary" ? "100.00" : "Optional estimated value"}
                  />
                </div>
              </div>

              {/* Campaign */}
              <div>
                <label className="block font-body text-[13px] font-medium text-foreground mb-1.5">
                  Campaign / Program (optional)
                </label>
                <input
                  type="text"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. Safe Housing Fund"
                />
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
                className="w-full rounded-xl bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 font-body font-medium h-11 gap-2"
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
