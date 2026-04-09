import { AdminLayout } from "@/components/AdminLayout";
import {
  DASHBOARD_CONTENT_MAX_WIDTH,
  DashboardGlassPanel,
  DashboardSectionHeader,
  dashboardFilterBarClass,
  dashboardPanelEyebrowClass,
  dashboardPanelSubtitleClass,
  dashboardTableBodyClass,
  dashboardTableCellClass,
  dashboardTableHeadCellClass,
  dashboardTableHeadRowClass,
  dashboardTableRowClass,
  dashboardTableShellClass,
} from "@/components/dashboard-shell";
import { StaffPageShell } from "@/components/staff/StaffPageShell";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { apiFetchJson } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Eye, TrendingUp, Gift, Megaphone, Share2, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { OutreachStatCard } from "@/components/outreach/OutreachStatCard";
import { formatUSD, formatUSDCompactThousands } from "@/lib/currency";

const softTooltip = {
  contentStyle: {
    borderRadius: "12px",
    border: "1px solid hsl(36 25% 90%)",
    boxShadow: "0 8px 32px rgba(45,35,48,0.08)",
    fontSize: "12px",
    color: "hsl(213 15% 18%)",
  },
};

type Kpis = {
  totalReachThisMonth: number;
  avgEngagementRateThisMonth: number;
  donationReferralsThisMonth: number;
  estimatedDonationValueThisMonth: number;
};

type PreviousMonthKpis = {
  totalReach: number;
  avgEngagementRate: number;
  donationReferrals: number;
  estimatedDonationValue: number;
};

type PlatformRow = {
  platform: string;
  totalReach: number;
  avgEngagementRate: number;
  postCount: number;
  totalDonationReferrals: number;
  estimatedDonationValue: number;
};

type PostTypeRow = {
  postType: string;
  totalReach: number;
  avgEngagementRate: number;
  estimatedDonationValue: number;
  postCount: number;
};

type Post = {
  postId: number;
  platform: string;
  postType: string;
  mediaType: string | null;
  date: string;
  createdAt?: string;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  donationReferrals: number;
  estimatedDonationValuePhp: number;
  campaignName: string | null;
  isBoosted: boolean;
  postUrl: string | null;
};

type FilterOptions = {
  platforms: string[];
  postTypes: string[];
  campaigns: string[];
};

type OutreachData = {
  kpis?: Kpis;
  /** Omitted on older API builds; trends default to no baseline. */
  previousMonthKpis?: PreviousMonthKpis;
  byPlatform: PlatformRow[];
  byPostType: PostTypeRow[];
  posts: Post[];
  filterOptions: FilterOptions;
};

type HeadlineStats = {
  reach: number;
  engagementRate: number;
  referrals: number;
  donationValue: number;
  postsCount: number;
};

type NormalizedPostRow = {
  reach: number;
  engagement_rate: number;
  donation_referrals: number;
  estimated_donation_value_php: number;
  created_at: unknown;
};

/** Same-origin + auth as the rest of the admin app; no query string so stats are not narrowed by table filters. */
async function getSocialMediaPosts(): Promise<OutreachData> {
  return apiFetchJson<OutreachData>(`${API_PREFIX}/outreach`);
}

function normalizeOutreachPosts(raw: unknown[]): NormalizedPostRow[] {
  return raw.map((row) => {
    const p = row as Record<string, unknown>;
    return {
      reach: Number(p.reach ?? p.impressions ?? 0) || 0,
      engagement_rate: Number(p.engagement_rate ?? p.engagementRate ?? 0) || 0,
      donation_referrals:
        Number(p.donation_referrals ?? p.donationReferrals ?? p.referrals ?? 0) || 0,
      estimated_donation_value_php:
        Number(
          p.estimated_donation_value_php ??
            p.estimatedDonationValuePhp ??
            p.donationValue ??
            0
        ) || 0,
      created_at: p.created_at ?? p.createdAt ?? p.date,
    };
  });
}

/** Full-database aggregates (no month filter); matches how the API builds `byPlatform`. */
function headlineStatsFromByPlatform(rows: PlatformRow[]): HeadlineStats | null {
  if (!rows.length) return null;
  const postCount = rows.reduce((s, r) => s + r.postCount, 0);
  if (postCount <= 0) return null;
  const reach = rows.reduce((s, r) => s + r.totalReach, 0);
  const referrals = rows.reduce((s, r) => s + r.totalDonationReferrals, 0);
  const donationValue = rows.reduce((s, r) => s + r.estimatedDonationValue, 0);
  const engagementRate =
    rows.reduce((s, r) => s + r.avgEngagementRate * r.postCount, 0) / postCount;
  return { reach, engagementRate, referrals, donationValue, postsCount: postCount };
}

