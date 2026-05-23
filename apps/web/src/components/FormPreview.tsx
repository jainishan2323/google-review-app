"use client";

import { useState } from "react"; // selectedChips state stays local
import { Star, ArrowLeft } from "lucide-react";

interface Category {
  name: string;
  positiveChips: string[];
  negativeChips: string[];
}

interface Props {
  brandColor: string;
  logoUrl: string;
  welcomeMessage: string;
  categories: Category[];
  screen: "stars" | "chips";
  onScreenChange: (s: "stars" | "chips") => void;
}

const DEMO_RATING = 3;

function StarScreen({
  brandColor,
  logoUrl,
  welcomeMessage,
}: {
  brandColor: string;
  logoUrl: string;
  welcomeMessage: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 p-5 text-center h-full">
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" />
      )}
      <p className="text-[11px] font-medium text-gray-800 leading-snug max-w-[160px]">
        {welcomeMessage || "Thanks for visiting!"}
      </p>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className="size-8"
            style={{
              fill: star <= DEMO_RATING ? brandColor : "transparent",
              color: star <= DEMO_RATING ? brandColor : "#9ca3af",
              strokeWidth: 1.5,
            }}
          />
        ))}
      </div>
      <p className="text-[10px] text-gray-400">Tap a star to rate</p>
    </div>
  );
}

function ChipsScreen({
  brandColor,
  categories,
  selectedChips,
  onToggle,
}: {
  brandColor: string;
  categories: Category[];
  selectedChips: string[];
  onToggle: (chip: string) => void;
}) {
  const chips =
    DEMO_RATING >= 4
      ? (cat: Category) => cat.positiveChips
      : (cat: Category) => [...cat.negativeChips, ...cat.positiveChips];

  const heading = DEMO_RATING >= 4 ? "What did you love?" : "What can we improve?";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-col gap-3 p-4 overflow-y-auto flex-1 pb-0">
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <ArrowLeft className="size-3" />
          Back
        </div>

        <div className="space-y-1">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className="size-3.5"
                style={{
                  fill: s <= DEMO_RATING ? brandColor : "transparent",
                  color: s <= DEMO_RATING ? brandColor : "#9ca3af",
                  strokeWidth: 1.5,
                }}
              />
            ))}
          </div>
          <p className="text-[11px] font-semibold text-gray-800">{heading}</p>
        </div>

        <div className="space-y-3">
          {categories.map((cat) => {
            const catChips = chips(cat);
            if (catChips.length === 0) return null;
            return (
              <div key={cat.name} className="space-y-1.5">
                {categories.length > 1 && cat.name && (
                  <p className="text-[10px] font-semibold text-gray-600">{cat.name}</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {catChips.slice(0, 6).map((chip) => {
                    const selected = selectedChips.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => onToggle(chip)}
                        className="rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors"
                        style={
                          selected
                            ? { backgroundColor: brandColor, borderColor: brandColor, color: "#fff" }
                            : { borderColor: "#e5e7eb", color: "#374151" }
                        }
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-gray-200 p-2 min-h-[52px]">
          <p className="text-[10px] text-gray-300">Tell us a bit more (optional)...</p>
        </div>
      </div>

      <div className="p-4 pt-3 shrink-0">
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

export function FormPreview({ brandColor, logoUrl, welcomeMessage, categories, screen, onScreenChange }: Props) {
  const [selectedChips, setSelectedChips] = useState<string[]>([]);

  const toggleChip = (chip: string) =>
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );

  const color = /^#[0-9A-Fa-f]{6}$/.test(brandColor) ? brandColor : "#2563EB";

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <p className="text-xs font-medium text-muted-foreground">Live preview</p>

      {/* Screen toggle */}
      <div className="flex gap-1 rounded-full bg-muted p-1 text-xs">
        {(["stars", "chips"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onScreenChange(s)}
            className={`px-3 py-1 rounded-full transition-colors capitalize ${
              screen === s
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "stars" ? "Stars" : "Form"}
          </button>
        ))}
      </div>

      {/* Phone frame */}
      <div className="w-[224px] bg-zinc-900 rounded-[2.5rem] p-2.5 shadow-2xl ring-1 ring-white/10">
        {/* Status bar + notch */}
        <div className="h-6 bg-white rounded-t-[1.6rem] flex items-center justify-center relative">
          <div className="w-14 h-4 bg-zinc-900 rounded-b-xl absolute top-0 left-1/2 -translate-x-1/2" />
        </div>
        {/* Screen */}
        <div className="bg-white rounded-b-[1.6rem] overflow-hidden h-[440px]">
          {screen === "stars" ? (
            <StarScreen brandColor={color} logoUrl={logoUrl} welcomeMessage={welcomeMessage} />
          ) : (
            <ChipsScreen
              brandColor={color}
              categories={
                categories.length > 0
                  ? categories
                  : [{ name: "", positiveChips: [], negativeChips: [] }]
              }
              selectedChips={selectedChips}
              onToggle={toggleChip}
            />
          )}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/60">3-star demo · click chips to interact</p>
    </div>
  );
}
