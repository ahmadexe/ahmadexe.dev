"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";

const SECTIONS: { id: string; label: string }[] = [
  { id: "home", label: "HOME" },
  { id: "terminal", label: "TERMINAL" },
  { id: "about", label: "ABOUT" },
  { id: "projects", label: "PROJECTS" },
  { id: "experience", label: "EXPERIENCE" },
  { id: "awards", label: "AWARDS" },
  { id: "speaking", label: "SPEAKING" },
  { id: "articles", label: "ARTICLES" },
];

/**
 * Right-edge memory-map rail: every section is a hex address, the live one
 * glows, and a progress line tracks Lenis. Reads like /proc/self/maps for
 * the page — the connective tissue between the shell and the scroll.
 */
export function ChapterHUD() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);

  useLenis((l) => {
    // Throttle to animation frames — Lenis emits per scroll event.
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() =>
      setProgress(l.progress ?? 0)
    );
  });

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach((s, i) => {
      const el = document.getElementById(s.id);
      if (!el) return;
      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setActive((prev) => {
              if (prev !== i)
                window.dispatchEvent(new CustomEvent("termolio:chapter"));
              return i;
            });
          }
        },
        { rootMargin: "-40% 0px -40% 0px" }
      );
      io.observe(el);
      observers.push(io);
    });
    return () => observers.forEach((io) => io.disconnect());
  }, []);

  return (
    <nav
      aria-label="section map"
      className="fixed right-5 top-1/2 -translate-y-1/2 z-[55] hidden lg:flex flex-col items-end gap-0 font-mono select-none"
    >
      {/* progress track */}
      <div className="absolute -right-3 top-0 bottom-0 w-px bg-matrix/15">
        <div
          className="absolute top-0 left-0 w-full bg-matrix shadow-[0_0_8px_var(--matrix)]"
          style={{ height: `${progress * 100}%` }}
        />
      </div>

      {SECTIONS.map((s, i) => {
        const isActive = i === active;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            data-cursor="hover"
            className={`group flex items-center gap-2 py-1.5 pr-2 transition-all duration-300 ${
              isActive ? "opacity-100" : "opacity-35 hover:opacity-80"
            }`}
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById(s.id)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <span
              className={`text-[9px] tracking-[0.25em] uppercase transition-colors ${
                isActive ? "text-matrix glow-matrix" : "text-ink-dim/60"
              }`}
            >
              {isActive ? s.label : ""}
              <span className="ml-2 text-[9px] text-matrix/60">
                0x{(i * 4).toString(16).padStart(2, "0").toUpperCase()}
              </span>
            </span>
            <span
              className={`block w-1.5 h-1.5 rotate-45 transition-all duration-300 ${
                isActive
                  ? "bg-matrix shadow-[0_0_8px_var(--matrix)] scale-125"
                  : "bg-ink-dim/30 group-hover:bg-matrix/60"
              }`}
            />
          </a>
        );
      })}
    </nav>
  );
}
