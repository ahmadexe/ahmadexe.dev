"use client";

import { useEffect, useRef } from "react";
import { useLenis } from "lenis/react";

export type Waypoint = {
  p: number;
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
};

// The camera orbits ONE subject at the origin — the morphing particle cloud —
// instead of travelling down a corridor of separate props. Extra stops between
// the morph boundaries (0, .25, .5, .75, 1) give each chapter a travelling
// move instead of a single held angle: a close fly-by through the orbital
// rings, a high crane, then a wide pull-back for the galaxy dispersal. FOV
// breathes with the move — tight on the fly-by, wide on the finale — which is
// what sells the "flying through a world" feel.
export const WAYPOINTS: Waypoint[] = [
  { p: 0.0, pos: [0, 0.4, 10], look: [-2.6, 0.3, 0], fov: 50 }, // hero: subject right of the headline
  { p: 0.13, pos: [4.5, -1.2, 7.5], look: [-0.5, 0, 0], fov: 54 }, // swing right, drop low
  { p: 0.3, pos: [7.2, 1.2, 3.2], look: [0, 0, 0], fov: 62 }, // close fly-by inside the rings
  { p: 0.5, pos: [-5.8, 2.6, 6.6], look: [0, 0, 0], fov: 55 }, // cross to the far side
  { p: 0.66, pos: [-2, 6.8, 4.6], look: [0, 0.6, 0], fov: 50 }, // high crane over the peak
  { p: 0.82, pos: [3.6, 4.4, 8.2], look: [0, 0.2, 0], fov: 47 }, // settle back, framing the diamond
  { p: 1.0, pos: [0, 2.4, 14.5], look: [0, 0, 0], fov: 42 }, // wide pull-back into the galaxy
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
