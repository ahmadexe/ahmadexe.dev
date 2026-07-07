"use client";

import { useEffect, useRef } from "react";
import { useFx } from "@/components/site/fxStore";

const GLYPHS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFXYZ$+-*/=%#&_";

/**
 * The `matrix` command: digital rain falling OVER the page itself — DOM,
 * terminal, everything. mix-blend screen keeps black transparent so glyphs
 * read as light on top of the content; destination-out fading gives trails
 * without painting over the site (same trick as the Singularity vortex).
 */
export function RainOverlay() {
  const { rain } = useFx();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!rain) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const dpr = 1; // full-viewport canvas — keep the pixel count down
    const resize = () => {
      c.width = Math.floor(window.innerWidth * dpr);
      c.height = Math.floor(window.innerHeight * dpr);
      c.style.width = `${window.innerWidth}px`;
      c.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const cell = 16;
    const cols = () => Math.ceil(window.innerWidth / cell);

    type Drop = { y: number; speed: number; len: number };
    let drops: Drop[] = [];
    const seed = () => {
      drops = Array.from({ length: cols() }, () => ({
        y: Math.random() * -60,
        speed: 0.35 + Math.random() * 0.75,
        len: 10 + Math.random() * 18,
      }));
    };
    seed();

    ctx.font = `${cell - 2}px monospace`;
    ctx.textBaseline = "top";

    let raf = 0;
    let running = true;
    let last = performance.now();

    const draw = (now: number) => {
      if (!running) return;
      const dt = Math.min(50, now - last) / 16.7;
      last = now;

      // Fade previous frame (erase, don't paint black — see header comment).
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = "source-over";

      if (drops.length !== cols()) seed();

      for (let x = 0; x < drops.length; x++) {
        const d = drops[x];
        d.y += d.speed * dt;
        const gy = Math.floor(d.y);
        const px = x * cell;
        const py = gy * cell;
        if (py > window.innerHeight + d.len * cell) {
          d.y = Math.random() * -30;
          d.speed = 0.35 + Math.random() * 0.75;
          continue;
        }
        // Head glyph — near-white green, glowing.
        ctx.fillStyle = "rgba(190,255,210,0.95)";
        ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], px, py);
        // A couple of trailing glyphs re-rolled dimmer for shimmer.
        ctx.fillStyle = "rgba(0,255,65,0.5)";
        ctx.fillText(
          GLYPHS[(Math.random() * GLYPHS.length) | 0],
          px,
          py - cell
        );
        ctx.fillStyle = "rgba(0,255,65,0.22)";
        ctx.fillText(
          GLYPHS[(Math.random() * GLYPHS.length) | 0],
          px,
          py - cell * 2
        );
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [rain]);

  if (!rain) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[65] pointer-events-none"
      style={{ mixBlendMode: "screen" }}
      aria-hidden
    />
  );
}
