"use client";

/**
 * A small, self-contained looping animation that shows the *mobile* gesture for
 * pasting the copied review into Google's review box: tap-and-hold the field, then
 * tap "Paste" from the popover. Pure CSS keyframes — no GIF asset, no deps.
 *
 * One ~4.2s timeline drives every element via shared animation-duration + delays,
 * so the parts stay in sync as the loop repeats:
 *   0.0–1.2s  finger presses into the field (long-press ripple)
 *   1.2–1.8s  "Paste" popover pops up; finger taps it
 *   1.8–3.0s  review text fills the field, line by line
 *   3.0–4.2s  hold, then fade out and reset
 */
export function PasteCoachmark({ brandColor }: { brandColor: string }) {
  return (
    <div className="relative mx-auto h-40 w-full max-w-[260px] select-none" aria-hidden="true">
      <style>{KEYFRAMES}</style>

      {/* The review text field */}
      <div className="absolute inset-x-0 top-6 mx-auto h-24 w-full rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="jg-line h-2 rounded-full bg-gray-200" style={{ animationDelay: "1.8s" }} />
          <div className="jg-line h-2 rounded-full bg-gray-200" style={{ animationDelay: "2.1s" }} />
          <div className="jg-line h-2 w-2/3 rounded-full bg-gray-200" style={{ animationDelay: "2.4s" }} />
        </div>

        {/* Placeholder shown before the text fills in */}
        <span className="jg-placeholder absolute left-3 top-3 text-[11px] text-gray-300">
          Share details of your experience…
        </span>
      </div>

      {/* "Paste" popover */}
      <div
        className="jg-paste absolute left-1/2 top-0 -translate-x-1/2 rounded-md px-3 py-1 text-[11px] font-medium text-white shadow-md"
        style={{ backgroundColor: brandColor }}
      >
        Paste
        <span
          className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent"
          style={{ borderTopColor: brandColor }}
        />
      </div>

      {/* Finger / touch point + long-press ripple */}
      <div className="jg-finger absolute left-1/2 top-[3.75rem] -translate-x-1/2">
        <span className="jg-ripple absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: brandColor }} />
        <span className="relative block h-6 w-6 rounded-full bg-gray-700/85 shadow-md ring-2 ring-white" />
      </div>
    </div>
  );
}

const KEYFRAMES = `
@keyframes jgFinger {
  0%   { opacity: 0; transform: translate(-50%, 14px) scale(1); }
  8%   { opacity: 1; transform: translate(-50%, 0) scale(1); }
  16%  { transform: translate(-50%, 0) scale(0.8); }      /* press down */
  28%  { transform: translate(-50%, 0) scale(0.8); }      /* hold (long-press) */
  36%  { transform: translate(-50%, -52px) scale(1); }    /* move up to popover */
  42%  { transform: translate(-50%, -52px) scale(0.8); }  /* tap Paste */
  48%  { transform: translate(-50%, -52px) scale(1); }
  62%  { opacity: 1; transform: translate(-50%, -52px) scale(1); }
  72%  { opacity: 0; transform: translate(-50%, -52px) scale(1); }
  100% { opacity: 0; }
}
@keyframes jgRipple {
  0%, 12%  { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
  16%      { opacity: 0.35; transform: translate(-50%, -50%) scale(1); }
  30%      { opacity: 0; transform: translate(-50%, -50%) scale(2.4); }
  100%     { opacity: 0; }
}
@keyframes jgPaste {
  0%, 28%  { opacity: 0; transform: translate(-50%, 6px) scale(0.9); }
  34%      { opacity: 1; transform: translate(-50%, 0) scale(1); }
  44%      { transform: translate(-50%, 0) scale(0.94); }  /* react to tap */
  48%      { transform: translate(-50%, 0) scale(1); }
  60%      { opacity: 1; }
  68%      { opacity: 0; transform: translate(-50%, 0) scale(1); }
  100%     { opacity: 0; }
}
@keyframes jgLine {
  0%, 100% { opacity: 0; transform: scaleX(0); }
  /* delays stagger the three lines; each plays its fill within the window */
  10%      { opacity: 1; transform: scaleX(1); }
  78%      { opacity: 1; transform: scaleX(1); }
  92%      { opacity: 0; transform: scaleX(0); }
}
@keyframes jgPlaceholder {
  0%, 40%  { opacity: 1; }
  46%      { opacity: 0; }
  88%      { opacity: 0; }
  96%      { opacity: 1; }
  100%     { opacity: 1; }
}

.jg-finger    { animation: jgFinger 4.2s ease-in-out infinite; }
.jg-ripple    { animation: jgRipple 4.2s ease-out infinite; }
.jg-paste     { animation: jgPaste 4.2s ease-in-out infinite; }
.jg-line      { transform-origin: left center; animation: jgLine 4.2s ease-out infinite; }
.jg-placeholder { animation: jgPlaceholder 4.2s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .jg-finger, .jg-ripple, .jg-paste, .jg-line, .jg-placeholder { animation: none; }
  .jg-paste { opacity: 1; transform: translate(-50%, 0); }
  .jg-line  { opacity: 1; transform: scaleX(1); }
  .jg-placeholder { opacity: 0; }
}
`;
