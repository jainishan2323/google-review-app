"use client";

import { useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { TagDrillDownSheet } from "@/components/TagDrillDownSheet";

export interface ZoneTagBar {
  /** Tag IDENTITY — used for the drill-down query (stored on feedback). */
  tagId: string;
  /** Display label (resolved to the business default language) — the chart axis + chip text. */
  tag: string;
  zone: string;
  positive: number;
  negative: number;
}

interface OperationalZonesChartProps {
  data: ZoneTagBar[];
  businessId: string;
  zoneOrder: string[];
  deltas: Record<string, number>;
}

// Delta pill rendered inside the custom YAxis tick
function DeltaPill({ delta }: { delta: number | undefined }) {
  if (delta === undefined) return null;
  const isPositive = delta > 0;
  const abs = Math.abs(delta);
  return (
    <span
      className={`ml-1.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
        isPositive
          ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          : "bg-chart-1/30 text-chart-5 dark:bg-chart-5/30 dark:text-chart-2"
      }`}
    >
      {isPositive ? "↑" : "↓"} {abs}%
    </span>
  );
}

// Custom Y-axis tick that renders the tag name + delta pill as HTML
function CustomYAxisTick(props: {
  x?: number;
  y?: number;
  payload?: { value: string };
  onTagClick?: (tag: string) => void;
  deltas?: Record<string, number>;
}) {
  const { x = 0, y = 0, payload, onTagClick, deltas = {} } = props;
  const tag = payload?.value ?? "";
  const delta = deltas[tag];
  const isPositive = delta !== undefined && delta > 0;

  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject x={-180} y={-11} width={176} height={24}>
        <div className="flex items-center justify-end gap-1 h-full pr-2">
          <button
            className="text-[11px] font-medium text-foreground hover:text-primary transition-colors truncate max-w-[90px]"
            onClick={() => onTagClick?.(tag)}
            title={tag}
          >
            {tag}
          </button>
          {delta !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-1 py-0 text-[9px] font-bold shrink-0 ${
                isPositive
                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-chart-1/30 text-chart-5 dark:bg-chart-5/30 dark:text-chart-2"
              }`}
            >
              {isPositive ? "↑" : "↓"}{Math.abs(delta)}%
            </span>
          )}
        </div>
      </foreignObject>
    </g>
  );
}

const ZONE_COLORS: Record<string, string> = {
  Kitchen: "var(--chart-4)",
  "Front of House": "oklch(0.45 0.18 250)", // blue-ish
  Atmosphere: "oklch(0.45 0.18 30)",     // orange-ish
};

const POS_COLOR = "var(--chart-3)";
const NEG_COLOR = "#f87171";

function absFormatter(value: unknown) {
  const n = Math.abs(Number(value));
  return n > 0 ? String(n) : "";
}

interface ZoneChartSectionProps {
  zone: string;
  tags: ZoneTagBar[];
  onTagClick: (tag: string) => void;
  activeTag: string | null;
  deltas: Record<string, number>;
}

function ZoneChartSection({ zone, tags, onTagClick, activeTag, deltas }: ZoneChartSectionProps) {
  if (tags.length === 0) return null;

  // Recharts requires negative values to go left — store negative as negative number
  const chartData = tags.map((t) => ({
    tag: t.tag,
    positive: t.positive,
    negative: t.negative > 0 ? -t.negative : 0,
  }));

  const barHeight = 32;
  const chartHeight = tags.length * barHeight + 16;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 px-1">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: ZONE_COLORS[zone] ?? "#888" }}
        />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {zone}
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 32, bottom: 0, left: 184 }}
          barCategoryGap={4}
        >
          <XAxis
            type="number"
            tick={false}
            axisLine={false}
            tickLine={false}
            domain={["auto", "auto"]}
          />
          <YAxis
            dataKey="tag"
            type="category"
            width={180}
            tick={
              <CustomYAxisTick
                onTagClick={onTagClick}
                deltas={deltas}
              />
            }
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [Math.abs(Number(value)), "Count"]}
            contentStyle={{
              fontSize: 12,
              borderRadius: 6,
            }}
            cursor={{ fill: "rgba(0,0,0,0.05)" }}
          />

          {/* Positive bars — extend right */}
          <Bar dataKey="positive" fill={POS_COLOR} radius={[0, 3, 3, 0]} isAnimationActive={false}>
            {chartData.map((entry) => (
              <Cell
                key={entry.tag}
                fill={POS_COLOR}
                opacity={activeTag && activeTag !== entry.tag ? 0.35 : 1}
                cursor="pointer"
                onClick={() => onTagClick(entry.tag)}
              />
            ))}
            <LabelList
              dataKey="positive"
              position="insideRight"
              style={{ fontSize: 10, fill: "#fff", fontWeight: 600 }}
              formatter={(v) => (Number(v) > 0 ? String(v) : "")}
            />
          </Bar>

          {/* Negative bars — extend left (stored as negative) */}
          <Bar dataKey="negative" fill={NEG_COLOR} radius={[3, 0, 0, 3]} isAnimationActive={false}>
            {chartData.map((entry) => (
              <Cell
                key={entry.tag}
                fill={NEG_COLOR}
                opacity={activeTag && activeTag !== entry.tag ? 0.35 : 1}
                cursor="pointer"
                onClick={() => onTagClick(entry.tag)}
              />
            ))}
            <LabelList
              dataKey="negative"
              position="insideLeft"
              style={{ fontSize: 10, fill: "#fff", fontWeight: 600 }}
              formatter={absFormatter}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OperationalZonesChart({ data, businessId, zoneOrder, deltas }: OperationalZonesChartProps) {
  // The chart keys on display labels; map back to identities for the drill-down query.
  // Labels are business-wide unique per language (guardrail), so this is unambiguous.
  const idByLabel = new Map(data.map((d) => [d.tag, d.tagId]));
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const handleTagClick = useCallback((tag: string) => {
    setSelectedTag(tag);
  }, []);

  // Group tags by zone, preserving DB-configured order
  const byZone = zoneOrder.reduce<Record<string, ZoneTagBar[]>>((acc, zone) => {
    acc[zone] = data.filter((d) => d.zone === zone);
    return acc;
  }, {} as Record<string, ZoneTagBar[]>);

  const hasData = data.length > 0;

  return (
    <>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: POS_COLOR }} />
          Positive (≥4★)
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: NEG_COLOR }} />
          Negative (&lt;4★)
        </span>
        <span className="ml-auto flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5 bg-chart-1/30 text-chart-5 dark:bg-chart-5/30 dark:text-chart-2 rounded-full px-1.5 py-0.5 font-semibold">↓ 15%</span>
          <span>= improving vs. last period</span>
          <span className="inline-flex items-center gap-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full px-1.5 py-0.5 font-semibold">↑ 10%</span>
          <span>= worsening</span>
        </span>
      </div>

      {!hasData ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No tagged feedback in this range.
        </p>
      ) : (
        <div className="space-y-6">
          {zoneOrder.map((zone) => (
            <ZoneChartSection
              key={zone}
              zone={zone}
              tags={byZone[zone] ?? []}
              onTagClick={handleTagClick}
              activeTag={selectedTag}
              deltas={deltas}
            />
          ))}
        </div>
      )}

      <TagDrillDownSheet
        tag={selectedTag ? idByLabel.get(selectedTag) ?? selectedTag : null}
        displayLabel={selectedTag}
        businessId={businessId}
        open={!!selectedTag}
        onClose={() => setSelectedTag(null)}
      />
    </>
  );
}
