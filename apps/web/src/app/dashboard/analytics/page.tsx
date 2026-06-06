import { prisma } from "@repo/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FeedbackReceivedChart } from "@/components/AnalyticsCharts";
import type { DailyCount } from "@/components/AnalyticsCharts";
import { AnalyticsControls } from "@/components/AnalyticsControls";
import { OperationalZonesChart } from "@/components/OperationalZonesChart";
import type { ZoneTagBar } from "@/components/OperationalZonesChart";
import { ReviewCTA } from "@/components/ReviewCTA";
import { UnmappedInsightsPanel } from "@/components/UnmappedInsightsPanel";
import { getActiveBusiness } from "@/lib/active-business";

export const dynamic = "force-dynamic";

type Range = "30d" | "90d" | "180d" | "all";

function getDateRange(range: Range): Date | null {
  const now = new Date();
  switch (range) {
    case "30d":  { const d = new Date(now); d.setDate(d.getDate() - 30); return d; }
    case "90d":  { const d = new Date(now); d.setDate(d.getDate() - 90); return d; }
    case "180d": { const d = new Date(now); d.setDate(d.getDate() - 180); return d; }
    case "all":  return null;
  }
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function buildDailyCounts(
  rows: { date: Date }[],
  since: Date
): DailyCount[] {
  // Build a map of date string → count
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = formatDate(row.date);
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  // Fill every day in the range so the chart has no gaps
  const result: DailyCount[] = [];
  const cursor = new Date(since);
  const today = new Date();
  while (cursor <= today) {
    const key = formatDate(cursor);
    result.push({ date: key, count: map.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

function buildTagDeltas(
  current: { tags: string[] }[],
  previous: { tags: string[] }[],
): Record<string, number> {
  const count = (rows: { tags: string[] }[]) => {
    const map = new Map<string, number>();
    for (const row of rows) {
      for (const tag of row.tags) {
        map.set(tag, (map.get(tag) ?? 0) + 1);
      }
    }
    return map;
  };
  const curr = count(current);
  const prev = count(previous);
  const deltas: Record<string, number> = {};
  for (const [tag, c] of curr) {
    const p = prev.get(tag) ?? 0;
    if (p === 0) continue; // no baseline — skip, don't show pill
    const pct = Math.round(((c - p) / p) * 100);
    if (pct !== 0) deltas[tag] = pct;
  }
  return deltas;
}

function buildZoneTagBars(
  rows: { tags: string[]; negativeTags: string[] }[],
  zoneMap: Record<string, string>
): ZoneTagBar[] {
  const positive = new Map<string, number>();
  const negative = new Map<string, number>();

  for (const row of rows) {
    const negSet = new Set(row.negativeTags);
    for (const tag of row.tags) {
      if (!zoneMap[tag]) continue; // skip tags not in any zone
      const map = negSet.has(tag) ? negative : positive;
      map.set(tag, (map.get(tag) ?? 0) + 1);
    }
  }

  const allTags = new Set([...positive.keys(), ...negative.keys()]);
  const result: ZoneTagBar[] = [];
  for (const tag of allTags) {
    const pos = positive.get(tag) ?? 0;
    const neg = negative.get(tag) ?? 0;
    if (pos + neg > 0) {
      result.push({ tag, zone: zoneMap[tag], positive: pos, negative: neg });
    }
  }
  return result.sort((a, b) => (b.positive + b.negative) - (a.positive + a.negative));
}

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const { range: rawRange } = await searchParams;
  const range: Range =
    rawRange === "30d" || rawRange === "90d" || rawRange === "180d" || rawRange === "all"
      ? rawRange
      : "30d";

  const since = getDateRange(range);

  // Analytics is built on AI-analyzed DB data, so it targets the active business's DB row.
  // For a freshly linked live business these will be empty until a sync/analysis job exists.
  const { businessId: DEV_BUSINESS_ID } = await getActiveBusiness();

  const now = new Date();
  const prevSince = since
    ? new Date(since.getTime() - (now.getTime() - since.getTime()))
    : null;

  const [feedback, googleReviews, prevFeedback, prevGoogleReviews, pendingAnalysis, totalAnalyzed, oldestAnalyzedAt, formConfig, business, allInsightRows] = await Promise.all([
    prisma.anonymousFeedback.findMany({
      where: { businessId: DEV_BUSINESS_ID, ...(since ? { createdAt: { gte: since } } : {}) },
      select: { createdAt: true, rating: true, tags: true, negativeTags: true, source: true },
      orderBy: { createdAt: "asc" },
    }),
    // Google Reviews in range — for zone chart tags
    prisma.review.findMany({
      where: { businessId: DEV_BUSINESS_ID, ...(since ? { publishedAt: { gte: since } } : {}) },
      select: { rating: true, tags: true, negativeTags: true, publishedAt: true },
    }),
    // Previous period — anonymous feedback (no prev period for all-time)
    prevSince && since
      ? prisma.anonymousFeedback.findMany({
          where: { businessId: DEV_BUSINESS_ID, createdAt: { gte: prevSince, lt: since } },
          select: { tags: true },
        })
      : Promise.resolve([]),
    // Previous period — Google reviews
    prevSince && since
      ? prisma.review.findMany({
          where: { businessId: DEV_BUSINESS_ID, publishedAt: { gte: prevSince, lt: since } },
          select: { tags: true },
        })
      : Promise.resolve([]),
    // Count ALL un-analyzed records (Reviews + AnonymousFeedback) with text
    Promise.all([
      prisma.review.count({ where: { businessId: DEV_BUSINESS_ID, analyzedAt: null, text: { not: null } } }),
      prisma.anonymousFeedback.count({ where: { businessId: DEV_BUSINESS_ID, analyzedAt: null, text: { not: null } } }),
    ]).then(([r, f]) => r + f),
    // Count already-analyzed records (for re-analyze option)
    Promise.all([
      prisma.review.count({ where: { businessId: DEV_BUSINESS_ID, analyzedAt: { not: null } } }),
      prisma.anonymousFeedback.count({ where: { businessId: DEV_BUSINESS_ID, analyzedAt: { not: null } } }),
    ]).then(([r, f]) => r + f),
    // Oldest analyzedAt across both tables — used to detect taxonomy staleness
    Promise.all([
      prisma.review.findFirst({
        where: { businessId: DEV_BUSINESS_ID, analyzedAt: { not: null } },
        orderBy: { analyzedAt: "asc" },
        select: { analyzedAt: true },
      }),
      prisma.anonymousFeedback.findFirst({
        where: { businessId: DEV_BUSINESS_ID, analyzedAt: { not: null } },
        orderBy: { analyzedAt: "asc" },
        select: { analyzedAt: true },
      }),
    ]).then(([r, f]) => {
      const dates = [r?.analyzedAt, f?.analyzedAt].filter(Boolean) as Date[];
      return dates.length > 0 ? dates.reduce((a, b) => (a < b ? a : b)) : null;
    }),
    prisma.formConfig.findUnique({
      where: { businessId: DEV_BUSINESS_ID },
      include: { categories: { orderBy: { order: "asc" } } },
    }),
    prisma.business.findUnique({
      where: { id: DEV_BUSINESS_ID },
      select: { name: true },
    }),
    // All unmapped insights across both tables (all-time, not range-filtered)
    Promise.all([
      prisma.review.findMany({
        where: { businessId: DEV_BUSINESS_ID, analyzedAt: { not: null } },
        select: { unmappedInsights: true },
      }),
      prisma.anonymousFeedback.findMany({
        where: { businessId: DEV_BUSINESS_ID, analyzedAt: { not: null } },
        select: { unmappedInsights: true },
      }),
    ]).then(([reviews, feedback]) => {
      const freq = new Map<string, number>();
      for (const row of [...reviews, ...feedback]) {
        for (const insight of row.unmappedInsights) {
          const key = insight.trim().toLowerCase();
          if (key) freq.set(key, (freq.get(key) ?? 0) + 1);
        }
      }
      return Array.from(freq.entries())
        .map(([text, count]) => ({ text, count }))
        .sort((a, b) => b.count - a.count);
    }),
  ]);

  // Build zone map + order dynamically from DB categories
  const zoneOrder = formConfig?.categories.map((c) => c.name) ?? [];
  const dynamicZoneMap: Record<string, string> = {};
  for (const cat of formConfig?.categories ?? []) {
    for (const chip of [...cat.positiveChips, ...cat.negativeChips]) {
      dynamicZoneMap[chip] = cat.name;
    }
  }

  // Detect if taxonomy was updated after some reviews were analyzed
  const latestCategoryUpdate = formConfig?.categories.reduce<Date | null>(
    (max, cat) => (!max || cat.updatedAt > max ? cat.updatedAt : max),
    null
  );
  const taxonomyChanged =
    !!oldestAnalyzedAt &&
    !!latestCategoryUpdate &&
    latestCategoryUpdate > oldestAnalyzedAt;

  const allDates = [
    ...feedback.map((f) => f.createdAt),
    ...googleReviews.map((r) => r.publishedAt),
  ];
  const chartSince = since ?? (allDates.length > 0 ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : new Date());
  const dailyCounts = buildDailyCounts(
    allDates.map((date) => ({ date })),
    chartSince
  );
  // Merge anonymous feedback + Google review tags for the zones chart
  const allTaggedRows = [
    ...feedback.map((f) => ({ tags: f.tags, negativeTags: f.negativeTags })),
    ...googleReviews.map((r) => ({ tags: r.tags, negativeTags: r.negativeTags })),
  ];
  const zoneBars = buildZoneTagBars(allTaggedRows, dynamicZoneMap);

  // Real period-over-period deltas
  const deltas = buildTagDeltas(
    [...feedback, ...googleReviews],
    [...prevFeedback, ...prevGoogleReviews],
  );

  // Stats from all sources: anonymous feedback + Google reviews
  const allReviewsInRange = [
    ...feedback.map((f) => ({ rating: f.rating, source: f.source })),
    ...googleReviews.map((r) => ({ rating: r.rating, source: "google" as string })),
  ];
  const totalFeedback = allReviewsInRange.length;
  const googleRedirects = feedback.filter((f) => f.source === "google_redirect").length;
  const googleReviewCount = googleReviews.length;
  const privateCount = feedback.filter((f) => f.source === "private").length;
  const avgRating =
    totalFeedback > 0
      ? (allReviewsInRange.reduce((s, r) => s + r.rating, 0) / totalFeedback).toFixed(1)
      : "—";

  const RANGE_LABELS: Record<Range, string> = {
    "30d":  "Last 30 days",
    "90d":  "Last 90 days",
    "180d": "Last 180 days",
    "all":  "All time",
  };

  return (
    <main className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Gamified CTA */}
      <ReviewCTA
        unreadCount={pendingAnalysis}
        businessId={DEV_BUSINESS_ID}
        totalAnalyzed={totalAnalyzed}
        taxonomyChanged={taxonomyChanged}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-sm mt-1 text-muted-foreground">
            {RANGE_LABELS[range]} · {business?.name ?? "aahaa Indisches Restaurant"}
          </p>
        </div>
        <AnalyticsControls currentRange={range} />
      </div>

      <Separator />

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Reviews", value: totalFeedback },
          { label: "Google Reviews", value: googleReviewCount },
          { label: "Form → Google", value: googleRedirects },
          { label: "Avg Rating", value: avgRating },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feedback received chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">Feedback Received</CardTitle>
          <p className="text-xs text-muted-foreground">Daily reviews received (Google + form submissions)</p>
        </CardHeader>
        <CardContent>
          <FeedbackReceivedChart data={dailyCounts} />
        </CardContent>
      </Card>

      {/* Operational Zones chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">Operational Zones</CardTitle>
          <p className="text-xs text-muted-foreground">
            Tags grouped by operational area · Click any bar to see customer quotes
          </p>
        </CardHeader>
        <CardContent>
          <OperationalZonesChart data={zoneBars} businessId={DEV_BUSINESS_ID} zoneOrder={zoneOrder} deltas={deltas} />
        </CardContent>
      </Card>

      {/* Unmapped Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">Unmapped Insights</CardTitle>
          <p className="text-xs text-muted-foreground">
            Patterns found in reviews that fall outside your defined taxonomy · darker = more frequent
          </p>
        </CardHeader>
        <CardContent>
          <UnmappedInsightsPanel insights={allInsightRows} businessId={DEV_BUSINESS_ID} />
        </CardContent>
      </Card>
    </main>
  );
}

