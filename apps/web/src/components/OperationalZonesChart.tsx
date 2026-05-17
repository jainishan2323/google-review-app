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
import { ZONE_ORDER, MOCK_DELTAS } from "@/lib/analytics-constants";
import { TagDrillDownSheet } from "@/components/TagDrillDownSheet";

export interface ZoneTagBar {
  tag: string;
  zone: string;
  positive: number;
  negative: number;
}

interface OperationalZonesChartProps {
  data: ZoneTagBar[];
  businessId: string;
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
          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
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
}) {
  const { x = 0, y = 0, payload, onTagClick } = props;
  const tag = payload?.value ?? "";
  const delta = MOCK_DELTAS[tag];
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
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
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
  Kitchen: "oklch(0.45 0.18 145)",       // emerald-ish
  "Front of House": "oklch(0.45 0.18 250)", // blue-ish
  Atmosphere: "oklch(0.45 0.18 30)",     // orange-ish
};

const POS_COLOR = "#22c55e";
const NEG_COLOR = "#f87171";

function absFormatter(value: number) {
  return Math.abs(value) > 0 ? String(Math.abs(value)) : "";
}

interface ZoneChartSectionProps {
  zone: string;
  tags: ZoneTagBar[];
  onTagClick: (tag: string) => void;
  activeTag: string | null;
}

function ZoneChartSection({ zone, tags, onTagClick, activeTag }: ZoneChartSectionProps) {
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
              />
            }
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number) => [Math.abs(value), "Count"]}
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
              formatter={(v: number) => (v > 0 ? String(v) : "")}
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

export function OperationalZonesChart({ data, businessId }: OperationalZonesChartProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const handleTagClick = useCallback((tag: string) => {
    setSelectedTag(tag);
  }, []);

  // Group tags by zone, preserving ZONE_ORDER
  const byZone = ZONE_ORDER.reduce<Record<string, ZoneTagBar[]>>((acc, zone) => {
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
          <span className="inline-flex items-center gap-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full px-1.5 py-0.5 font-semibold">↓ 15%</span>
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
          {ZONE_ORDER.map((zone) => (
            <ZoneChartSection
              key={zone}
              zone={zone}
              tags={byZone[zone] ?? []}
              onTagClick={handleTagClick}
              activeTag={selectedTag}
            />
          ))}
        </div>
      )}

      <TagDrillDownSheet
        tag={selectedTag}
        businessId={businessId}
        open={!!selectedTag}
        onClose={() => setSelectedTag(null)}
      />
    </>
  );
}
