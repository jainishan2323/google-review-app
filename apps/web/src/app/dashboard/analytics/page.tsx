import { prisma } from "@repo/db";
import { resolveLabel } from "@repo/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ReviewVolumeChart } from "@/components/AnalyticsCharts";
import type { MonthlyVolumePoint } from "@/components/AnalyticsCharts";
import {
  StatsStrip,
  OverallSentimentPanel,
  TopTagsPanel,
  GrowthPill,
} from "@/components/analysis/AnalyticsSummary";
import { AnalyticsControls } from "@/components/AnalyticsControls";
import { OperationalZonesChart } from "@/components/OperationalZonesChart";
import type { ZoneTagBar } from "@/components/OperationalZonesChart";
import { ReviewCTA } from "@/components/ReviewCTA";
import { UnmappedInsightsPanel } from "@/components/UnmappedInsightsPanel";
import { ComingSoon } from "@/components/ComingSoon";
import { requireCurrentBusiness } from "@/lib/current-business";

export const dynamic = "force-dynamic";

// Feature flag: the review-analytics dashboard (sentiment, operational zones,
// unmapped insights) is gated off by default — it depends on analysed reviews and
// the broader Google connection isn't shipped yet. When off, the page falls back
// to the "coming soon" placeholder. Mirror this with the sidebar's `soon` badge.
const ANALYTICS_ENABLED = process.env.NEXT_PUBLIC_ANALYTICS === "true";

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

/**
 * Bucket combined reviews + feedback into months, split by sentiment (rating ≥4
 * positive, <4 negative) with a per-month average rating for the overlay line.
 * Window: the months spanning `since`→now, or the last 12 months for all-time.
 */
