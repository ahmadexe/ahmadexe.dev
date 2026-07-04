"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TiltCard } from "@/components/ui/TiltCard";
import { projects, type Project } from "@/lib/data";
import clsx from "clsx";

const accentMap = {
  matrix: {
    border: "border-matrix/40",
    borderHover: "hover:border-matrix",
    text: "text-matrix",
    glow: "shadow-matrix-strong",
    bar: "from-matrix to-cyan-accent",
  },
  cyan: {
    border: "border-cyan-accent/40",
    borderHover: "hover:border-cyan-accent",
    text: "text-cyan-accent",
    glow: "shadow-[0_0_40px_rgba(0,229,255,0.3),0_0_0_1px_rgba(0,229,255,0.5)]",
    bar: "from-cyan-accent to-matrix",
  },
  magenta: {
    border: "border-magenta/40",
    borderHover: "hover:border-magenta",
    text: "text-magenta",
    glow: "shadow-[0_0_40px_rgba(255,43,214,0.3),0_0_0_1px_rgba(255,43,214,0.5)]",
    bar: "from-magenta to-matrix",
  },
};

function ProjectCard({ p, index }: { p: Project; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const a = accentMap[p.accent];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.08 }}
    >
      <TiltCard>
        <div
          className={clsx(
            "relative border bg-bg-panel/40 backdrop-blur-sm p-8 md:p-10 min-h-[420px] flex flex-col transition-all duration-300 group",
            a.border,
            a.borderHover,
            `hover:${a.glow}`
          )}
        >
          {/* corner cuts */}
          <span className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-current opacity-60" />
          <span className="absolute -top-px -right-px w-3 h-3 border-t-2 border-r-2 border-current opacity-60" />
          <span className="absolute -bottom-px -left-px w-3 h-3 border-b-2 border-l-2 border-current opacity-60" />
          <span className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-current opacity-60" />

          {/* header row */}
          <div className="flex items-start justify-between mb-6">
            <div className={clsx("text-xs uppercase tracking-[0.3em]", a.text)}>
              // proj_{String(index + 1).padStart(2, "0")}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-ink-dim/40 uppercase tracking-widest">
              <span className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", a.text.replace("text-", "bg-"))} />
              active
            </div>
          </div>

          <h3
            className={clsx(
              "font-display text-3xl md:text-4xl font-bold mb-2",
              a.text
            )}
          >
            {p.name}
          </h3>
          <p className="text-ink/80 text-sm md:text-base mb-6">{p.tagline}</p>

          <p className="text-ink-dim/70 text-sm leading-relaxed mb-6 flex-1 line-clamp-6 group-hover:line-clamp-none transition-all">
            {p.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {p.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-1 text-[10px] uppercase tracking-widest border border-ink-dim/20 text-ink-dim/60"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            {p.links.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                data-cursor="hover"
                className={clsx(
                  "inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold pb-1 border-b transition-all",
                  a.text,
                  "border-current/40 hover:border-current"
                )}
              >
                {l.label}
                <span className="opacity-60">↗</span>
              </a>
            ))}
          </div>

          {/* animated bottom bar */}
          <div
            className={clsx(
              "absolute bottom-0 left-0 h-px w-full bg-gradient-to-r opacity-40 group-hover:opacity-100 transition-opacity",
              a.bar
            )}
          />
        </div>
      </TiltCard>
    </motion.div>
  );
}

export function Projects() {
  return (
    <section id="projects" className="relative py-32 md:py-40">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10">
        <SectionHeader
          index="04"
          eyebrow="./work"
          title="A few things worth naming."
          subtitle="Selected projects. Frameworks, chains, and the occasional strange interface."
        />

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {projects.map((p, i) => (
            <ProjectCard key={p.name} p={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
