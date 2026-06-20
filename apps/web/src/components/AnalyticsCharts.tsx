"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ComposedChart,
  Line,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { MonthReviewsSheet } from "@/components/MonthReviewsSheet";

// ── Feedback Received (daily bar chart) ──────────────────────

export interface DailyCount {
  date: string; // "May 12"
  count: number;
}

const feedbackChartConfig = {
  count: { label: "Submissions", color: "var(--color-primary)" },
} satisfies ChartConfig;

export function FeedbackReceivedChart({ data }: { data: DailyCount[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No data for this period.
      </div>
    );
  }
  return (
    <ChartContainer config={feedbackChartConfig} className="h-52 w-full">
      <BarChart data={data} barCategoryGap="30%">
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={24}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

// ── Review volume over time (monthly stacked + avg-rating line) ──

export interface MonthlyVolumePoint {
  month: string; // "Jun" — x-axis tick
  monthKey: string; // "2026-06" — drill-down query
  monthLabel: string; // "June 2026" — drawer title
  positive: number; // rating >= 4
  negative: number; // rating < 4
  avg: number | null; // average rating that month, null if no reviews
}

const volumeChartConfig = {
  positive: { label: "Positive", color: "var(--color-green-500)" },
  negative: { label: "Negative", color: "#f87171" },
  avg: { label: "Avg ★", color: "var(--color-primary)" },
} satisfies ChartConfig;

export function ReviewVolumeChart({ data, businessId }: { data: MonthlyVolumePoint[]; businessId: string }) {
  const [selected, setSelected] = useState<MonthlyVolumePoint | null>(null);
  const hasData = data.some((d) => d.positive + d.negative > 0);
  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-72 text-muted-foreground text-sm">
        No reviews in this period.
      </div>
    );
  }
  return (
    <>
    <ChartContainer config={volumeChartConfig} className="h-72 w-full cursor-pointer">
      <ComposedChart
        data={data}
        barCategoryGap="30%"
        onClick={(state) => {
          const idx = Number(state?.activeIndex);
          if (!Number.isInteger(idx)) return;
          const point = data[idx];
          if (point && point.positive + point.negative > 0) setSelected(point);
        }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="count"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={28}
        />
        {/* Hidden secondary axis so the avg-rating line shares the plot on its own 0–5 scale. */}
        <YAxis yAxisId="avg" orientation="right" domain={[0, 5]} hide />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          yAxisId="count"
          dataKey="positive"
          stackId="vol"
          fill="var(--color-green-500)"
          radius={[0, 0, 0, 0]}
          style={{ cursor: "pointer" }}
        />
        <Bar
          yAxisId="count"
          dataKey="negative"
          stackId="vol"
          fill="#f87171"
          radius={[3, 3, 0, 0]}
          style={{ cursor: "pointer" }}
        />
        <Line
          yAxisId="avg"
          dataKey="avg"
          stroke="var(--color-primary)"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          connectNulls={false}
        />
      </ComposedChart>
    </ChartContainer>
    <MonthReviewsSheet
      monthKey={selected?.monthKey ?? null}
      monthLabel={selected?.monthLabel ?? ""}
      positive={selected?.positive ?? 0}
      negative={selected?.negative ?? 0}
      businessId={businessId}
      open={!!selected}
      onClose={() => setSelected(null)}
    />
    </>
  );
}

// ── Divergent Tag Chart ───────────────────────────────────────

export interface TagCount {
  tag: string;
  positive: number;
  negative: number;
}

const tagChartConfig = {
  positive: { label: "Positive", color: "var(--chart-3)" },
  negative: { label: "Negative (from low ratings)", color: "#f87171" },
} satisfies ChartConfig;

export function DivergentTagChart({ data }: { data: TagCount[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No tag data for this period.
      </div>
    );
  }

  // Merge into one flat list: positive bars right, negative bars shown as negative values
  const chartData = data.map((d) => ({
    tag: d.tag,
    positive: d.positive,
    negative: -d.negative, // negative values render left of zero axis
    negativeLabel: d.negative, // for tooltip display
  }));

  return (
    <ChartContainer config={tagChartConfig} className="h-64 w-full">
      <BarChart
        data={chartData}
        layout="vertical"
        barCategoryGap="25%"
        margin={{ left: 8, right: 8 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) => String(Math.abs(v))}
        />
        <YAxis
          type="category"
          dataKey="tag"
          width={120}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value, name) => [
            Math.abs(Number(value)),
            name === "positive" ? "Positive" : "Negative",
          ]}
        />
        <Bar dataKey="positive" fill="var(--chart-3)" radius={[0, 3, 3, 0]} />
        <Bar dataKey="negative" fill="#f87171" radius={[3, 0, 0, 3]} />
      </BarChart>
    </ChartContainer>
  );
}
