"use client";

import dynamic from "next/dynamic";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { identity } from "@/lib/data";

const AboutOrb = dynamic(
  () => import("./AboutOrb").then((m) => m.AboutOrb),
  { ssr: false }
);

const stats = [
  { label: "years shipping", value: "4+" },
  { label: "projects live", value: "numerous" },
  { label: "awards", value: "20+" },
  { label: "articles", value: "15+" },
];

const stack = [
  "Flutter",
  "Dart",
  "Go",
  "Python",
  "Django",
  "C++",
  "C",
  "MongoDB",
  "PostgreSQL",
  "Redis",
  "Kafka",
  "AWS",
  "Google Cloud",
  "Firebase",
  "Supabase",
  "Docker",
  "Kubernetes",
  "Linux",
  "Kali Linux",
  "Android",
  "Bash",
  "TensorFlow",
  "OpenCV",
  "Git",
  "Postman",
  "VS Code",
];

export function About() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });

  return (
    <section id="about" className="relative py-32 md:py-40">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10">
        <SectionHeader
          index="03"
          eyebrow="./whoami"
          title="A note on the person at the keyboard."
          subtitle="The short version of who I am, what I care about, and how I got here."
        />

        <div ref={ref} className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-start">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7 }}
              className="text-ink/90 text-base md:text-lg leading-relaxed max-w-2xl"
            >
              {identity.bio}
            </motion.p>

            {/* stats */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                  className="border border-matrix/20 bg-matrix/5 p-4 hover:border-matrix/60 hover:bg-matrix/10 transition-colors"
                >
                  <div
                    className={`font-display font-bold text-matrix glow-matrix ${
                      s.value.length > 3
                        ? "text-xl md:text-2xl"
                        : "text-3xl md:text-4xl"
                    }`}
                  >
                    {s.value}
                  </div>
                  <div className="text-xs text-ink-dim/60 uppercase tracking-widest mt-1">
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* stack */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="mt-12"
            >
              <div className="text-matrix text-xs uppercase tracking-[0.3em] mb-4">
                // stack
              </div>
              <div className="flex flex-wrap gap-2">
                {stack.map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1.5 border border-ink-dim/20 text-ink-dim/80 text-xs uppercase tracking-widest hover:border-matrix/60 hover:text-matrix transition-colors"
                    data-cursor="hover"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Orb */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1.1, delay: 0.4 }}
            className="relative aspect-square lg:h-[520px] w-full"
          >
            <div className="absolute inset-0 border border-matrix/30 bg-matrix/[0.02]">
              {/* corner cuts */}
              <span className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-matrix" />
              <span className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-matrix" />
              <span className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-matrix" />
              <span className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-matrix" />
              {inView && <AboutOrb />}
            </div>
            <div className="absolute top-3 left-3 text-[10px] text-matrix uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-matrix rounded-full animate-pulse" />
              signal.live
            </div>
            <div className="absolute bottom-3 right-3 text-[10px] text-ink-dim/50 uppercase tracking-[0.3em]">
              scan.0x2a
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
