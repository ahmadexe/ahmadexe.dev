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
          title="Rooms I've spoken in."
          subtitle="Talks, meetups, and the odd bootcamp. Mostly Flutter, occasionally something else."
        />

        <div className="relative max-w-5xl mx-auto">
          <Waveform />
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

function Waveform() {
  const bars = Array.from({ length: 48 });
  return (
    <div className="pointer-events-none flex items-end justify-center gap-[3px] md:gap-1 h-12 md:h-16 opacity-60">
      {bars.map((_, i) => (
        <motion.span
          key={i}
          className="w-[3px] md:w-[4px] bg-gradient-to-t from-matrix/80 to-cyan-accent/80 shadow-[0_0_6px_var(--matrix)]"
          initial={{ scaleY: 0.2 }}
          animate={{
            scaleY: [
              0.2,
              0.4 + Math.sin(i * 0.6) * 0.3 + 0.4,
              0.3,
              0.6 + Math.cos(i * 0.4) * 0.3 + 0.2,
              0.2,
            ],
          }}
          transition={{
            duration: 2.2 + (i % 5) * 0.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: (i % 12) * 0.05,
          }}
          style={{ transformOrigin: "bottom", height: "100%" }}
        />
      ))}
    </div>
  );
}
