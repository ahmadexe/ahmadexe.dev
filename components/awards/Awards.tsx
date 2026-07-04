"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TiltCard } from "@/components/ui/TiltCard";
import { awards } from "@/lib/data";

export function Awards() {
  return (
    <section id="awards" className="relative py-32 md:py-40">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10">
        <SectionHeader
          index="06"
          eyebrow="./wins"
          title="The occasional win."
          subtitle="Trophies collected along the way. A few judges, and a few first prizes."
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {awards.map((a, i) => (
            <AwardCard key={a.title} idx={i} a={a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AwardCard({
  a,
  idx,
}: {
  a: (typeof awards)[number];
  idx: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: idx * 0.07 }}
    >
      <TiltCard intensity={8}>
        <div className="relative border border-matrix/20 bg-bg-panel/30 backdrop-blur-sm p-6 h-full min-h-[220px] flex flex-col hover:border-matrix/60 hover:bg-matrix/5 transition-all duration-300 group">
          {/* corner cuts */}
          <span className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-matrix/60" />
          <span className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-matrix/60" />

          <div className="flex items-center justify-between mb-4">
            <span className="text-matrix text-lg glow-matrix">◈</span>
            <span className="text-xs text-matrix uppercase tracking-widest">
              {a.year}
            </span>
          </div>

          <h3 className="font-display text-lg font-bold text-ink leading-tight mb-2">
            {a.title}
          </h3>
          {a.place && (
            <div className="text-cyan-accent text-xs uppercase tracking-widest mb-3">
              {a.place}
            </div>
          )}
          <p className="text-ink-dim/70 text-xs md:text-sm leading-relaxed flex-1">
            {a.description}
          </p>

          <div className="mt-4 h-px w-full bg-gradient-to-r from-matrix/50 to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />
        </div>
      </TiltCard>
    </motion.div>
  );
}
