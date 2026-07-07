"use client";

// Visual-mode state the shell can drive: ASCII rendering of the 3D world,
// scene-wide wireframe, and the full-page digital rain. Same contract as
// siteStore — the shell writes, components subscribe read-only via useFx().
//
// Glitch bursts are transient (not state): fx.burst() dispatches a window
// event that the postprocessing chain listens for, so a burst never causes
// a React re-render outside the canvas.

import { useSyncExternalStore } from "react";

type State = {
  ascii: boolean;
  wireframe: boolean;
  rain: boolean;
};

let state: State = {
  ascii: false,
  wireframe: false,
  rain: false,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  emit();
}

export const fx = {
  getState: (): State => state,

  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  setAscii(on: boolean) {
    set({ ascii: on });
    fx.burst(500);
  },

  setWireframe(on: boolean) {
    set({ wireframe: on });
    fx.burst(400);
  },

  setRain(on: boolean) {
    set({ rain: on });
  },

  /** Tear the frame for `ms` — picked up by the Glitch pass in PostFX. */
  burst(ms = 350) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("termolio:glitch", { detail: { ms } })
    );
  },

  reset() {
    set({ ascii: false, wireframe: false, rain: false });
  },
};

export function useFx(): State {
  return useSyncExternalStore(fx.subscribe, fx.getState, fx.getState);
}
