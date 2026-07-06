"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { talks } from "@/lib/data";

export function Speaking() {
  return (
    <section id="speaking" className="relative py-24 md:py-40">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10">
        <SectionHeader
          index="07"
          eyebrow="./mic"
          crumb="~/speaking $ ls -t"
          title="Rooms I've spoken in."
          subtitle="Talks, meetups, and the odd bootcamp. Mostly Flutter, occasionally something else."
        />

        <div className="relative max-w-5xl mx-auto">
          <BroadcastReadout />
          <div className="relative grid sm:grid-cols-2 gap-4 md:gap-6 mt-8">
            {talks.map((t, i) => (
              <TalkCard key={t.title} t={t} idx={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TalkCard({
  t,
  idx,
}: {
  t: (typeof talks)[number];
  idx: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: idx * 0.06 }}
      className="group relative border border-matrix/20 bg-bg-panel/30 backdrop-blur-sm p-5 md:p-6 hover:border-matrix/60 hover:bg-matrix/5 transition-all"
      data-cursor="hover"
    >
      <span className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-matrix/60" />
      <span className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-matrix/60" />

      <div className="flex items-center gap-3 mb-3">
        <span className="text-matrix text-lg glow-matrix">▲</span>
        <span className="text-[10px] md:text-xs text-matrix uppercase tracking-[0.3em]">
          talk.{String(idx + 1).padStart(2, "0")}
        </span>
      </div>

      <h3 className="font-display text-lg md:text-xl font-bold text-ink leading-tight group-hover:text-matrix group-hover:glow-matrix transition-colors">
        {t.title}
      </h3>
      <div className="mt-2 text-cyan-accent text-xs uppercase tracking-widest">
        {t.host}
      </div>
      <div className="mt-1 text-ink-dim/60 text-xs">{t.location}</div>
    </motion.div>
  );
}

/**
 * Broadcast readout — a transmission-console strip. Meta line (channel /
 * carrier / status), a scanning line with a live cursor, and a stack of
 * pulsing rings on the right that mimic a signal going out. No bar EQ.
 */
function BroadcastReadout() {
  const rings = [0, 1, 2, 3];
  return (
    <div className="pointer-events-none select-none border border-matrix/25 bg-matrix/[0.02] backdrop-blur-sm relative overflow-hidden">
      <span className="absolute -top-px -left-px w-3 h-3 border-t border-l border-matrix/70" />
      <span className="absolute -top-px -right-px w-3 h-3 border-t border-r border-matrix/70" />
      <span className="absolute -bottom-px -left-px w-3 h-3 border-b border-l border-matrix/70" />
      <span className="absolute -bottom-px -right-px w-3 h-3 border-b border-r border-matrix/70" />

      <div className="flex items-center justify-between px-4 md:px-6 pt-3 text-[10px] uppercase tracking-[0.3em] text-ink-dim/50">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-matrix">
            <span className="w-1.5 h-1.5 bg-matrix rounded-full animate-pulse shadow-[0_0_8px_var(--matrix)]" />
            on air
          </span>
          <span className="hidden sm:inline">ch.07 // ./mic</span>
          <span className="hidden md:inline">carrier 108.4 MHz</span>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <span>bitrate 320k</span>
          <span className="text-matrix/70">signal.locked</span>
        </div>
      </div>

      <div className="relative px-4 md:px-6 py-4 flex items-center gap-4 md:gap-6">
        {/* Scan strip */}
        <div className="relative flex-1 h-8 md:h-10 overflow-hidden">
          {/* Tick baseline */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-matrix/25" />
          <div
            className="absolute inset-y-0 inset-x-0 opacity-40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, var(--matrix) 0 1px, transparent 1px 22px)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
              maskImage:
                "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            }}
          />
          {/* Traveling cursor + trail */}
          <motion.div
            className="absolute top-0 h-full w-16 md:w-24"
            initial={{ x: "-10%" }}
            animate={{ x: ["-10%", "110%"] }}
            transition={{
              duration: 4.2,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="h-full w-full bg-gradient-to-r from-transparent via-matrix/40 to-matrix" />
            <div className="absolute right-0 top-0 h-full w-px bg-matrix shadow-[0_0_12px_var(--matrix)]" />
          </motion.div>
        </div>

        {/* Broadcast rings */}
        <div className="relative w-14 h-10 md:w-20 md:h-12 shrink-0">
          <span className="absolute inset-y-0 left-0 flex items-center">
            <span className="w-1.5 h-1.5 bg-matrix rounded-full shadow-[0_0_10px_var(--matrix)]" />
          </span>
          {rings.map((i) => (
            <motion.span
              key={i}
              className="absolute left-0 top-1/2 -translate-y-1/2 border border-matrix rounded-full"
              initial={{ width: 8, height: 8, opacity: 0 }}
              animate={{
                width: [8, 80],
                height: [8, 80],
                opacity: [0.9, 0],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeOut",
                delay: i * 0.6,
              }}
              style={{ marginLeft: -4, marginTop: 0 }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 md:px-6 pb-3 text-[10px] uppercase tracking-[0.3em] text-ink-dim/40">
        <span>// transmitting</span>
        <span className="hidden sm:inline">rooms indexed: {talks.length.toString().padStart(2, "0")}</span>
        <span>utf-8</span>
      </div>
    </div>
  );
}
