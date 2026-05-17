import { prisma } from "@repo/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FeedbackReceivedChart } from "@/components/AnalyticsCharts";
import type { DailyCount } from "@/components/AnalyticsCharts";
import { AnalyticsControls } from "@/components/AnalyticsControls";
import { OperationalZonesChart } from "@/components/OperationalZonesChart";
import type { ZoneTagBar } from "@/components/OperationalZonesChart";
import { ReviewCTA } from "@/components/ReviewCTA";
import { ZONE_MAP } from "@/lib/analytics-constants";

export const dynamic = "force-dynamic";

const DEV_BUSINESS_ID = process.env.DEV_BUSINESS_ID ?? "cmp7n349t0002rhz58a4hinnt";

type Range = "7d" | "30d" | "90d" | "ytd";

function getDateRange(range: Range): Date {
  const now = new Date();
  switch (range) {
    case "7d":  { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
    case "30d": { const d = new Date(now); d.setDate(d.getDate() - 30); return d; }
    case "90d": { const d = new Date(now); d.setDate(d.getDate() - 90); return d; }
    case "ytd": return new Date(now.getFullYear(), 0, 1);
  }
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function buildDailyCounts(
  rows: { createdAt: Date }[],
  since: Date
): DailyCount[] {
  // Build a map of date string → count
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = formatDate(row.createdAt);
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

function buildZoneTagBars(
  rows: { tags: string[]; rating: number }[],
  zoneMap: Record<string, string>
): ZoneTagBar[] {
  const positive = new Map<string, number>();
  const negative = new Map<string, number>();

  for (const row of rows) {
    const isPositive = row.rating >= 4;
    for (const tag of row.tags) {
      if (!zoneMap[tag]) continue; // skip tags not in any zone
      const map = isPositive ? positive : negative;
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
    rawRange === "7d" || rawRange === "30d" || rawRange === "90d" || rawRange === "ytd"
      ? rawRange
      : "30d";

  const since = getDateRange(range);

  const [feedback, unreadCount] = await Promise.all([
    prisma.anonymousFeedback.findMany({
      where: { businessId: DEV_BUSINESS_ID, createdAt: { gte: since } },
      select: { createdAt: true, rating: true, tags: true, source: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.anonymousFeedback.count({
      where: { businessId: DEV_BUSINESS_ID, status: "unread" },
    }),
  ]);

  const dailyCounts = buildDailyCounts(feedback, since);
  const zoneBars = buildZoneTagBars(feedback, ZONE_MAP);

  const totalFeedback = feedback.length;
  const googleRedirects = feedback.filter((f) => f.source === "google_redirect").length;
  const privateCount = feedback.filter((f) => f.source === "private").length;
  const avgRating =
    totalFeedback > 0
      ? (feedback.reduce((s, f) => s + f.rating, 0) / totalFeedback).toFixed(1)
      : "—";

  const RANGE_LABELS: Record<Range, string> = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
    ytd: "Year to date",
  };

  return (
    <main className="p-8 space-y-8 max-w-5xl">
      {/* Gamified CTA */}
      <ReviewCTA unreadCount={unreadCount} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-sm mt-1 text-muted-foreground">
            {RANGE_LABELS[range]} · Spice Garden Berlin
          </p>
        </div>
        <AnalyticsControls currentRange={range} />
      </div>

      <Separator />

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Submissions", value: totalFeedback },
          { label: "→ Google", value: googleRedirects },
          { label: "Private", value: privateCount },
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
          <p className="text-xs text-muted-foreground">Daily submissions (private + Google redirects)</p>
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
          <OperationalZonesChart data={zoneBars} businessId={DEV_BUSINESS_ID} />
        </CardContent>
      </Card>
    </main>
  );
}

