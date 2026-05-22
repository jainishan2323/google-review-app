"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const SLIDES = [
  { src: "/screenshots/one.png",   alt: "Jugnoo dashboard overview" },
  { src: "/screenshots/two.png",   alt: "Review management" },
  { src: "/screenshots/three.png", alt: "AI reply suggestions" },
  { src: "/screenshots/four.png",  alt: "Weekly digest" },
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

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border shadow-2xl">
      <style>{`
        @keyframes slide-fade-in {
          from { opacity: 0; transform: scale(1.015); }
          to   { opacity: 1; transform: scale(1); }
        }
        .slide-in {
          animation: slide-fade-in 500ms ease forwards;
        }
      `}</style>

      {/* key={current} remounts the div on each slide change, re-triggering the animation */}
      <div key={current} className="slide-in" style={{ lineHeight: 0 }}>
        <Image
          src={SLIDES[current].src}
          alt={SLIDES[current].alt}
          width={1280}
          height={800}
          className="w-full object-cover"
          priority={current === 0}
          quality={85}
        />
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrent(i); startTimer(); }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-5 bg-white" : "w-1.5 bg-white/40"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