function buildMonthlyVolume(
  rows: { date: Date; rating: number }[],
  since: Date | null,
): MonthlyVolumePoint[] {
  const now = new Date();
  const start = since
    ? new Date(since.getFullYear(), since.getMonth(), 1)
    : new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const buckets = new Map<string, { pos: number; neg: number; sum: number; n: number }>();
  for (const { date, rating } of rows) {
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const b = buckets.get(key) ?? { pos: 0, neg: 0, sum: 0, n: 0 };
    if (rating >= 4) b.pos += 1;
    else b.neg += 1;
    b.sum += rating;
    b.n += 1;
    buckets.set(key, b);
  }

  const result: MonthlyVolumePoint[] = [];
  const cursor = new Date(start);
  while (cursor <= now) {
    const b = buckets.get(`${cursor.getFullYear()}-${cursor.getMonth()}`);
    result.push({
      month: cursor.toLocaleDateString("en-GB", { month: "short" }),
      monthKey: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
      monthLabel: cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      positive: b?.pos ?? 0,
      negative: b?.neg ?? 0,
      avg: b && b.n > 0 ? b.sum / b.n : null,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return result;
}

/**
 * Period-over-period deltas, keyed by DISPLAY LABEL (the chart's Y-axis value).
 * Counts tag IDENTITIES, then maps each back to its label for the pill lookup.
 */
function buildTagDeltas(
  current: { tags: string[] }[],
  previous: { tags: string[] }[],
  labelById: Map<string, string>,
): Record<string, number> {
  const count = (rows: { tags: string[] }[]) => {
    const map = new Map<string, number>();
    for (const row of rows) for (const id of row.tags) map.set(id, (map.get(id) ?? 0) + 1);
    return map;
  };
  const curr = count(current);
  const prev = count(previous);
  const deltas: Record<string, number> = {};
  for (const [id, c] of curr) {
    const p = prev.get(id) ?? 0;
    if (p === 0) continue; // no baseline — skip, don't show a misleading pill
    const pct = Math.round(((c - p) / p) * 100);
    const label = labelById.get(id);
    if (pct !== 0 && label) deltas[label] = pct;
  }
  return deltas;
}

/**
 * Split each tag's mentions into positive/negative counts (by identity), keyed
 * to its zone + display label for the divergent bar chart.
 */
function buildZoneTagBars(
  rows: { tags: string[]; negativeTags: string[] }[],
  zoneById: Map<string, string>,
  labelById: Map<string, string>,
): ZoneTagBar[] {
  const positive = new Map<string, number>();
  const negative = new Map<string, number>();
  for (const row of rows) {
    const negSet = new Set(row.negativeTags);
    for (const id of row.tags) {
      if (!zoneById.has(id)) continue; // tag no longer in any zone (deactivated)
      const map = negSet.has(id) ? negative : positive;
      map.set(id, (map.get(id) ?? 0) + 1);
    }
  }
  const allIds = new Set([...positive.keys(), ...negative.keys()]);
  const result: ZoneTagBar[] = [];
  for (const id of allIds) {
    const pos = positive.get(id) ?? 0;
    const neg = negative.get(id) ?? 0;
    if (pos + neg === 0) continue;
    result.push({
      tagId: id,
      tag: labelById.get(id) ?? id,
      zone: zoneById.get(id)!,
      positive: pos,
      negative: neg,
    });
  }
  return result.sort((a, b) => (b.positive + b.negative) - (a.positive + a.negative));
}

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  if (!ANALYTICS_ENABLED) {
    return (
      <ComingSoon
        title="Analytics"
        description="Sentiment trends, operational zones, and the themes hiding in your reviews — all coming once your Google Business Profile is connected."
      />
    );
  }

  const business = await requireCurrentBusiness();
  const businessId = business.id;

  const { range: rawRange } = await searchParams;
  const range: Range =
    rawRange === "30d" || rawRange === "90d" || rawRange === "180d" || rawRange === "all"
      ? rawRange
      : "all";

  const since = getDateRange(range);
  const now = new Date();
  const prevSince = since ? new Date(since.getTime() - (now.getTime() - since.getTime())) : null;

  const [feedback, reviews, prevFeedback, prevReviews, pendingAnalysis, totalAnalyzed, oldestAnalyzedAt, formConfig, allInsightRows] =
    await Promise.all([
      prisma.anonymousFeedback.findMany({
        where: { businessId, ...(since ? { createdAt: { gte: since } } : {}) },
        select: { createdAt: true, rating: true, tags: true, negativeTags: true, source: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.review.findMany({
        where: { businessId, ...(since ? { publishedAt: { gte: since } } : {}) },
        select: { publishedAt: true, rating: true, tags: true, negativeTags: true },
        orderBy: { publishedAt: "asc" },
      }),
      prevSince && since
        ? prisma.anonymousFeedback.findMany({
            where: { businessId, createdAt: { gte: prevSince, lt: since } },
            select: { tags: true, rating: true },
          })
        : Promise.resolve([]),
      prevSince && since
        ? prisma.review.findMany({
            where: { businessId, publishedAt: { gte: prevSince, lt: since } },
            select: { tags: true, rating: true },
          })
        : Promise.resolve([]),
      Promise.all([
        prisma.review.count({ where: { businessId, analyzedAt: null, text: { not: null } } }),
        prisma.anonymousFeedback.count({ where: { businessId, analyzedAt: null, text: { not: null } } }),
      ]).then(([r, f]) => r + f),
      Promise.all([
        prisma.review.count({ where: { businessId, analyzedAt: { not: null } } }),
        prisma.anonymousFeedback.count({ where: { businessId, analyzedAt: { not: null } } }),
      ]).then(([r, f]) => r + f),
      Promise.all([
        prisma.review.findFirst({
          where: { businessId, analyzedAt: { not: null } },
          orderBy: { analyzedAt: "asc" },
          select: { analyzedAt: true },
        }),
        prisma.anonymousFeedback.findFirst({
          where: { businessId, analyzedAt: { not: null } },
          orderBy: { analyzedAt: "asc" },
          select: { analyzedAt: true },
        }),
      ]).then(([r, f]) => {
        const dates = [r?.analyzedAt, f?.analyzedAt].filter(Boolean) as Date[];
        return dates.length > 0 ? dates.reduce((a, b) => (a < b ? a : b)) : null;
      }),
      prisma.formConfig.findUnique({
        where: { businessId },
        include: {
          categories: {
            orderBy: { order: "asc" },
            include: { tags: { where: { active: true } } },
          },
        },
      }),
      Promise.all([
        prisma.review.findMany({
          where: { businessId, analyzedAt: { not: null } },
          select: { unmappedInsights: true, rating: true },
        }),
        prisma.anonymousFeedback.findMany({
          where: { businessId, analyzedAt: { not: null } },
          select: { unmappedInsights: true, rating: true },
        }),
      ]).then(([r, f]) => {
        // Per-insight frequency + a rating-derived sentiment lean (insights carry no
        // sentiment of their own): mostly ≥4★ → positive, mostly <4★ → negative, tie → neutral.
        const stat = new Map<string, { count: number; pos: number; neg: number }>();
        for (const row of [...r, ...f]) {
          for (const insight of row.unmappedInsights) {
            const key = insight.trim().toLowerCase();
            if (!key) continue;
            const s = stat.get(key) ?? { count: 0, pos: 0, neg: 0 };
            s.count += 1;
            if (row.rating >= 4) s.pos += 1;
            else s.neg += 1;
            stat.set(key, s);
          }
        }
        return Array.from(stat.entries())
          .map(([text, s]): { text: string; count: number; sentiment: "positive" | "negative" | "neutral" } => ({
            text,
            count: s.count,
            sentiment: s.pos > s.neg ? "positive" : s.neg > s.pos ? "negative" : "neutral",
          }))
          .sort((a, b) => b.count - a.count);
      }),
    ]);

  // Resolve the taxonomy: identity → display label, and identity → zone (category) name.
  const language = formConfig?.defaultLanguage ?? "en";
  const labelById = new Map<string, string>();
  const zoneById = new Map<string, string>();
  const zoneOrder: string[] = [];
  for (const cat of formConfig?.categories ?? []) {
    const zone = resolveLabel(cat.labels, { default: language });
    zoneOrder.push(zone);
    for (const tag of cat.tags) {
      labelById.set(tag.id, resolveLabel(tag.labels, { default: language, authored: tag.authoredLanguage }));
      zoneById.set(tag.id, zone);
    }
  }

  // Taxonomy changed after some records were analyzed → offer a re-analyze.
  const latestCategoryUpdate = formConfig?.categories.reduce<Date | null>(
    (max, cat) => (!max || cat.updatedAt > max ? cat.updatedAt : max),
    null
  );
  const taxonomyChanged =
    !!oldestAnalyzedAt && !!latestCategoryUpdate && latestCategoryUpdate > oldestAnalyzedAt;

  const volumeRows = [
    ...feedback.map((f) => ({ date: f.createdAt, rating: f.rating })),
    ...reviews.map((r) => ({ date: r.publishedAt, rating: r.rating })),
  ];
  const monthlyVolume = buildMonthlyVolume(volumeRows, since);

  const taggedRows = [
    ...feedback.map((f) => ({ tags: f.tags, negativeTags: f.negativeTags })),
    ...reviews.map((r) => ({ tags: r.tags, negativeTags: r.negativeTags })),
  ];
  const zoneBars = buildZoneTagBars(taggedRows, zoneById, labelById);
  const deltas = buildTagDeltas(taggedRows, [...prevFeedback, ...prevReviews], labelById);

  // Top tags by polarity for the "love" / "fix" panels.
  const loveItems = [...zoneBars]
    .filter((b) => b.positive > 0)
    .sort((a, b) => b.positive - a.positive)
    .slice(0, 6)
    .map((b) => ({ tag: b.tag, zone: b.zone, count: b.positive }));
  const fixItems = [...zoneBars]
    .filter((b) => b.negative > 0)
    .sort((a, b) => b.negative - a.negative)
    .slice(0, 6)
    .map((b) => ({ tag: b.tag, zone: b.zone, count: b.negative }));

  // Summary stats across both sources.
  const ratings = [...feedback.map((f) => f.rating), ...reviews.map((r) => r.rating)];
  const totalFeedback = ratings.length;
  const googleReviewCount = reviews.length;
  const googleRedirects = feedback.filter((f) => f.source === "google_redirect").length;
  const avgRating = totalFeedback > 0 ? ratings.reduce((s, r) => s + r, 0) / totalFeedback : null;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: ratings.filter((r) => r === star).length,
  }));
  const negativeCount = ratings.filter((r) => r < 4).length;
  const positiveCount = totalFeedback - negativeCount;
  const negativePct = totalFeedback > 0 ? Math.round((negativeCount / totalFeedback) * 100) : 0;

  // Average monthly review count over the displayed window (mean bar height).
  const windowTotal = monthlyVolume.reduce((s, m) => s + m.positive + m.negative, 0);
  const avgMonthly =
    monthlyVolume.length > 0 ? Math.round(windowTotal / monthlyVolume.length) : 0;

  // Positive / negative growth vs the immediately preceding equal-length window.
  // Only meaningful for a bounded range (all-time has no prior period).
  const prevRows = [...prevFeedback, ...prevReviews];
  const prevPositive = prevRows.filter((r) => r.rating >= 4).length;
  const prevNegative = prevRows.filter((r) => r.rating < 4).length;
  const growth = (curr: number, prev: number): number | null =>
    prev === 0 ? null : Math.round(((curr - prev) / prev) * 100);
  const positiveGrowth = prevSince ? growth(positiveCount, prevPositive) : null;
  const negativeGrowth = prevSince ? growth(negativeCount, prevNegative) : null;

  const RANGE_LABELS: Record<Range, string> = {
    "30d": "Last 30 days",
    "90d": "Last 90 days",
    "180d": "Last 180 days",
    "all": "All time",
  };

  return (
    <main className="p-8 space-y-8 max-w-6xl mx-auto">
      <ReviewCTA
        unreadCount={pendingAnalysis}
        businessId={businessId}
        totalAnalyzed={totalAnalyzed}
        taxonomyChanged={taxonomyChanged}
      />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-sm mt-1 text-muted-foreground">
            {RANGE_LABELS[range]} · {business.name}
          </p>
        </div>
        <AnalyticsControls currentRange={range} />
      </div>

      <Separator />

      <StatsStrip
        total={totalFeedback}
        fromGoogle={googleReviewCount}
        formToGoogle={googleRedirects}
        pending={pendingAnalysis}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <OverallSentimentPanel
          avg={avgRating}
          total={totalFeedback}
          rangeLabel={RANGE_LABELS[range].toLowerCase()}
          distribution={distribution}
          negativeCount={negativeCount}
          negativePct={negativePct}
        />
        <TopTagsPanel title="What people love" variant="love" items={loveItems} />
        <TopTagsPanel title="What to fix first" variant="fix" items={fixItems} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-foreground">Review volume over time</CardTitle>
              <p className="text-xs text-muted-foreground">
                Monthly · averages {avgMonthly} {avgMonthly === 1 ? "review" : "reviews"}/month ·{" "}
                {RANGE_LABELS[range].toLowerCase()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {(positiveGrowth !== null || negativeGrowth !== null) && (
                <div className="flex items-center gap-3">
                  <GrowthPill label="positive" pct={positiveGrowth} tone="positive" />
                  <GrowthPill label="negative" pct={negativeGrowth} tone="negative" />
                </div>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--color-green-500)" }} />
                  Positive
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#f87171" }} />
                  Negative
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-3.5" style={{ background: "var(--color-primary)" }} />
                  Avg ★
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ReviewVolumeChart data={monthlyVolume} businessId={businessId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">Operational Zones</CardTitle>
          <p className="text-xs text-muted-foreground">
            Tags grouped by area · sorted by most negative · click a bar to read customer quotes
          </p>
        </CardHeader>
        <CardContent>
          <OperationalZonesChart data={zoneBars} businessId={businessId} zoneOrder={zoneOrder} deltas={deltas} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">Unmapped Insights</CardTitle>
          <p className="text-xs text-muted-foreground">
            Patterns found in reviews that fall outside your defined taxonomy · colored by sentiment
          </p>
        </CardHeader>
        <CardContent>
          <UnmappedInsightsPanel insights={allInsightRows} businessId={businessId} />
        </CardContent>
      </Card>
    </main>
  );
}
