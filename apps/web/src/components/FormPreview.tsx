"use client";

import { useState } from "react";
import { Star, ArrowLeft } from "lucide-react";
import { resolveLabel } from "@repo/types";

type LabelMap = Record<string, string>;

interface PreviewTag {
  id: string;
  labels: LabelMap;
  active: boolean;
}
interface PreviewCategory {
  id: string;
  labels: LabelMap;
  positive: PreviewTag[];
  negative: PreviewTag[];
}

interface Props {
  brandColor: string;
  logoUrl: string;
  welcome: LabelMap;
  categories: PreviewCategory[];
  defaultLanguage: string;
  /** The language the preview renders in — driven by the editor's "Editing in" control. */
  activeLanguage: string;
}

const LANGUAGE_NAMES: Record<string, string> = { en: "English", de: "Deutsch" };
type Band = "stars" | "high" | "low";

export function FormPreview({
  brandColor,
  logoUrl,
  welcome,
  categories,
  defaultLanguage,
  activeLanguage,
}: Props) {
  const [band, setBand] = useState<Band>("low");

  const color = /^#[0-9A-Fa-f]{6}$/.test(brandColor) ? brandColor : "#2563EB";
  const label = (m: LabelMap) => resolveLabel(m, { default: defaultLanguage, active: activeLanguage });

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <p className="self-start text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Live preview
      </p>

      {/* Controls: rating band (language follows the editor's "Editing in" control) */}
      <div className="flex w-full items-center justify-center gap-2">
        <div className="flex gap-1 rounded-full bg-muted p-1 text-xs">
          {([
            ["stars", "Stars"],
            ["high", "4–5★"],
            ["low", "1–3★"],
          ] as const).map(([b, txt]) => (
            <button
              key={b}
              type="button"
              onClick={() => setBand(b)}
              className={`rounded-full px-3 py-1 transition-colors ${
                band === b ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {txt}
            </button>
          ))}
        </div>
      </div>

      {/* Phone frame */}
      <div className="w-72 rounded-[2.5rem] bg-zinc-900 p-2.5 shadow-2xl ring-1 ring-white/10">
        <div className="relative flex h-6 items-center justify-center rounded-t-[1.6rem] bg-white">
          <div className="absolute left-1/2 top-0 h-4 w-14 -translate-x-1/2 rounded-b-xl bg-zinc-900" />
        </div>
        <div className="h-[min(560px,calc(100dvh-12rem))] overflow-hidden rounded-b-[1.6rem] bg-white">
          {band === "stars" ? (
            <StarScreen brandColor={color} logoUrl={logoUrl} welcome={label(welcome)} />
          ) : (
            <ChipsScreen brandColor={color} band={band} categories={categories} label={label} />
          )}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/60">
        {band === "stars" ? "Welcome screen" : band === "high" ? "Happy path (4–5★)" : "Improve path (1–3★)"} ·{" "}
        {LANGUAGE_NAMES[activeLanguage] ?? activeLanguage}
      </p>
    </div>
  );
}

function StarScreen({ brandColor, logoUrl, welcome }: { brandColor: string; logoUrl: string; welcome: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-5 text-center">
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" />
      )}
      <p className="max-w-[160px] text-[11px] font-medium leading-snug text-gray-800">
        {welcome || "Thanks for visiting!"}
      </p>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className="size-8"
            style={{ fill: s <= 4 ? brandColor : "transparent", color: s <= 4 ? brandColor : "#9ca3af", strokeWidth: 1.5 }}
          />
        ))}
      </div>
      <p className="text-[10px] text-gray-400">Tap a star to rate</p>
    </div>
  );
}

function ChipsScreen({
  brandColor,
  band,
  categories,
  label,
}: {
  brandColor: string;
  band: Exclude<Band, "stars">;
  categories: PreviewCategory[];
  label: (m: LabelMap) => string;
}) {
  const rating = band === "high" ? 5 : 3;
  const chipsFor = (c: PreviewCategory): PreviewTag[] =>
    (band === "high" ? c.positive : [...c.positive, ...c.negative]).filter((t) => t.active);
  const heading = band === "high" ? "What did you love?" : "What can we improve?";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 pb-0">
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <ArrowLeft className="size-3" /> Back
        </div>
        <div className="space-y-1">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className="size-3.5"
                style={{ fill: s <= rating ? brandColor : "transparent", color: s <= rating ? brandColor : "#9ca3af", strokeWidth: 1.5 }}
              />
            ))}
          </div>
          <p className="text-[11px] font-semibold text-gray-800">{heading}</p>
        </div>
        <div className="space-y-3">
          {categories.map((cat) => {
            const chips = chipsFor(cat);
            if (chips.length === 0) return null;
            return (
              <div key={cat.id} className="space-y-1.5">
                <p className="text-[10px] font-semibold text-gray-600">{label(cat.labels)}</p>
                <div className="flex flex-wrap gap-1.5">
                  {chips.map((t) => (
                    <span
                      key={t.id}
                      className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
                      style={{ borderColor: "#e5e7eb", color: "#374151" }}
                    >
                      {label(t.labels)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="min-h-[52px] rounded-lg border border-gray-200 p-2">
          <p className="text-[10px] text-gray-300">Tell us a bit more (optional)...</p>
        </div>
      </div>
      <div className="shrink-0 p-4 pt-3">
        <div
          className="w-full rounded-lg py-2.5 text-center text-[11px] font-semibold text-white"
          style={{ backgroundColor: brandColor }}
        >
          Next
        </div>
      </div>
    </div>
  );
}
