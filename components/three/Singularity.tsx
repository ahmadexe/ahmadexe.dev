"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { shell } from "@/components/terminal/shellStore";

type Phase = "idle" | "collapse" | "void" | "reboot";

// A "reality collapse" that fires when the shell hits a self-destruct command.
// The world itself is not transformed — animating a scale/rotate on a wrapper
// that contains a live WebGL canvas was fighting the compositor and never got
// smooth. Instead the collapse lives entirely inside an overlay stack that
// composites independently (own layer, GPU-friendly):
//   canvas    — swirling particle vortex + growing halo (mix-blend: screen)
//   vignette  — radial dark mask that grows from the edges inward, closing
//               the frame around the user's viewport (Framer Motion opacity)
//   text      — corrupt copy, then kernel-restore panel
// Timeline:
//   0.0s  collapse — vortex forms, vignette begins closing in from the edges
//   3.0s  void     — vignette hits max, everything black except the halo
//   5.0s  reboot   — kernel-restore boot log
//   6.9s  restore  — shell resets, overlay fades

const BOOT_LINES = [
  "kernel panic detected · rank-0 process init killed",
  "userland pulled past event horizon ...",
  "reconstituting reality from hawking radiation ...",
  "rebuilding /projects, /awards, /experience ...",
  "handoff to userland ....",
];

