import { AdminLayout } from "@/components/AdminLayout";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { apiFetchJson } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";
import { motion } from "framer-motion";
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
import { Eye, TrendingUp, Gift, Share2, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OutreachStatCard } from "@/components/outreach/OutreachStatCard";
import type { OutreachStatTrend } from "@/components/outreach/OutreachStatCard";
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
  kpis: Kpis;
  /** Omitted on older API builds; trends default to no baseline. */
  previousMonthKpis?: PreviousMonthKpis;
  byPlatform: PlatformRow[];
  byPostType: PostTypeRow[];
  posts: Post[];
  filterOptions: FilterOptions;
};

function monthOverMonthTrend(current: number, previous: number): OutreachStatTrend | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) {
    return current > 0 ? { label: "↑ new vs last month", direction: "up" } : null;
  }
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 0.05) {
    return { label: "→ 0% vs last month", direction: "flat" };
  }
  const arrow = pct > 0 ? "↑" : "↓";
  const sign = pct > 0 ? "+" : "";
  return {
    label: `${arrow} ${sign}${pct.toFixed(1)}% vs last month`,
    direction: pct > 0 ? "up" : "down",
  };
}

function parsePostCreatedAt(p: Post): Date {
  const raw = p.createdAt ?? p.date;
  const dayPart = String(raw).split("T")[0] ?? "";
  const [y, m, d] = dayPart.split("-").map((v) => parseInt(v, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m)) return new Date(NaN);
  return new Date(y, m - 1, Number.isFinite(d) ? d : 1);
}

function computeOutreachKpisFromPosts(posts: Post[]) {
  const now = new Date();
  const cy = now.getFullYear();
  const cm = now.getMonth();
  const prevAnchor = new Date(cy, cm, 1);
  prevAnchor.setMonth(prevAnchor.getMonth() - 1);
  const py = prevAnchor.getFullYear();
  const pm = prevAnchor.getMonth();

  const inMonth = (p: Post, year: number, month: number) => {
    const d = parsePostCreatedAt(p);
    return !Number.isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() === month;
  };

  const thisMonth = posts.filter((p) => inMonth(p, cy, cm));
  const prevMonth = posts.filter((p) => inMonth(p, py, pm));

  const reach = thisMonth.reduce((sum, p) => sum + (p.reach || 0), 0);
  const engagementRate =
    thisMonth.length > 0
      ? thisMonth.reduce((sum, p) => sum + Number(p.engagementRate || 0), 0) / thisMonth.length
      : 0;
  const referrals = thisMonth.reduce((sum, p) => sum + (p.donationReferrals || 0), 0);
  const donationValue = thisMonth.reduce(
    (sum, p) => sum + Number(p.estimatedDonationValuePhp || 0),
    0
  );

  return {
    reach,
    engagementRate,
    referrals,
    donationValue,
    previous: {
      reach: prevMonth.reduce((sum, p) => sum + (p.reach || 0), 0),
      engagementRate:
        prevMonth.length > 0
          ? prevMonth.reduce((sum, p) => sum + Number(p.engagementRate || 0), 0) / prevMonth.length
          : 0,
      referrals: prevMonth.reduce((sum, p) => sum + (p.donationReferrals || 0), 0),
      donationValue: prevMonth.reduce(
        (sum, p) => sum + Number(p.estimatedDonationValuePhp || 0),
        0
      ),
    },
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

  const kpiFromPosts = useMemo(
    () => (data ? computeOutreachKpisFromPosts(data.posts) : null),
    [data]
  );

  return (
    <AdminLayout contentClassName="max-w-7xl">
      <div className="space-y-8">
        {/* KPI Cards — computed client-side from posts (calendar month); not filtered by table filters */}
        <section className="space-y-3">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <motion.div
            className="grid grid-cols-2 gap-4 lg:grid-cols-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <OutreachStatCard
              label="Reach This Month"
              icon={Eye}
              loading={loading}
              value={kpiFromPosts ? kpiFromPosts.reach.toLocaleString("en-US") : "0"}
              trend={
                kpiFromPosts
                  ? monthOverMonthTrend(kpiFromPosts.reach, kpiFromPosts.previous.reach)
                  : null
              }
            />
            <OutreachStatCard
              label="Avg Engagement Rate"
              icon={TrendingUp}
              loading={loading}
              value={
                kpiFromPosts ? `${(kpiFromPosts.engagementRate * 100).toFixed(2)}%` : "0.00%"
              }
              trend={
                kpiFromPosts
                  ? monthOverMonthTrend(
                      kpiFromPosts.engagementRate,
                      kpiFromPosts.previous.engagementRate
                    )
                  : null
              }
            />
            <OutreachStatCard
              label="Donation Referrals"
              icon={Share2}
              loading={loading}
              value={kpiFromPosts ? kpiFromPosts.referrals.toLocaleString("en-US") : "0"}
              trend={
                kpiFromPosts
                  ? monthOverMonthTrend(kpiFromPosts.referrals, kpiFromPosts.previous.referrals)
                  : null
              }
            />
            <OutreachStatCard
              label="Est. Donation Value"
              icon={Gift}
              loading={loading}
              value={kpiFromPosts ? formatUSD(kpiFromPosts.donationValue) : formatUSD(0)}
              trend={
                kpiFromPosts
                  ? monthOverMonthTrend(
                      kpiFromPosts.donationValue,
                      kpiFromPosts.previous.donationValue
                    )
                  : null
              }
            />
          </motion.div>
        </section>

        {/* Charts */}
        {data && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* By Platform */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-semibold text-base text-foreground mb-4">Engagement by Platform</h3>
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
            </section>

            {/* By Post Type */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-semibold text-base text-foreground mb-4">Performance by Post Type</h3>
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
            </section>
          </div>
        )}

        {/* Posts Table */}
        {data && (
          <section>
            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <h2 className="font-display font-semibold text-lg text-foreground mr-2">Posts</h2>
              <select
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
              >
                <option value="">All Platforms</option>
                {data.filterOptions.platforms.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Post Types</option>
                {data.filterOptions.postTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {data.filterOptions.campaigns.length > 0 && (
                <select
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={filterCampaign}
                  onChange={(e) => setFilterCampaign(e.target.value)}
                >
                  <option value="">All Campaigns</option>
                  {data.filterOptions.campaigns.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>

            <div className="rounded-2xl border border-border overflow-hidden">
              {data.posts.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm">No posts found.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {["Platform", "Type", "Date", "Reach", "Likes", "Engagement", "Referrals", "Est. Value", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.posts.map((p) => (
                      <tr key={p.postId} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                            style={{ background: PLATFORM_COLORS[p.platform] ?? "#888" }}
                          >
                            {p.platform}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{p.postType}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{p.date}</td>
                        <td className="px-4 py-3 text-foreground">{p.reach.toLocaleString()}</td>
                        <td className="px-4 py-3 text-muted-foreground">{p.likes.toLocaleString()}</td>
                        <td className="px-4 py-3 text-muted-foreground">{(p.engagementRate * 100).toFixed(2)}%</td>
                        <td className="px-4 py-3 text-muted-foreground">{p.donationReferrals}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{formatUSD(p.estimatedDonationValuePhp)}</td>
                        <td className="px-4 py-3">
                          {p.postUrl ? (
                            <a href={p.postUrl} target="_blank" rel="noreferrer" className="text-sidebar-primary hover:underline">
                              <ExternalLink className="w-3.5 h-3.5" />
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
      </div>
    </AdminLayout>
  );
}