function headlineStatsFromNormalizedPosts(dataset: NormalizedPostRow[]): HeadlineStats | null {
  if (!dataset.length) return null;
  const reach = dataset.reduce((sum, p) => sum + p.reach, 0);
  const engagementRate =
    dataset.reduce((sum, p) => sum + p.engagement_rate, 0) / dataset.length;
  const referrals = dataset.reduce((sum, p) => sum + p.donation_referrals, 0);
  const donationValue = dataset.reduce((sum, p) => sum + p.estimated_donation_value_php, 0);
  return {
    reach,
    engagementRate,
    referrals,
    donationValue,
    postsCount: dataset.length,
  };
}

const PLATFORM_COLORS: Record<string, string> = {
  Facebook: "#1877f2",
  Instagram: "#e1306c",
  Twitter: "#1da1f2",
  TikTok: "#010101",
  LinkedIn: "#0a66c2",
  YouTube: "#ff0000",
  WhatsApp: "#25d366",
};

export default function OutreachPage() {
  usePageHeader("Social Media & Outreach", "Campaign engagement & donation referrals");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OutreachData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [headlineStats, setHeadlineStats] = useState<HeadlineStats | null>(null);
  const [headlineLoading, setHeadlineLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCampaign, setFilterCampaign] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterPlatform) params.set("platform", filterPlatform);
      if (filterType) params.set("postType", filterType);
      if (filterCampaign) params.set("campaign", filterCampaign);
      const d = await apiFetchJson<OutreachData>(`${API_PREFIX}/outreach?${params}`);
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filterPlatform, filterType, filterCampaign]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    let cancelled = false;
    async function loadHeadlineStats() {
      setHeadlineLoading(true);
      try {
        const payload = await getSocialMediaPosts();
        const posts = payload.posts;
        console.log("PROD POSTS:", posts);

        const dataset = normalizeOutreachPosts(posts);
        // Prefer API platform rollups (all posts); sample `posts` is capped at 100.
        let next: HeadlineStats | null =
          headlineStatsFromByPlatform(payload.byPlatform) ??
          headlineStatsFromNormalizedPosts(dataset);

        if (!next || next.postsCount <= 0) {
          console.warn("No social media data returned");
          return;
        }

        if (!cancelled) setHeadlineStats(next);
      } catch (err) {
        console.error("Outreach headline stats failed", err);
      } finally {
        if (!cancelled) setHeadlineLoading(false);
      }
    }
    void loadHeadlineStats();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminLayout contentClassName={DASHBOARD_CONTENT_MAX_WIDTH}>
      <StaffPageShell
        tone="quiet"
        eyebrow="Outreach"
        eyebrowIcon={<Megaphone className="h-3.5 w-3.5 text-[hsl(340_38%_52%)]" strokeWidth={1.5} />}
        title="Social Media & Outreach"
        description="Campaign reach, engagement, and estimated donation impact from social channels."
      >
        {error ? (
          <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <section className="mb-12 space-y-4 xl:mb-16">
          <p className="font-body text-xs tabular-nums text-muted-foreground" aria-live="polite">
            Posts in aggregate sample: {headlineLoading ? "…" : headlineStats ? headlineStats.postsCount : "—"}
          </p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <OutreachStatCard
              label="Total Reach"
              icon={Eye}
              loading={headlineLoading}
              value={headlineStats ? headlineStats.reach.toLocaleString("en-US") : "0"}
              trend={null}
            />
            <OutreachStatCard
              label="Avg Engagement Rate"
              icon={TrendingUp}
              loading={headlineLoading}
              value={
                headlineStats
                  ? `${(headlineStats.engagementRate * 100).toFixed(2)}%`
                  : "0.00%"
              }
              trend={null}
            />
            <OutreachStatCard
              label="Donation Referrals"
              icon={Share2}
              loading={headlineLoading}
              value={
                headlineStats ? headlineStats.referrals.toLocaleString("en-US") : "0"
              }
              trend={null}
            />
            <OutreachStatCard
              label="Est. Donation Value"
              icon={Gift}
              loading={headlineLoading}
              value={
                headlineStats ? formatUSD(headlineStats.donationValue) : formatUSD(0)
              }
              trend={null}
            />
          </div>
        </section>

        {data && (
          <div className="mb-12 grid gap-8 lg:grid-cols-2">
            <DashboardGlassPanel>
              <p className={dashboardPanelEyebrowClass}>Platforms</p>
              <p className={dashboardPanelSubtitleClass}>Engagement by channel</p>
              <div className="mt-6">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.byPlatform}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(36 25% 90%)" />
                  <XAxis dataKey="platform" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="reach" orientation="left" tick={{ fontSize: 10 }} tickFormatter={(v: number) => formatUSDCompactThousands(v)} />
                  <YAxis yAxisId="rate" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
                  <Tooltip {...softTooltip} formatter={(v: number, name: string) =>
                    name === "avgEngagementRate" ? `${(v * 100).toFixed(2)}%` : v.toLocaleString()
                  } />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="reach" dataKey="totalReach" name="Total Reach" fill="#c8877a" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="rate" dataKey="avgEngagementRate" name="Avg Engagement Rate" fill="#a09090" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </DashboardGlassPanel>

            <DashboardGlassPanel>
              <p className={dashboardPanelEyebrowClass}>Content</p>
              <p className={dashboardPanelSubtitleClass}>Performance by post type</p>
              <div className="mt-6">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.byPostType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(36 25% 90%)" />
                  <XAxis dataKey="postType" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => formatUSDCompactThousands(v)} />
                  <Tooltip {...softTooltip} formatter={(v: number, name: string) => (name === "estimatedDonationValue" ? formatUSD(v) : v.toLocaleString())} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="totalReach" name="Total Reach" fill="#c8877a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="estimatedDonationValue" name="Est. Donation $" fill="#d4a5a0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </DashboardGlassPanel>
          </div>
        )}

        {data && (
          <section className="mb-6">
            <DashboardSectionHeader
              icon={Share2}
              eyebrow="Content library"
              title="Posts"
              description="Filter the outreach feed; totals above use an unfiltered aggregate where available."
            />
            <div className={`mb-6 flex flex-wrap items-end gap-3 ${dashboardFilterBarClass}`}>
              <select
                className="min-w-[140px] rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 font-body text-sm dark:border-white/10 dark:bg-white/10"
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
              >
                <option value="">All Platforms</option>
                {data.filterOptions.platforms.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <select
                className="min-w-[140px] rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 font-body text-sm dark:border-white/10 dark:bg-white/10"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Post Types</option>
                {data.filterOptions.postTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {data.filterOptions.campaigns.length > 0 && (
                <select
                  className="min-w-[140px] rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 font-body text-sm dark:border-white/10 dark:bg-white/10"
                  value={filterCampaign}
                  onChange={(e) => setFilterCampaign(e.target.value)}
                >
                  <option value="">All Campaigns</option>
                  {data.filterOptions.campaigns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className={dashboardTableShellClass}>
              {data.posts.length === 0 ? (
                <div className="p-12 text-center font-body text-sm text-muted-foreground">No posts found.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className={dashboardTableHeadRowClass}>
                    <tr>
                      {["Platform", "Type", "Date", "Reach", "Likes", "Engagement", "Referrals", "Est. Value", ""].map((h) => (
                        <th key={h} className={dashboardTableHeadCellClass}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={dashboardTableBodyClass}>
                    {data.posts.map((p) => (
                      <tr key={p.postId} className={dashboardTableRowClass}>
                        <td className={dashboardTableCellClass}>
                          <span
                            className="rounded-full px-2 py-0.5 font-body text-xs font-medium text-white"
                            style={{ background: PLATFORM_COLORS[p.platform] ?? "#888" }}
                          >
                            {p.platform}
                          </span>
                        </td>
                        <td className={`${dashboardTableCellClass} font-body text-xs text-muted-foreground`}>{p.postType}</td>
                        <td className={`${dashboardTableCellClass} whitespace-nowrap text-muted-foreground`}>{p.date}</td>
                        <td className={dashboardTableCellClass}>{p.reach.toLocaleString()}</td>
                        <td className={`${dashboardTableCellClass} text-muted-foreground`}>{p.likes.toLocaleString()}</td>
                        <td className={`${dashboardTableCellClass} text-muted-foreground`}>
                          {(p.engagementRate * 100).toFixed(2)}%
                        </td>
                        <td className={`${dashboardTableCellClass} text-muted-foreground`}>{p.donationReferrals}</td>
                        <td className={`${dashboardTableCellClass} font-medium`}>{formatUSD(p.estimatedDonationValuePhp)}</td>
                        <td className={dashboardTableCellClass}>
                          {p.postUrl ? (
                            <a
                              href={p.postUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex text-sidebar-primary hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}
      </StaffPageShell>
    </AdminLayout>
  );
}
