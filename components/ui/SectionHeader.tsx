"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function SectionHeader({
  index,
  eyebrow,
  crumb,
  title,
  subtitle,
}: {
  index?: string;
  eyebrow: string;
  // Tiny shell-prompt breadcrumb rendered above the eyebrow, e.g.
  // "~/projects $ ls" — makes every section read as a page of the shell
  // rather than a self-contained block.
  crumb?: string;
  title: string;
  subtitle?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <div ref={ref} className="mb-16 md:mb-24">
      {crumb && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-3 font-mono text-[11px] text-matrix/70"
          aria-hidden
        >
          <span className="text-matrix/40">$</span>{" "}
          <span className="text-matrix/80">{crumb}</span>
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-4 mb-6 text-matrix text-xs uppercase tracking-[0.4em]"
      >
        {index && <span className="opacity-60">{index}</span>}
        <span className="h-px w-16 bg-matrix/40" />
        <span className="section-eyebrow">{eyebrow}</span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-ink glow-matrix leading-[1.05]"
      >
        {title}
      </motion.h2>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 text-ink-dim/80 max-w-2xl text-sm md:text-base"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
