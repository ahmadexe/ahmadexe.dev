"use client";

import { useEffect, useRef } from "react";
import { useLenis } from "lenis/react";

export type Waypoint = {
  p: number;
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
  /** Camera roll (radians) about the view axis at this waypoint. */
  roll: number;
};

const TAU = Math.PI * 2;

// The camera orbits ONE subject at the origin — the morphing particle cloud —
// but the path is a stunt reel, not a polite orbit. It dives UNDER the ring
// plane, corkscrews a full 360° barrel roll while crossing BEHIND the subject,
// drops to the deck and skims the wire terrain through the data spires, then
// launches into a vertigo crane and a near-vertical god shot before the wide
// galaxy pull-back. Roll is keyframed per waypoint (monotonically increasing
// so the corkscrew unwinds forward, never backward — TAU ≡ 0 at rest). FOV
// breathes against the moves: it blows wide on the fly-by/skim (speed) and
// clamps tight as the crane rises (vertigo), which is what sells the g-force.
export const WAYPOINTS: Waypoint[] = [
  { p: 0.0, pos: [0, 0.4, 10], look: [-2.6, 0.3, 0], fov: 50, roll: 0 }, // hero: subject right of the headline
  { p: 0.1, pos: [5.4, -2.4, 7.2], look: [-0.5, 0, 0], fov: 55, roll: -0.18 }, // bank right, dive below the ring plane
  { p: 0.2, pos: [7.8, -0.4, 2.2], look: [0, 0, 0], fov: 64, roll: 0.1 }, // low-angle rush at the ring gap
  { p: 0.32, pos: [2.6, 1.6, -6.6], look: [0, 0, 0], fov: 70, roll: TAU }, // corkscrew: full 360° roll crossing behind the subject
  { p: 0.44, pos: [-6.2, -3.2, -3.0], look: [0, -0.6, 0], fov: 64, roll: TAU - 0.1 }, // drop to the deck on the far side
  { p: 0.56, pos: [-9.2, -3.2, 3.6], look: [0, 0.4, 0], fov: 58, roll: TAU + 0.12 }, // terrain skim through the spire field
  { p: 0.68, pos: [-3.0, 8.6, 2.8], look: [0, 0.4, 0], fov: 44, roll: TAU }, // vertigo crane: rockets up while FOV clamps tight
  { p: 0.78, pos: [2.6, 10.8, 2.2], look: [0, 0, 0], fov: 40, roll: TAU }, // god shot: near-vertical look-down through the spires
  { p: 0.9, pos: [4.4, 4.2, 9.2], look: [0, 0.2, 0], fov: 47, roll: TAU }, // swoop back down, framing the diamond
  { p: 1.0, pos: [0, 3.2, 14.5], look: [0, 1.0, 0], fov: 44, roll: TAU }, // wide pull-back — galaxy low, nebula sky and ring gate above
];

/** Position within the current shape morph, 0..1 (5 shapes → 4 segments). */
export function morphOf(p: number) {
  const c = Math.min(Math.max(p, 0), 0.9999) * 4;
  return c - Math.floor(c);
}

/**
 * Scene-wide morph pulse: peaks mid-transition (when the particle cloud
 * scatters) and is gated by scroll velocity so a page resting mid-chapter
 * doesn't hold a permanent flash — the sky, terrain shockwave, ring gate and
 * camera kick all key off this one curve.
 */
export function pulseOf(morph: number, velocity: number) {
  return (
    Math.sin(morph * Math.PI) * (0.3 + 0.7 * Math.min(1, velocity * 2.5))
  );
}

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