export function Singularity() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [cmd, setCmd] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Drive the phase machine off a single event.
  useEffect(() => {
    const on = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      setCmd((detail.cmd as string) || "");
      setPhase("collapse");
      const t1 = setTimeout(() => setPhase("void"), 3000);
      const t2 = setTimeout(() => setPhase("reboot"), 5000);
      const t3 = setTimeout(() => {
        shell.resetAll();
        setPhase("idle");
        window.dispatchEvent(new CustomEvent("termolio:singularity:end"));
      }, 6900);
      // No cleanup — the timers must run to completion.
      void t1;
      void t2;
      void t3;
    };
    window.addEventListener("termolio:singularity", on);
    return () => window.removeEventListener("termolio:singularity", on);
  }, []);

  // The world stays put — no class toggling, no transforms on #sing-root.

  // Particle vortex — a 2D canvas of streaks pulled inward and swirled tangentially.
  useEffect(() => {
    if (phase === "idle") return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    // Cap DPR at 1 during the collapse — a full-viewport canvas on a retina
    // display at DPR 2 is 4x the pixels to shade, which competes for GPU time
    // with the world's transform animation and can cause frame drops.
    const dpr = 1;
    const resize = () => {
      c.width = Math.floor(window.innerWidth * dpr);
      c.height = Math.floor(window.innerHeight * dpr);
      c.style.width = `${window.innerWidth}px`;
      c.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    type P = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      a: number;
      color: 0 | 1 | 2;
    };

    const N = 380;
    const particles: P[] = [];
    const spawn = (p: P) => {
      const angle = Math.random() * Math.PI * 2;
      const r = 220 + Math.random() * Math.max(W(), H()) * 0.75;
      p.x = W() / 2 + Math.cos(angle) * r;
      p.y = H() / 2 + Math.sin(angle) * r;
      p.vx = 0;
      p.vy = 0;
      p.a = 0.55 + Math.random() * 0.45;
      const roll = Math.random();
      p.color = roll < 0.75 ? 0 : roll < 0.9 ? 1 : 2;
    };
    for (let i = 0; i < N; i++) {
      const p: P = { x: 0, y: 0, vx: 0, vy: 0, a: 1, color: 0 };
      spawn(p);
      particles.push(p);
    }

    const started = performance.now();
    let raf = 0;
    let running = true;

    const draw = () => {
      if (!running) return;
      const cx = W() / 2;
      const cy = H() / 2;
      const t = (performance.now() - started) / 1000;
      const pullK = 3800 + Math.min(t, 3) * 3200;
      const horizon = 70 + Math.sin(t * 4) * 4;

      // Fade trails via destination-out so the black doesn't paint onto the
      // world underneath (canvas is mix-blend: screen — black would be invisible
      // anyway, but destination-out is the right primitive for "erase a bit").
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(0, 0, W(), H());
      ctx.globalCompositeOperation = "source-over";

      // Halo around the singularity — under screen blend this just brightens
      // whatever's behind, so the world gets irradiated toward the center.
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 340);
      halo.addColorStop(0, "rgba(0,255,65,0.95)");
      halo.addColorStop(0.18, "rgba(0,255,65,0.5)");
      halo.addColorStop(0.55, "rgba(0,180,60,0.15)");
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, W(), H());

      // Event horizon rim (bright — screen blend can only add).
      ctx.beginPath();
      ctx.arc(cx, cy, horizon, 0, Math.PI * 2);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "rgba(180,255,200,0.95)";
      ctx.stroke();

      // Accretion ring.
      ctx.beginPath();
      ctx.arc(cx, cy, horizon + 14, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,229,255,0.55)";
      ctx.lineWidth = 1;
      ctx.stroke();

      for (const p of particles) {
        const dx = cx - p.x;
        const dy = cy - p.y;
        const d2 = dx * dx + dy * dy;
        const d = Math.sqrt(d2) + 0.001;
        const pull = pullK / (d2 + 900);

        // Inward + tangential (counter-clockwise) = spiral.
        const nx = dx / d;
        const ny = dy / d;
        const tx = -ny;
        const ty = nx;

        p.vx += nx * pull + tx * pull * 0.95;
        p.vy += ny * pull + ty * pull * 0.95;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;

        const speed = Math.hypot(p.vx, p.vy);
        const stroke =
          p.color === 0
            ? `rgba(0,255,65,${p.a})`
            : p.color === 1
            ? `rgba(0,229,255,${p.a})`
            : `rgba(255,43,214,${p.a})`;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(
          p.x - p.vx * (2 + speed * 0.15),
          p.y - p.vy * (2 + speed * 0.15)
        );
        ctx.stroke();

        if (d < horizon + 6) spawn(p);
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [phase]);

  return (
    <AnimatePresence>
      {phase !== "idle" && (
        <motion.div
          key="singularity"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[95] pointer-events-none"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full block"
            style={{ mixBlendMode: "screen" }}
          />
          {/* Vignette carries the "reality closing in" feel. Two stacked
              layers, both animated on opacity only (GPU-cheap):
              1) A soft outer ring that starts at 0 and fades in over 3s,
                 darkening the edges while the world stays visible through
                 the center — this is the "collapse" beat.
              2) A near-opaque full-screen mask that fades in during void,
                 completing the blackout for the reboot handoff. */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{
              opacity: phase === "collapse" ? 0.95 : phase === "void" ? 1 : 0,
            }}
            transition={{ duration: 3, ease: "easeIn" }}
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 8%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0.95) 80%)",
            }}
          />
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{
              opacity: phase === "void" || phase === "reboot" ? 1 : 0,
            }}
            transition={{ duration: 1.4, ease: "easeIn" }}
            className="absolute inset-0 bg-black/95"
          />

          {(phase === "collapse" || phase === "void") && (
            <div className="absolute inset-x-0 top-[62%] flex justify-center px-6">
              <div className="max-w-2xl text-center">
                <div
                  className="font-mono text-danger glow-matrix-hard text-xs md:text-sm glitch tracking-widest uppercase"
                  data-text={`${cmd} → event horizon breached`}
                >
                  {`${cmd} → event horizon breached`}
                </div>
                <div className="mt-2 text-matrix/70 text-[10px] uppercase tracking-[0.4em]">
                  SIGSEGV · kernel: no such reality · rc = 0xDEAD
                </div>
              </div>
            </div>
          )}

          {phase === "reboot" && (
            <motion.div
              key="reboot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center justify-center bg-black/95"
            >
              <div className="pointer-events-none absolute inset-0 scanlines" />
              <div className="relative font-mono text-matrix text-center max-w-md w-full px-6">
                <div className="text-xs uppercase tracking-[0.4em] mb-4 text-matrix/70">
                  // kernel restore
                </div>
                <div className="space-y-1 text-[11px] md:text-xs text-left">
                  {BOOT_LINES.map((l, i) => (
                    <motion.div
                      key={l}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 * i, duration: 0.2 }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-matrix/50">&gt;</span>
                      <span className="glow-matrix">{l}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-5 h-1 w-full bg-matrix/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-matrix shadow-[0_0_10px_var(--matrix)]"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.6, ease: "easeInOut" }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
