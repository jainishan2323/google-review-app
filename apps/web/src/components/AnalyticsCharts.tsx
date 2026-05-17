"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

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

// ── Divergent Tag Chart ───────────────────────────────────────

export interface TagCount {
  tag: string;
  positive: number;
  negative: number;
}

const tagChartConfig = {
  positive: { label: "Positive", color: "#22c55e" },
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
          formatter={(value: number, name: string) => [
            Math.abs(value),
            name === "positive" ? "Positive" : "Negative",
          ]}
        />
        <Bar dataKey="positive" fill="#22c55e" radius={[0, 3, 3, 0]} />
        <Bar dataKey="negative" fill="#f87171" radius={[3, 0, 0, 3]} />
      </BarChart>
    </ChartContainer>
  );
}
