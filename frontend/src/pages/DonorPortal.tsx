import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PublicLayout } from "@/components/PublicLayout";
import { ExternalLink, Heart, Calendar, Tag, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetchJson } from "@/lib/apiFetch";
import { formatUSD } from "@/lib/currency";
import { toTitleCase } from "@/lib/utils";

interface Donation {
  donationId: number;
  donationType: string;
  donationTypeId: number | null;
  donationTypeName: string | null;
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

function donorWelcomeName(user: { firstName: string | null; lastName: string | null; email: string } | null | undefined) {
  if (!user) return "";
  const fromProfile = [user.firstName, user.lastName]
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .join(" ");
  const raw = fromProfile || user.email?.split("@")[0] || "";
  return toTitleCase(raw);
}

export default function DonorPortal() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const donatePath = "/donate";

  const loadDonations = () => {
    setLoading(true);
    apiFetchJson<Donation[]>(`/api/donations/mine`)
      .then((items) => setDonations(Array.isArray(items) ? items : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDonations(); }, []);

  const lifetimeGiving = donations
    .filter((d) => d.donationType === "Monetary" && d.amount != null)
    .reduce((sum, d) => sum + (d.amount ?? 0), 0);

  const giftsCount = donations.length;
  const lastGift = donations[0] ?? null;
  const campaignBreakdown = donations.reduce<Record<string, number>>((acc, donation) => {
    if (!donation.campaignName) return acc;
    if (donation.donationType !== "Monetary" || donation.amount == null) return acc;
    acc[donation.campaignName] = (acc[donation.campaignName] ?? 0) + donation.amount;
    return acc;
  }, {});

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const welcomeName = donorWelcomeName(user);

  const formatValue = (d: Donation) => {
    if (d.donationType === "Monetary" && d.amount != null)
      return formatUSD(d.amount);
    if (d.estimatedValue != null && d.impactUnit)
      return `${d.estimatedValue.toLocaleString()} ${d.impactUnit}`;
    return "—";
  };

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-1">
              Welcome back{welcomeName ? `, ${welcomeName}` : ""}
            </h1>
            <p className="font-body text-sm text-muted-foreground">
              Thank you for your support. Here's a summary of your contributions.
            </p>
          </div>
          <Link
            to="/mfa-setup"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-gray-100 shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
            {user?.mfaEnabled ? "2FA Enabled" : "Enable 2FA"}
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="rounded-2xl bg-card border border-border/50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-terracotta" />
              <span className="font-body text-xs text-muted-foreground uppercase tracking-wider">Total Donated</span>
            </div>
            <p className="font-display text-2xl font-bold text-foreground">
              {lifetimeGiving > 0 ? formatUSD(lifetimeGiving) : formatUSD(0)}
            </p>
          </div>
          <div className="rounded-2xl bg-card border border-border/50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-terracotta" />
              <span className="font-body text-xs text-muted-foreground uppercase tracking-wider">Contributions Made</span>
            </div>
            <p className="font-display text-2xl font-bold text-foreground">{giftsCount}</p>
          </div>
          <div className="rounded-2xl bg-card border border-border/50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-terracotta" />
              <span className="font-body text-xs text-muted-foreground uppercase tracking-wider">Most Recent Contribution</span>
            </div>
            <p className="font-display text-2xl font-bold text-foreground">
              {lastGift ? formatValue(lastGift) : "—"}
            </p>
            <p className="font-body text-xs text-muted-foreground mt-1">
              {lastGift ? formatDate(lastGift.donationDate) : "No contributions yet"}
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
        <div className="mb-10 rounded-2xl bg-card border border-border/50 p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Make a Donation</h2>
            <p className="font-body text-sm text-muted-foreground mt-1">
              Use the main donation form to submit your next contribution.
            </p>
          </div>
          <Link to={donatePath}>
            <Button size="sm" className="font-body text-xs bg-terracotta text-terracotta-foreground hover:bg-terracotta/90">
              Go to Donate
            </Button>
          </Link>
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
                    {d.donationTypeName && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-body font-medium bg-secondary text-foreground">
                        {d.donationTypeName}
                      </span>
                    )}
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

        {!loading && !error && Object.keys(campaignBreakdown).length > 0 && (
          <>
            <h2 className="font-display text-lg font-semibold text-foreground mt-10 mb-4">Campaign Breakdown</h2>
            <div className="space-y-2">
              {Object.entries(campaignBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([name, total]) => (
                  <div key={name} className="rounded-2xl bg-card border border-border/50 px-4 py-3 flex items-center justify-between">
                    <p className="font-body text-sm text-foreground">{name}</p>
                    <p className="font-body text-sm font-semibold text-foreground">{formatUSD(total)}</p>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
}
