"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { shell, useShell } from "./shellStore";
import { identity } from "@/lib/data";

// The "quake" console: a global dropdown that mirrors the CRT terminal.
// - First printable keystroke anywhere on the page drops it in.
// - Ctrl/Cmd + ` toggles it explicitly.
// - Escape closes it.
// - When the CRT section is on screen, we step out of the way so the CRT
//   owns focus and the two consoles don't fight over the same key.

export function QuakeTerminal() {
  const state = useShell();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [histIdx, setHistIdx] = useState(-1);
  const [crtInView, setCrtInView] = useState(false);
  const [locked, setLocked] = useState(false);
  const [pulseHint, setPulseHint] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Observe the CRT section so we can yield to it.
  useEffect(() => {
    const el = document.getElementById("terminal");
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setCrtInView(entries[0].isIntersecting),
      { rootMargin: "-15% 0px -15% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Lock during a singularity, then reopen when it settles.
  useEffect(() => {
    const onStart = () => {
      setLocked(true);
      setOpen(false);
    };
    const onEnd = () => {
      setLocked(false);
      setInput("");
      setHistIdx(-1);
    };
    window.addEventListener("termolio:singularity", onStart);
    window.addEventListener("termolio:singularity:end", onEnd);
    return () => {
      window.removeEventListener("termolio:singularity", onStart);
      window.removeEventListener("termolio:singularity:end", onEnd);
    };
  }, []);

  // Dismiss the hint after the console has been opened once.
  useEffect(() => {
    if (open) setPulseHint(false);
  }, [open]);

  // First-visit tease: right after boot, drop the console in on its own so
  // nobody misses that the shell is the actual engine. Uses the same
  // sessionStorage flag as BootOverlay so it only fires on a real cold load.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("quake-teased") === "1") return;
    const teaseStart = window.setTimeout(() => {
      sessionStorage.setItem("quake-teased", "1");
      setOpen(true);
    }, 1600);
    const teaseEnd = window.setTimeout(() => {
      setOpen(false);
    }, 4200);
    return () => {
      window.clearTimeout(teaseStart);
      window.clearTimeout(teaseEnd);
    };
  }, []);

  // The global listener. Cheap: bails on modifier keys and inputs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (locked) return;

      // Explicit toggle: Ctrl/Cmd + backtick.
      if ((e.key === "`" || e.key === "~") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (crtInView) return;

      const tgt = e.target as HTMLElement | null;
      if (
        tgt &&
        (tgt.tagName === "INPUT" ||
          tgt.tagName === "TEXTAREA" ||
          tgt.isContentEditable)
      ) {
        return;
      }

      // Only printable characters open the console cold — arrows/space
      // stealing scroll would be more surprise than magic.
      const isPrintable = e.key.length === 1 && e.key !== " ";
      if (!open && isPrintable) {
        setOpen(true);
        e.preventDefault();
        setInput((v) => v + e.key);
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, crtInView, locked]);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() =>
        inputRef.current?.focus({ preventScroll: true })
      );
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(raf);
  }, [state.entries, open]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key.length === 1 || e.key === "Enter" || e.key === "Backspace") {
      window.dispatchEvent(new CustomEvent("termolio:keytick"));
    }
    if (e.key === "Enter") {
      shell.run(input);
      setInput("");
      setHistIdx(-1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const h = state.history;
      if (!h.length) return;
      const next = histIdx === -1 ? h.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(next);
      setInput(h[next]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const h = state.history;
      if (histIdx === -1) return;
      const next = histIdx + 1;
      if (next >= h.length) {
        setHistIdx(-1);
        setInput("");
      } else {
        setHistIdx(next);
        setInput(h[next]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const c = shell.complete(input);
      if (c !== null) setInput(c);
    } else if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      shell.clear();
    }
  };

  return (
    <>
      {/* Ambient hint pinned into the top status area. */}
      {!crtInView && !open && !locked && (
        <div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] pointer-events-none hidden md:block"
          aria-hidden
        >
          <div
            className={`mt-1 px-3 py-1 rounded-b-md border border-t-0 border-matrix/25 bg-black/50 backdrop-blur-sm text-[10px] uppercase tracking-[0.4em] text-matrix/70 flex items-center gap-2 ${
              pulseHint ? "animate-pulse" : ""
            }`}
          >
            <span className="w-1 h-1 rounded-full bg-matrix shadow-[0_0_6px_var(--matrix)]" />
            <span>type anywhere</span>
            <span className="opacity-40">·</span>
            <span className="opacity-70">shell is live</span>
          </div>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            key="quake"
            initial={{ y: "-110%", opacity: 0.4 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-110%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 34, mass: 0.7 }}
            className="fixed top-16 left-0 right-0 z-[70]"
          >
            <div className="mx-auto max-w-4xl px-4">
              <div className="relative bg-black/85 backdrop-blur-md border border-matrix/40 shadow-matrix-strong rounded-b-2xl overflow-hidden">
                {/* scanline sheen */}
                <div className="pointer-events-none absolute inset-0 opacity-30 scanlines" />

                <div className="relative flex items-center justify-between px-4 py-1.5 border-b border-matrix/20 text-[10px] uppercase tracking-[0.35em] text-ink-dim/60">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-matrix animate-pulse shadow-[0_0_6px_var(--matrix)]" />
                    <span className="text-matrix">termolio</span>
                    <span className="opacity-40">·</span>
                    <span>quake console</span>
                  </div>
                  <div className="flex items-center gap-3 opacity-60">
                    <span className="hidden sm:inline">
                      <span className="text-matrix">⌘`</span> toggle
                    </span>
                    <span className="hidden sm:inline">·</span>
                    <span>
                      <span className="text-matrix">esc</span> close
                    </span>
                  </div>
                </div>

                <div
                  ref={scrollRef}
                  className="relative max-h-[44vh] overflow-y-auto p-4 font-mono text-[13px] leading-relaxed"
                  onClick={() =>
                    inputRef.current?.focus({ preventScroll: true })
                  }
                >
                  {state.entries.slice(-60).map((e, i) => {
                    if (e.type === "banner") {
                      return (
                        <div
                          key={i}
                          className="mb-2 text-matrix/80 whitespace-pre-wrap text-[11px]"
                        >
                          {e.text}
                        </div>
                      );
                    }
                    if (e.type === "prompt") {
                      return (
                        <div key={i} className="flex flex-wrap gap-x-1">
                          <span className="text-cyan-accent">
                            {identity.handle}
                          </span>
                          <span className="text-ink-dim">:</span>
                          <span className="text-matrix">{e.path}</span>
                          <span className="text-ink-dim">$</span>
                          <span className="text-ink flex-1">{e.input}</span>
                        </div>
                      );
                    }
                    if (e.type === "corrupt") {
                      return (
                        <div
                          key={i}
                          className="whitespace-pre-wrap text-danger glow-matrix-hard mb-2 glitch"
                          data-text={e.text}
                        >
                          {e.text}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={i}
                        className="whitespace-pre-wrap text-ink-dim/90 mb-1"
                      >
                        {e.text}
                      </div>
                    );
                  })}

                  <div className="flex items-center gap-x-1 mt-1">
                    <span className="text-cyan-accent">{identity.handle}</span>
                    <span className="text-ink-dim">:</span>
                    <span className="text-matrix">{state.path}</span>
                    <span className="text-ink-dim">$</span>
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={onKeyDown}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className="flex-1 bg-transparent outline-none text-ink caret-matrix min-w-0"
                      aria-label="quake console input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
