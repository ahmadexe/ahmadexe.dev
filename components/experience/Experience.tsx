"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { experiences } from "@/lib/data";

export function Experience() {
  return (
    <section id="experience" className="relative py-32 md:py-40">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10">
        <SectionHeader
          index="05"
          eyebrow="./history"
          title="Where I've done the work."
          subtitle="Places, in reverse chronological order."
        />

        <div className="relative max-w-4xl mx-auto pl-8 md:pl-16">
          {/* vertical spine */}
          <div className="absolute left-0 md:left-6 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-matrix/40 to-transparent" />

          {experiences.map((x, i) => (
            <TimelineNode key={x.company} idx={i}>
              <div className="flex items-baseline gap-3 flex-wrap mb-2">
                <h3 className="font-display text-2xl md:text-3xl font-bold text-ink glow-matrix">
                  {x.company}
                </h3>
                <span className="text-xs text-matrix uppercase tracking-widest flex items-center gap-2">
                  {x.current && (
                    <span className="w-1.5 h-1.5 bg-matrix rounded-full animate-pulse shadow-[0_0_8px_var(--matrix)]" />
                  )}
                  {x.period}
                </span>
              </div>
              <div className="text-cyan-accent text-sm mb-3">{x.role}</div>
              <p className="text-ink-dim/80 text-sm md:text-base leading-relaxed">
                {x.description}
              </p>
            </TimelineNode>
          ))}
        </div>
      </div>
    </section>
  );
}

function TimelineNode({
  idx,
  children,
}: {
  idx: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: idx * 0.08 }}
      className="relative pb-14 last:pb-0"
    >
      {/* node marker */}
      <div className="absolute -left-8 md:-left-16 top-2 flex items-center">
        <span className="relative w-3 h-3">
          <span className="absolute inset-0 rounded-full bg-matrix shadow-[0_0_12px_var(--matrix)]" />
          <span className="absolute inset-[-4px] rounded-full border border-matrix/40 animate-ping" />
        </span>
        <span className="hidden md:block h-px w-8 bg-matrix/40 ml-1" />
      </div>
      {children}
    </motion.div>
  );
}
