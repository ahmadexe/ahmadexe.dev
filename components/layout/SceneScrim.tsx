"use client";

import { useEffect, useRef } from "react";
import { useLenis } from "lenis/react";

/**
 * Radial-gradient scrim above the fixed WebGL background.
 * Opacity is driven by scroll progress via a per-chapter LUT so text-heavy
 * chapters (About/Projects/Experience) get more contrast, while spectacle
 * chapters (Hero/Awards) let the WebGL sing.
 */
const LUT: [number, number][] = [
  [0.0, 0.4],
  [0.14, 0.55],
  [0.28, 0.75],
  [0.45, 0.82],
  [0.58, 0.78],
  [0.7, 0.6],
  [0.82, 0.72],
  [1.0, 0.7],
];

function sample(t: number) {
  for (let i = 0; i < LUT.length - 1; i++) {
    const [a, av] = LUT[i];
    const [b, bv] = LUT[i + 1];
    if (t >= a && t <= b) {
      const k = (t - a) / (b - a);
      return av + (bv - av) * k;
    }
  }
  return LUT[LUT.length - 1][1];
}

export function SceneScrim() {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef(0.35);
  const current = useRef(0.35);

  useLenis((l) => {
    target.current = sample(l.progress ?? 0);
  });

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      current.current += (target.current - current.current) * 0.08;
      if (ref.current) {
        ref.current.style.opacity = current.current.toFixed(3);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] transition-none"
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%)",
        opacity: 0.35,
      }}
    />
  );
}
