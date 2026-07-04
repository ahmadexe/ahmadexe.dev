"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const sequence = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export function KonamiOverride() {
  const [active, setActive] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    let buffer: string[] = [];
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      buffer.push(key);
      if (buffer.length > sequence.length) buffer = buffer.slice(-sequence.length);
      if (
        buffer.length === sequence.length &&
        buffer.every((k, i) => k === sequence[i])
      ) {
        setActive((v) => !v);
        setPulse(true);
        setTimeout(() => setPulse(false), 1600);
        buffer = [];
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (active) {
      root.style.setProperty("--matrix", "#ff2bd6");
      root.style.setProperty("--matrix-soft", "#ff8fe6");
      root.classList.add("konami-active");
    } else {
      root.style.removeProperty("--matrix");
      root.style.removeProperty("--matrix-soft");
      root.classList.remove("konami-active");
    }
  }, [active]);

  return (
    <AnimatePresence>
      {pulse && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[80] pointer-events-none font-mono text-xs uppercase tracking-[0.5em] px-4 py-2 border border-current bg-black/80 backdrop-blur-sm"
          style={{ color: "var(--matrix)" }}
        >
          {active ? "override // engaged" : "override // released"}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
