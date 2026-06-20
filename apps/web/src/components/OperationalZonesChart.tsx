"use client";

import { useState, useCallback } from "react";
import { TagDrillDownSheet } from "@/components/TagDrillDownSheet";
import { cn } from "@/lib/utils";

export interface ZoneTagBar {
  /** Tag IDENTITY — used for the drill-down query (stored on feedback). */
  tagId: string;
  /** Display label (resolved to the business default language) — the row label + chip text. */
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

const POS_COLOR = "var(--color-green-500)";
const NEG_COLOR = "#f87171";

// Zone health is a traffic light on the zone's negative share of mentions.
function zoneHealthColor(pos: number, neg: number): string {
  const total = pos + neg;
  if (total === 0) return "#9ca3af"; // grey — no data
  const ratio = neg / total;
  if (ratio < 0.25) return "#9ca3af"; // grey — healthy
  if (ratio < 0.5) return "#f59e0b"; // amber — watch
  return "#f87171"; // red — problem
}

// Period-over-period delta: ↓ fewer mentions = improving (green), ↑ more = worsening (red).
function DeltaPill({ delta }: { delta: number | undefined }) {
  if (delta === undefined || delta === 0) return null;
  const up = delta > 0;
  return (
    <span className={cn("text-xs font-semibold tabular-nums", up ? "text-red-400" : "text-green-500")}>
      {up ? "↑" : "↓"}
      {Math.abs(delta)}%
    </span>
  );
}

interface TagRowProps {
  tag: ZoneTagBar;
  globalMax: number;
  delta: number | undefined;
  active: boolean;
  dimmed: boolean;
  onClick: () => void;
}

function TagRow({ tag, globalMax, delta, dimmed, onClick }: TagRowProps) {
  const posPct = (tag.positive / globalMax) * 100;
  const negPct = (tag.negative / globalMax) * 100;

  return (
    <div
      className={cn(
        "grid grid-cols-[150px_minmax(0,1fr)_52px] items-center gap-2 transition-opacity",
        dimmed && "opacity-40",
      )}
    >
      {/* Tag label */}
      <button
        onClick={onClick}
        title={tag.tag}
        className="cursor-pointer truncate text-right text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        {tag.tag}
      </button>

      {/* Diverging bar */}
      <div className="relative flex h-5 items-center">
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />

        {/* Negative — grows left from centre */}
        <div className="flex w-1/2 justify-end">
          {tag.negative > 0 && (
            <button
              onClick={onClick}
              title={`${tag.tag} · ${tag.negative} negative`}
              className="flex h-3.5 cursor-pointer items-center justify-start overflow-hidden rounded-l pl-1 transition-opacity hover:opacity-80"
              style={{ width: `${negPct}%`, minWidth: 12, background: NEG_COLOR }}
            >
              <span className="text-[10px] font-semibold text-white">{tag.negative}</span>
            </button>
          )}
        </div>

        {/* Positive — grows right from centre */}
        <div className="flex w-1/2 justify-start">
          {tag.positive > 0 && (
            <button
              onClick={onClick}
              title={`${tag.tag} · ${tag.positive} positive`}
              className="flex h-3.5 cursor-pointer items-center justify-end overflow-hidden rounded-r pr-1 transition-opacity hover:opacity-80"
              style={{ width: `${posPct}%`, minWidth: 12, background: POS_COLOR }}
            >
              <span className="text-[10px] font-semibold text-white">{tag.positive}</span>
            </button>
          )}
        </div>
      </div>

      {/* Delta */}
      <div className="text-right">
        <DeltaPill delta={delta} />
      </div>
    </div>
  );
}

interface ZoneSectionProps {
  zone: string;
  tags: ZoneTagBar[];
  globalMax: number;
  deltas: Record<string, number>;
  activeTag: string | null;
  onTagClick: (tag: string) => void;
}

function ZoneSection({ zone, tags, globalMax, deltas, activeTag, onTagClick }: ZoneSectionProps) {
  if (tags.length === 0) return null;

  const posSum = tags.reduce((s, t) => s + t.positive, 0);
  const negSum = tags.reduce((s, t) => s + t.negative, 0);
  const net = posSum - negSum;

  // Most-negative first, then by volume.
  const sorted = [...tags].sort(
    (a, b) => b.negative - a.negative || b.positive - a.positive,
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: zoneHealthColor(posSum, negSum) }}
        />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {zone}
        </h3>
        <span className="text-xs text-muted-foreground/50">·</span>
        <span className={cn("text-xs font-semibold tabular-nums", net >= 0 ? "text-green-500" : "text-red-400")}>
          net {net >= 0 ? "+" : ""}
          {net}
        </span>
      </div>

      {/* Axis hint */}
      <div className="grid grid-cols-[150px_minmax(0,1fr)_52px] items-center gap-2">
        <span />
        <div className="relative flex items-center text-[10px] text-muted-foreground/60">
          <span className="w-1/2 text-left">◀ negative</span>
          <span className="absolute left-1/2 -translate-x-1/2">0</span>
          <span className="w-1/2 text-right">positive ▶</span>
        </div>
        <span />
      </div>

      <div className="space-y-1.5">
        {sorted.map((t) => (
          <TagRow
            key={t.tagId}
            tag={t}
            globalMax={globalMax}
            delta={deltas[t.tag]}
            active={activeTag === t.tag}
            dimmed={!!activeTag && activeTag !== t.tag}
            onClick={() => onTagClick(t.tag)}
          />
        ))}
      </div>
    </div>
  );
}

export function OperationalZonesChart({ data, businessId, zoneOrder, deltas }: OperationalZonesChartProps) {
  // Chart keys on display labels; map back to identities for the drill-down query.
  const idByLabel = new Map(data.map((d) => [d.tag, d.tagId]));
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const handleTagClick = useCallback((tag: string) => setSelectedTag(tag), []);

  const byZone = zoneOrder.reduce<Record<string, ZoneTagBar[]>>((acc, zone) => {
    acc[zone] = data.filter((d) => d.zone === zone);
    return acc;
  }, {});

  // One shared scale across every zone, so equal counts render at equal length.
  const globalMax = Math.max(1, ...data.map((d) => Math.max(d.positive, d.negative)));
  const hasData = data.length > 0;
  const selected = selectedTag ? data.find((d) => d.tag === selectedTag) ?? null : null;

  return (
    <>
      {/* Legend */}
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: POS_COLOR }} />
          Positive (≥4★)
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: NEG_COLOR }} />
          Negative (&lt;4★)
        </span>
        <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-green-500/15 px-2 py-0.5 font-semibold text-green-500">↓15%</span>
          improving
          <span className="rounded-full bg-red-400/15 px-2 py-0.5 font-semibold text-red-400">↑10%</span>
          worsening
          <span className="text-muted-foreground/60">vs. last period</span>
        </span>
      </div>

      {!hasData ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No tagged feedback in this range.
        </p>
      ) : (
        <div className="space-y-8">
          {zoneOrder.map((zone) => (
            <ZoneSection
              key={zone}
              zone={zone}
              tags={byZone[zone] ?? []}
              globalMax={globalMax}
              deltas={deltas}
              activeTag={selectedTag}
              onTagClick={handleTagClick}
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
        zone={selected?.zone}
        positive={selected?.positive}
        negative={selected?.negative}
        delta={selectedTag ? deltas[selectedTag] : undefined}
      />
    </>
  );
}
