"use client";

// Site-wide mutable state that the shell can drive: theme, in-place project
// filter, and a "root" mode. The shell is the ONLY writer — components are
// read-only subscribers via useSite(). This is what turns the terminal from
// a section into the site's control plane.

import { useSyncExternalStore } from "react";

export type Theme = "matrix" | "amber" | "mono" | "synth";
export const THEMES: Theme[] = ["matrix", "amber", "mono", "synth"];

type State = {
  theme: Theme;
  projectFilter: string;
  unlocked: boolean;
};

let state: State = {
  theme: "matrix",
  projectFilter: "",
  unlocked: false,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  // Themes are just CSS var swaps under [data-theme] — every text-matrix,
  // border-matrix, glow, etc. flips automatically because they all resolve
  // through --matrix / --matrix-soft / --matrix-deep.
  document.documentElement.setAttribute("data-theme", t);
}

function applyRoot(on: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("root-unlocked", on);
}

export const site = {
  getState: (): State => state,

  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  setTheme(t: Theme) {
    state = { ...state, theme: t };
    applyTheme(t);
    emit();
  },

  setProjectFilter(q: string) {
    state = { ...state, projectFilter: q };
    emit();
  },

  unlock() {
    if (state.unlocked) return;
    state = { ...state, unlocked: true };
    applyRoot(true);
    emit();
  },

  reset() {
    state = { theme: "matrix", projectFilter: "", unlocked: false };
    applyTheme("matrix");
    applyRoot(false);
    emit();
  },
};

export function useSite(): State {
  return useSyncExternalStore(site.subscribe, site.getState, site.getState);
}
