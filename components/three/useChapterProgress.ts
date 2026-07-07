"use client";

import { useEffect, useRef } from "react";
import { useLenis } from "lenis/react";

export type Waypoint = {
  p: number;
  pos: [number, number, number];
  look: [number, number, number];
};

// The camera orbits ONE subject at the origin — the morphing particle cloud —
// instead of travelling down a corridor of separate props. Progress stops line
// up with the morph's shape boundaries (0, .25, .5, .75, 1) so each shape gets
// its own camera angle: front → swing right → swing left/up → high peak →
// pull back wide for the galaxy dispersal.
export const WAYPOINTS: Waypoint[] = [
  { p: 0.0, pos: [0, 0, 9], look: [0, 0, 0] },
  { p: 0.25, pos: [6.5, -1.5, 6.5], look: [0, 0, 0] },
  { p: 0.5, pos: [-6, 2.5, 7], look: [0, 0, 0] },
  { p: 0.75, pos: [3.5, 5, 7.5], look: [0, 0, 0] },
  { p: 1.0, pos: [0, 1.5, 13], look: [0, 0, 0] },
];

export function useProgressRef() {
  const ref = useRef(0);
  useLenis((l) => {
    ref.current = l.progress ?? 0;
  });
  useEffect(() => {
    // fallback if Lenis isn't emitting yet (SSR hydration edge)
    const onScroll = () => {
      if (typeof window === "undefined") return;
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      ref.current = Math.min(1, Math.max(0, window.scrollY / max));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return ref;
}

/**
 * Normalized (0..1) scroll velocity, smoothed. Feeds "warp" effects across the
 * scene — matrix rain speed, chromatic aberration, camera z-roll — so the whole
 * frame reacts to how hard the user is scrolling.
 */
export function useVelocityRef() {
  const ref = useRef(0);
  useLenis((l) => {
    const v = Math.min(1, Math.abs(l.velocity ?? 0) / 60);
    // ease toward the new value so it doesn't spike per-frame
    ref.current += (v - ref.current) * 0.25;
  });
  return ref;
}

export function pickSegment(t: number): [Waypoint, Waypoint, number] {
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    const a = WAYPOINTS[i];
    const b = WAYPOINTS[i + 1];
    if (t >= a.p && t <= b.p) {
      const raw = (t - a.p) / (b.p - a.p);
      const k = raw * raw * (3 - 2 * raw); // smoothstep
      return [a, b, k];
    }
  }
  if (t < WAYPOINTS[0].p) return [WAYPOINTS[0], WAYPOINTS[0], 0];
  const last = WAYPOINTS[WAYPOINTS.length - 1];
  return [last, last, 1];
}
