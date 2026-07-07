"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
  { src: "/screenshots/two.png",   alt: "Review overview",            title: "Review overview" },
  { src: "/screenshots/three.png", alt: "Detailed review analysis",   title: "Detailed review analysis" },
  { src: "/screenshots/four.png",  alt: "AI assisted reply to users", title: "AI assisted reply" },
];

const INTERVAL = 12000;

export function ScreenshotCarousel() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % SLIDES.length);
    }, INTERVAL);
  };

  const go = (i: number) => {
    setCurrent((i + SLIDES.length) % SLIDES.length);
    startTimer();
  };

  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) go(current + (diff > 0 ? 1 : -1));
    touchStartX.current = null;
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-border shadow-2xl"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        @keyframes slide-fade-in {
          from { opacity: 0; transform: scale(1.015); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes title-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-in { animation: slide-fade-in 500ms ease forwards; }
        .title-in { animation: title-fade-in 300ms ease forwards; }
      `}</style>

      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
        <Image
          key={current}
          src={SLIDES[current].src}
          alt={SLIDES[current].alt}
          width={1920}
          height={1080}
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="slide-in absolute inset-0 h-full w-full object-cover"
          priority={current === 0}
          quality={85}
        />
      </div>

      {/* Bottom bar — gradient + title + arrows */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-5 pb-4 pt-12"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)" }}>
        <span key={current} className="title-in text-sm font-medium text-white/90">
          {SLIDES[current].title}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => go(current - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-[2.5rem] text-center text-xs tabular-nums text-white/60">
            {current + 1} / {SLIDES.length}
          </span>
          <button
            onClick={() => go(current + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            aria-label="Next slide"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
