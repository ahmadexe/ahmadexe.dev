"use client";

// Fully synthesized ambient sound — no audio files. A singleton that owns one
// AudioContext and a small graph:
//
//   drone   : two detuned saws + a sub sine → lowpass (slow LFO) → droneGain
//   wind    : filtered white noise → bandpass → windGain  (scroll velocity)
//   master  : everything → masterGain → destination
//
// Nothing is created until enable() runs inside a user gesture, so we never
// trip the browser autoplay policy. State is mirrored to a store so React can
// render the toggle and subscribe.

import { useSyncExternalStore } from "react";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let droneGain: GainNode | null = null;
let windGain: GainNode | null = null;
let windFilter: BiquadFilterNode | null = null;
let started = false;

let enabled = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const STORAGE_KEY = "termolio-sound";

function now() {
  return ctx ? ctx.currentTime : 0;
}

function buildGraph() {
  if (started || typeof window === "undefined") return;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  started = true;

  master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);

  // --- ambient drone ---
  droneGain = ctx.createGain();
  droneGain.gain.value = 0.12;
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.value = 420;
  droneFilter.Q.value = 6;
  droneGain.connect(master);
  droneFilter.connect(droneGain);

  // Root ~ D2. Two detuned saws + a sub give a warm, sci-fi pad.
  const freqs = [73.42, 73.42 * 1.005, 110.0];
  const types: OscillatorType[] = ["sawtooth", "sawtooth", "sine"];
  freqs.forEach((f, i) => {
    const osc = ctx!.createOscillator();
    osc.type = types[i];
    osc.frequency.value = f;
    const g = ctx!.createGain();
    g.gain.value = i === 2 ? 0.5 : 0.3;
    osc.connect(g);
    g.connect(droneFilter);
    osc.start();
  });

  // Slow filter sweep so the pad breathes.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.05;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 220;
  lfo.connect(lfoGain);
  lfoGain.connect(droneFilter.frequency);
  lfo.start();

  // --- scroll wind ---
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  noise.loop = true;
  windFilter = ctx.createBiquadFilter();
  windFilter.type = "bandpass";
  windFilter.frequency.value = 600;
  windFilter.Q.value = 0.8;
  windGain = ctx.createGain();
  windGain.gain.value = 0.0001;
  noise.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(master);
  noise.start();
}

function fadeMaster(to: number, time = 0.6) {
  if (!ctx || !master) return;
  master.gain.cancelScheduledValues(now());
  master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now());
  master.gain.exponentialRampToValueAtTime(Math.max(0.0001, to), now() + time);
}

export const sound = {
  isEnabled: () => enabled,

  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  /** Read the persisted preference (call once on mount). */
  hydrate() {
    if (typeof window === "undefined") return;
    // We never auto-start audio (autoplay policy) — hydrate only reflects the
    // stored intent so the toggle shows the right state; the first click builds
    // the graph.
    const pref = window.localStorage.getItem(STORAGE_KEY);
    if (pref === "on") {
      // Leave disabled until a gesture; the toggle will resume.
      enabled = false;
      emit();
    }
  },

  async enable() {
    buildGraph();
    if (ctx && ctx.state === "suspended") await ctx.resume();
    enabled = true;
    fadeMaster(0.5, 0.8);
    try {
      window.localStorage.setItem(STORAGE_KEY, "on");
    } catch {
      /* ignore */
    }
    emit();
  },

  disable() {
    enabled = false;
    fadeMaster(0.0001, 0.4);
    try {
      window.localStorage.setItem(STORAGE_KEY, "off");
    } catch {
      /* ignore */
    }
    emit();
  },

  toggle() {
    if (enabled) this.disable();
    else void this.enable();
  },

  /** Scroll velocity 0..1 → wind level + a touch of filter movement. */
  setVelocity(v: number) {
    if (!enabled || !windGain || !windFilter || !ctx) return;
    const target = Math.min(0.09, v * 0.12) + 0.0001;
    windGain.gain.setTargetAtTime(target, now(), 0.15);
    windFilter.frequency.setTargetAtTime(500 + v * 1600, now(), 0.15);
  },

  /** A short enveloped tone. `kind` picks register/timbre. */
  hit(kind: "section" | "boom" | "warp" = "section") {
    if (!enabled || !ctx || !master) return;
    const t = now();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";

    if (kind === "boom") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(38, t + 0.5);
      f.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.6, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      osc.connect(f);
      f.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + 1.2);
    } else if (kind === "warp") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.4);
      f.frequency.value = 1800;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.28, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      osc.connect(f);
      f.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + 0.65);
    } else {
      // section: a soft two-tone blip
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, t);
      osc.frequency.exponentialRampToValueAtTime(783.99, t + 0.12);
      f.frequency.value = 2400;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.14, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(f);
      f.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + 0.25);
    }
  },

  /** Tiny keystroke click for the terminals. */
  tick() {
    if (!enabled || !ctx || !master) return;
    const t = now();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(1400 + Math.random() * 500, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 0.06);
  },
};

export function useSound() {
  return useSyncExternalStore(
    sound.subscribe,
    sound.isEnabled,
    sound.isEnabled
  );
}
