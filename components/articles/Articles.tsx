"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { articles } from "@/lib/data";

export function Articles() {
  return (
    <section id="articles" className="relative py-32 md:py-40">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10">
        <SectionHeader
          index="08"
          eyebrow="./writing"
          crumb="~/articles $ cat *.md | less"
          title="Notes, in longer form."
          subtitle="Occasional deep dives on the things I build."
        />

        <div className="max-w-4xl mx-auto divide-y divide-matrix/10 border-y border-matrix/10">
          {articles.map((a, i) => (
            <ArticleRow key={a.title} idx={i} a={a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ArticleRow({
  a,
  idx,
}: {
  a: (typeof articles)[number];
  idx: number;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });

  return (
    <motion.a
      ref={ref}
      href={a.url}
      target="_blank"
      rel="noreferrer"
      data-cursor="hover"
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: idx * 0.08 }}
      className="group relative flex items-center justify-between gap-6 py-6 px-4 md:px-8 transition-colors hover:bg-matrix/5"
    >
      <div className="flex items-start gap-6 flex-1 min-w-0">
        <div className="text-matrix/40 text-xs uppercase tracking-[0.3em] mt-1 font-bold flex-shrink-0">
          {String(idx + 1).padStart(2, "0")}
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-xl md:text-2xl font-bold text-ink group-hover:text-matrix group-hover:glow-matrix transition-all">
            {a.title}
          </h3>
          <p className="text-ink-dim/60 text-sm mt-1 truncate">{a.blurb}</p>
        </div>
      </div>
      <div className="text-matrix text-2xl flex-shrink-0 group-hover:translate-x-2 transition-transform">
        →
      </div>
    </motion.a>
  );
}
