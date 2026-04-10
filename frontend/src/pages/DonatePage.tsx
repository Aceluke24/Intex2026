import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Heart, CheckCircle, TrendingUp } from "lucide-react";
import { API_BASE } from "@/lib/apiBase";
import { PublicSafetyNote } from "@/components/PublicSafetyNote";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function DonatePage() {
  const ANONYMOUS_FIRST_NAME = "Anonymous";
  const ANONYMOUS_LAST_NAME = "Donor";
  const ANONYMOUS_EMAIL = "anonymous@donor.com";

  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [amount, setAmount] = useState("");
  const [noteOptions, setNoteOptions] = useState<string[]>([]);
  const [selectedNote, setSelectedNote] = useState("");
  const [purposeLoadError, setPurposeLoadError] = useState<string | null>(null);
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
    const fetchPurposes = async () => {
      console.log("Fetching purposes...");
      try {
        const res = await fetch(`${API_BASE}/api/donations/purposes`);
        if (!res.ok) {
          throw new Error("Unable to load donation purpose options.");
        }
        const data: unknown = await res.json();
        console.log("Purposes:", data);
        const sanitized = Array.isArray(data)
          ? data
              .filter((x): x is string => typeof x === "string")
              .map((x) => x.trim())
              .filter((x) => x.length > 0)
          : [];

        setNoteOptions(sanitized);
        setPurposeLoadError(
          sanitized.length === 0
            ? "No preset purposes found. You can enter one manually."
            : null,
        );
      } catch (err) {
        console.error("Failed to load note options", err);
        setNoteOptions([]);
        setPurposeLoadError("Unable to load preset purposes right now.");
      }
    };

    fetchPurposes();
  }, []);

  const emailFromForm = !isAuthenticated || anonymous;

  const parseApiErrorMessage = (raw: string, status: number): string => {
    const fallback =
      "Something went wrong processing your donation. Please try again or contact support.";
    if (!raw.trim()) {
      if (status === 402) {
        return "Payment could not be completed. Please try again or use a different method.";
      }
      return fallback;
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const err = parsed.error ?? parsed.message ?? parsed.title;
      const detail = typeof parsed.detail === "string" ? parsed.detail : null;
      if (typeof err === "string" && err.trim()) {
        return err.trim();
      }
      if (detail?.trim()) {
        return detail.trim();
      }
    } catch {
      /* not JSON */
    }
    if (raw.length < 400 && raw.trim()) {
      return raw.trim();
    }
    return fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (
      Number.isNaN(parsedAmount) ||
      parsedAmount < 1 ||
      !/^\d+(\.\d{1,2})?$/.test(amount)
    ) {
      setError("Enter a valid amount (minimum $1, max 2 decimal places).");
      setSubmitting(false);
      return;
    }

    const noteLower = selectedNote.toLowerCase();
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();
    const displayFromForm =
      trimmedFirst || trimmedLast
        ? [trimmedFirst, trimmedLast].filter(Boolean).join(" ").trim()
        : null;

    if (!anonymous) {
      if (!trimmedFirst || !trimmedLast) {
        setError("Please enter your first and last name.");
        setSubmitting(false);
        return;
      }

      const effectiveEmail = emailFromForm ? trimmedEmail : user?.email?.trim() ?? "";
      if (!effectiveEmail) {
        setError("Please enter your email address.");
        setSubmitting(false);
        return;
      }

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveEmail);
      if (!emailOk) {
        setError("Please enter a valid email address.");
        setSubmitting(false);
        return;
      }
    }

    const payload: Record<string, unknown> = {
      firstName: anonymous ? ANONYMOUS_FIRST_NAME : trimmedFirst,
      lastName: anonymous ? ANONYMOUS_LAST_NAME : trimmedLast,
      email: anonymous
        ? ANONYMOUS_EMAIL
        : emailFromForm
          ? trimmedEmail
          : (user?.email?.trim() ?? ""),
      displayName: anonymous ? `${ANONYMOUS_FIRST_NAME} ${ANONYMOUS_LAST_NAME}` : displayFromForm,
      isAnonymous: anonymous,
      userId: user?.id ?? null,
      supporterId: user?.supporterId ?? null,
      supporter_id: user?.supporterId ?? null,
      donation_type: "Monetary",
      donation_date: new Date().toISOString().split("T")[0],
      channel_source: "Direct",
      currency_code: "PHP",
      amount: parsedAmount,
      estimated_value: parsedAmount,
      impact_unit: "pesos",
      is_recurring: noteLower.includes("monthly") || noteLower.includes("recurring"),
      campaign_name: noteLower.includes("campaign") ? selectedNote : null,
      notes: selectedNote || null,
    };

    try {
      const res = await fetch(`${API_BASE}/api/public/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(parseApiErrorMessage(text, res.status));
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong processing your donation. Please try again or contact support.",
      );
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
              {!isAuthenticated && (
                <div className="mt-6 rounded-xl bg-background/90 p-5 shadow-sm text-left">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-3">
                      <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" aria-hidden />
                      <div>
                        <p className="font-body text-sm font-semibold text-foreground">
                          Track your impact
                        </p>
                        <p className="mt-1 font-body text-sm text-muted-foreground leading-relaxed">
                          Create an account to track your donations and see the lives you&apos;re impacting.
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                      <Button
                        type="button"
                        onClick={() => navigate("/signup?redirect=/donate")}
                        className="rounded-xl bg-terracotta px-5 font-body font-medium text-terracotta-foreground shadow-sm hover:bg-terracotta/90"
                      >
                        Create Account
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/login?redirect=/donate")}
                        className="rounded-xl border-border/80 bg-background/80 font-body font-medium"
                      >
                        Sign In
                      </Button>
                    </div>
                  </div>
                  <p className="mt-4 font-body text-xs text-muted-foreground">
                    You can still donate without an account.
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <>
              {!authLoading && !isAuthenticated && (
                <div className="mb-6 rounded-xl bg-background/90 p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-terracotta">
                        <TrendingUp className="h-5 w-5" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-base font-semibold tracking-tight text-foreground">
                          Track your impact
                        </p>
                        <p className="mt-1 font-body text-sm text-muted-foreground leading-relaxed">
                          Create an account to track your donations and see the lives you&apos;re impacting.
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                      <Button
                        type="button"
                        onClick={() => navigate("/signup?redirect=/donate")}
                        className="rounded-xl bg-terracotta px-5 font-body font-medium text-terracotta-foreground shadow-sm hover:bg-terracotta/90"
                      >
                        Create Account
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/login?redirect=/donate")}
                        className="rounded-xl border-border/80 bg-background/80 font-body font-medium"
                      >
                        Sign In
                      </Button>
                    </div>
                  </div>
                  <p className="mt-4 font-body text-xs text-muted-foreground">
                    You can still donate without an account.
                  </p>
                </div>
              )}

              <motion.form
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                onSubmit={handleSubmit}
                className="bg-background/90 rounded-xl p-8 sm:p-10 space-y-6 shadow-sm"
              >
                {!authLoading && (
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-2 font-body text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={anonymous}
                        onChange={(e) => setAnonymous(e.target.checked)}
                        className="h-4 w-4 rounded border-input text-terracotta focus:ring-terracotta/50"
                      />
                      Donate anonymously
                    </label>
                    {anonymous && (
                      <p className="font-body text-xs text-muted-foreground pl-6">
                        Anonymous donations will not store your personal information.
                      </p>
                    )}
                  </div>
                )}

              {/* Name row */}
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-300 ease-out${
                  anonymous ? " opacity-50" : ""
                }`}
              >
                <div>
                  <label className="block font-body text-[13px] font-medium text-foreground mb-1.5">
                    First name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    disabled={anonymous}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={anonymous ? readOnlyInputClass : editableInputClass}
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
                    disabled={anonymous}
                    onChange={(e) => setLastName(e.target.value)}
                    className={anonymous ? readOnlyInputClass : editableInputClass}
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Email */}
              {!anonymous && (
                <div className="transition-all duration-300 ease-out">
                  <label className="block font-body text-[13px] font-medium text-foreground mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled={!emailFromForm}
                    onChange={(e) => setEmail(e.target.value)}
                    className={!emailFromForm ? readOnlyInputClass : editableInputClass}
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
                    type="number"
                    step="0.01"
                    min="1"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Allow empty input
                      if (value === "") {
                        setAmount("");
                        return;
                      }

                      // Numbers with up to 2 decimal places
                      const regex = /^\d+(\.\d{0,2})?$/;

                      if (regex.test(value)) {
                        setAmount(value);
                      }
                    }}
                    onBlur={() => {
                      if (amount) {
                        const formatted = parseFloat(amount).toFixed(2);
                        setAmount(formatted);
                      }
                    }}
                    required
                    className="w-full rounded-xl border border-input bg-background py-2.5 pl-8 pr-4 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="100.00"
                  />
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block font-body text-[13px] font-medium text-foreground mb-1.5">
                  Purpose of Donation (optional)
                </label>
                {noteOptions.length > 0 ? (
                  <select
                    value={selectedNote}
                    onChange={(e) => setSelectedNote(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select purpose (optional)</option>
                    {noteOptions.map((note, index) => (
                      <option key={`${note}-${index}`} value={note}>
                        {note}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Enter donation purpose (optional)"
                    value={selectedNote}
                    onChange={(e) => setSelectedNote(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                )}
                {purposeLoadError && (
                  <p className="mt-2 text-xs text-muted-foreground">{purposeLoadError}</p>
                )}
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
            </>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
