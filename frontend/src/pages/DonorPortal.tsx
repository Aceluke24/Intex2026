import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/lib/theme";
import { BrandLogo } from "@/components/BrandLogo";
import { Moon, Sun, LogOut, ExternalLink, Heart, Calendar, Tag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "@/lib/apiBase";

interface Donation {
  donationId: number;
  donationType: string;
  donationDate: string;
  amount: number | null;
  estimatedValue: number | null;
  impactUnit: string | null;
  campaignName: string | null;
  channelSource: string;
  isRecurring: boolean;
  notes: string | null;
}

const typeColors: Record<string, string> = {
  Monetary: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  InKind: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Time: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  Skills: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  SocialMedia: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
};

export default function DonorPortal() {
  const { user, refetch } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Donation form state
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("Monetary");
  const [formAmount, setFormAmount] = useState("");
  const [formCampaign, setFormCampaign] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const loadDonations = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/donations/mine`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load donations.");
        setDonations(await res.json());
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDonations(); }, []);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    try {
      const body: Record<string, unknown> = {
        donationType: formType,
        campaignName: formCampaign || null,
        notes: formNotes || null,
      };
      if (formType === "Monetary") {
        body.amount = parseFloat(formAmount) || 0;
      } else {
        body.estimatedValue = parseFloat(formAmount) || null;
        body.impactUnit = "hours";
      }
      const res = await fetch(`${API_BASE}/api/donations/self`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to submit donation.");
      }
      setShowForm(false);
      setFormAmount("");
      setFormCampaign("");
      setFormNotes("");
      loadDonations();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
    await refetch();
    navigate("/login");
  };

  const totalMonetary = donations
    .filter((d) => d.donationType === "Monetary" && d.amount != null)
    .reduce((sum, d) => sum + (d.amount ?? 0), 0);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const formatValue = (d: Donation) => {
    if (d.donationType === "Monetary" && d.amount != null)
      return `₱${d.amount.toLocaleString()}`;
    if (d.estimatedValue != null && d.impactUnit)
      return `${d.estimatedValue.toLocaleString()} ${d.impactUnit}`;
    return "—";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" aria-label="North Star Sanctuary — Home">
            <BrandLogo variant="compact" />
            <span className="font-display text-sm font-semibold text-foreground">North Star Sanctuary</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground font-body text-xs"
              onClick={handleLogout}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">
            Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
          </h1>
          <p className="font-body text-sm text-muted-foreground">
            Thank you for your support. Here's a summary of your contributions.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="rounded-2xl bg-card border border-border/50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-terracotta" />
              <span className="font-body text-xs text-muted-foreground uppercase tracking-wider">Total Donations</span>
            </div>
            <p className="font-display text-2xl font-bold text-foreground">{donations.length}</p>
          </div>
          <div className="rounded-2xl bg-card border border-border/50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-terracotta" />
              <span className="font-body text-xs text-muted-foreground uppercase tracking-wider">Monetary Given</span>
            </div>
            <p className="font-display text-2xl font-bold text-foreground">
              {totalMonetary > 0 ? `₱${totalMonetary.toLocaleString()}` : "—"}
            </p>
          </div>
          <div className="rounded-2xl bg-card border border-border/50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-terracotta" />
              <span className="font-body text-xs text-muted-foreground uppercase tracking-wider">Recurring Gifts</span>
            </div>
            <p className="font-display text-2xl font-bold text-foreground">
              {donations.filter((d) => d.isRecurring).length}
            </p>
          </div>
        </div>

        {/* Impact link */}
        <div className="rounded-2xl bg-terracotta/8 border border-terracotta/20 p-5 flex items-center justify-between mb-10">
          <div>
            <p className="font-body text-sm font-medium text-foreground mb-0.5">See your impact in action</p>
            <p className="font-body text-xs text-muted-foreground">View our public impact dashboard to see how donations are changing lives.</p>
          </div>
          <Link to="/impact">
            <Button size="sm" variant="outline" className="gap-1.5 font-body text-xs shrink-0">
              View Impact <ExternalLink className="w-3 h-3" />
            </Button>
          </Link>
        </div>

        {/* Make a Donation */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Make a Donation</h2>
            {!showForm && (
              <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 font-body text-xs bg-terracotta text-terracotta-foreground hover:bg-terracotta/90">
                <Plus className="w-3.5 h-3.5" /> Donate
              </Button>
            )}
          </div>
          {showForm && (
            <div ref={formRef} className="rounded-2xl bg-card border border-border/50 p-6">
              <form onSubmit={handleDonate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-xs text-muted-foreground block mb-1">Donation Type</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-terracotta/40"
                    >
                      <option value="Monetary">Monetary (₱)</option>
                      <option value="Time">Time (hours)</option>
                      <option value="Skills">Skills</option>
                      <option value="InKind">In-Kind</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-body text-xs text-muted-foreground block mb-1">
                      {formType === "Monetary" ? "Amount (₱)" : "Estimated Value / Hours"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder={formType === "Monetary" ? "e.g. 500" : "e.g. 4"}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-terracotta/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-body text-xs text-muted-foreground block mb-1">Campaign (optional)</label>
                  <select
                    value={formCampaign}
                    onChange={(e) => setFormCampaign(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-terracotta/40"
                  >
                    <option value="">No campaign</option>
                    <option value="Year-End Hope">Year-End Hope</option>
                    <option value="Back to School">Back to School</option>
                    <option value="Summer of Safety">Summer of Safety</option>
                    <option value="GivingTuesday">GivingTuesday</option>
                  </select>
                </div>
                <div>
                  <label className="font-body text-xs text-muted-foreground block mb-1">Notes (optional)</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={2}
                    placeholder="Any message with your donation…"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-terracotta/40 resize-none"
                  />
                </div>
                {formError && <p className="font-body text-xs text-red-500">{formError}</p>}
                <div className="flex items-center gap-3 pt-1">
                  <Button type="submit" disabled={formSubmitting} size="sm" className="bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 font-body text-xs">
                    {formSubmitting ? "Submitting…" : "Submit Donation"}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setFormError(null); }} className="font-body text-xs text-muted-foreground">
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Donation history */}
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">Donation History</h2>
        {loading && (
          <p className="font-body text-sm text-muted-foreground">Loading your donations…</p>
        )}
        {error && (
          <p className="font-body text-sm text-red-500">{error}</p>
        )}
        {!loading && !error && donations.length === 0 && (
          <div className="rounded-2xl bg-card border border-border/50 p-10 text-center">
            <p className="font-body text-sm text-muted-foreground">No donation history found.</p>
            <p className="font-body text-xs text-muted-foreground/60 mt-1">
              If you've donated, make sure your account is linked to your supporter profile.
            </p>
          </div>
        )}
        {!loading && !error && donations.length > 0 && (
          <div className="space-y-3">
            {donations.map((d) => (
              <div key={d.donationId} className="rounded-2xl bg-card border border-border/50 p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-body font-medium ${typeColors[d.donationType] ?? "bg-secondary text-foreground"}`}>
                      {d.donationType}
                    </span>
                    {d.isRecurring && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-body font-medium bg-secondary text-muted-foreground">
                        Recurring
                      </span>
                    )}
                    {d.campaignName && (
                      <span className="font-body text-xs text-muted-foreground truncate">{d.campaignName}</span>
                    )}
                  </div>
                  <p className="font-body text-xs text-muted-foreground">{formatDate(d.donationDate)} · {d.channelSource}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-base font-semibold text-foreground">{formatValue(d)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
