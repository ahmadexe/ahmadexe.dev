"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { sound, useSound } from "./SoundEngine";

// The mute toggle + the glue that feeds the engine. Lives fixed in the corner.
// Feeds scroll velocity into the wind layer, and turns global events
// (section change, ACCESS GRANTED, singularity) into one-shot hits so the rest
// of the app can stay audio-agnostic — it just dispatches events.

export function SoundToggle() {
  const on = useSound();
  const [pulse, setPulse] = useState(true);
  const raf = useRef(0);

  useEffect(() => {
    sound.hydrate();
  }, []);

  // Scroll velocity → wind.
  useLenis((l) => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const v = Math.min(1, Math.abs(l.velocity ?? 0) / 40);
      sound.setVelocity(v);
    });
  });

  // Event-driven one-shots. (No per-section blip — it read as a toy-phone
  // "tun-tun-tun"; the ambient drone + scroll wind carry section changes.)
  useEffect(() => {
    const onBoom = () => sound.hit("boom");
    const onWarp = () => sound.hit("warp");
    const onTick = () => sound.tick();
    window.addEventListener("termolio:accessgranted", onBoom);
    window.addEventListener("termolio:singularity", onWarp);
    window.addEventListener("termolio:keytick", onTick);
    return () => {
      window.removeEventListener("termolio:accessgranted", onBoom);
      window.removeEventListener("termolio:singularity", onWarp);
      window.removeEventListener("termolio:keytick", onTick);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label={on ? "mute sound" : "enable sound"}
      aria-pressed={on}
      data-cursor="hover"
      onClick={() => {
        setPulse(false);
        sound.toggle();
      }}
      className="fixed bottom-5 left-5 z-[80] flex items-center gap-2 px-3 py-2 rounded-md border border-matrix/30 bg-black/60 backdrop-blur-sm font-mono text-[10px] uppercase tracking-[0.3em] text-matrix/80 hover:border-matrix/60 hover:text-matrix transition-colors"
    >
      {/* Little equalizer — bars animate only while sound is on. */}
      <span className="flex items-end gap-[2px] h-3">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`w-[2px] bg-matrix ${on ? "eq-bar" : "opacity-40"}`}
            style={
              on
                ? { animationDelay: `${i * 0.12}s`, height: "100%" }
                : { height: `${[40, 70, 50, 90][i]}%` }
            }
          />
        ))}
      </span>
      <span className={pulse && !on ? "animate-pulse" : ""}>
        {on ? "sound on" : "sound off"}
      </span>
    </button>
  );
}
