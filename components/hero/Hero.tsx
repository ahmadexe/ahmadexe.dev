"use client";

import { motion } from "framer-motion";
import { Typewriter } from "@/components/ui/Typewriter";
import { identity } from "@/lib/data";
import { GlitchText } from "@/components/ui/GlitchText";

export function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen w-full overflow-hidden pt-24 pb-16"
    >
      {/* Gradient wash to keep text readable — 3D lives in the shared background canvas */}
      <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.4)_60%,rgba(0,0,0,0.75)_100%)]" />

      {/* Content */}
      <div className="relative z-30 max-w-[1600px] mx-auto px-6 md:px-12 flex flex-col justify-center min-h-[calc(100vh-6rem)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-matrix text-xs md:text-sm uppercase tracking-[0.4em] mb-6 section-eyebrow"
        >
          {identity.role} · {identity.location}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.4 }}
          className="font-display font-bold leading-[0.9] tracking-tight text-ink glow-matrix-hard select-none"
        >
          <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-[9rem]">
            <GlitchText text="MUHAMMAD" />
          </span>
          <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-[9rem]">
            <GlitchText text="AHMAD" className="text-matrix" />
            <span className="text-cyan-accent">.exe</span>
          </span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="mt-8 md:mt-10 max-w-2xl"
        >
          <div className="flex items-start gap-3 text-base md:text-lg text-ink-dim/90">
            <span className="text-matrix mt-0.5">$</span>
            <span className="flex-1">
              <Typewriter
                lines={[
                  "initializing portfolio.sys ... loading...",
                  identity.tagline,
                  "agentic AI · blockchain systems · dev tools",
                  "backend engineering · mobile app development",
                ]}
                loop
                speed={45}
              />
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.8 }}
          className="mt-12 flex flex-wrap items-center gap-4"
        >
          <a
            href="#terminal"
            data-cursor="hover"
            className="group relative inline-flex items-center gap-3 px-6 py-3 border border-matrix/60 bg-matrix/5 text-matrix hover:bg-matrix/15 hover:shadow-matrix-strong transition-all duration-300"
          >
            <span className="w-2 h-2 rounded-full bg-matrix animate-pulse shadow-[0_0_10px_var(--matrix)]" />
            <span className="font-bold uppercase tracking-widest text-sm">
              boot terminal
            </span>
            <span className="opacity-60 group-hover:translate-x-1 transition-transform">
              →
            </span>
          </a>
          <a
            href="#projects"
            data-cursor="hover"
            className="inline-flex items-center gap-3 px-6 py-3 border border-ink-dim/20 text-ink-dim hover:text-matrix hover:border-matrix/40 transition-all duration-300"
          >
            <span className="font-bold uppercase tracking-widest text-sm">
              view projects
            </span>
          </a>
        </motion.div>

        {/* Bottom telemetry row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2.2 }}
          className="mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl text-xs text-ink-dim/70"
        >
          <Telemetry label="SYSTEM" value="ONLINE" tone="matrix" />
          <Telemetry label="MISSIONS" value="10+ SHIPPED" />
          <Telemetry label="AWARDS" value="20+ CLAIMED" />
          <Telemetry label="UPTIME" value="∞" />
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{
          opacity: { delay: 2.4, duration: 0.6 },
          y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
        }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 text-ink-dim/50 text-xs uppercase tracking-widest flex flex-col items-center gap-2"
      >
        <span>scroll</span>
        <span className="w-px h-8 bg-gradient-to-b from-matrix to-transparent" />
      </motion.div>
    </section>
  );
}

function Telemetry({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "matrix";
}) {
  return (
    <div className="border-l border-matrix/30 pl-4">
      <div className="text-ink-dim/40 uppercase tracking-[0.3em] mb-1 text-[10px]">
        {label}
      </div>
      <div
        className={`font-bold ${tone === "matrix" ? "text-matrix glow-matrix" : "text-ink"}`}
      >
        {value}
      </div>
    </div>
  );
}
