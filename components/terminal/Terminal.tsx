"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { shell, useShell } from "./shellStore";
import { identity } from "@/lib/data";
import { SectionHeader } from "@/components/ui/SectionHeader";

function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) => {
    if (part.match(/^https?:\/\//)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="link underline decoration-matrix/50 hover:decoration-matrix"
          data-cursor="hover"
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function Terminal() {
  const state = useShell();
  const [input, setInput] = useState("");
  const [caret, setCaret] = useState(0);
  const [histIdx, setHistIdx] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const inView = useInView(sectionRef, { margin: "-20%" });
  const [ping, setPing] = useState(false);
  const [memPct, setMemPct] = useState(0);
  const [cpuPct, setCpuPct] = useState(0.3);

  // Blur CRT input when it scrolls off-screen so focus doesn't trap keystrokes
  // that should open the Quake terminal instead.
  useEffect(() => {
    if (!inView) inputRef.current?.blur();
  }, [inView]);

  // Page-scroll → MEM%; scroll activity spikes CPU% then decays.
  const { scrollYProgress: pageProgress } = useScroll();
  useEffect(() => {
    return pageProgress.on("change", (v) => setMemPct(Math.round(v * 100)));
  }, [pageProgress]);

  useEffect(() => {
    let decayTimer: ReturnType<typeof setTimeout>;
    let decayInterval: ReturnType<typeof setInterval>;
    const onScroll = () => {
      setCpuPct((p) => Math.min(98, p + Math.random() * 18 + 8));
      clearTimeout(decayTimer);
      clearInterval(decayInterval);
      decayTimer = setTimeout(() => {
        decayInterval = setInterval(() => {
          setCpuPct((p) => {
            const next = +(p - 3).toFixed(1);
            if (next <= 0.3) { clearInterval(decayInterval); return 0.3; }
            return next;
          });
        }, 80);
      }, 250);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(decayTimer);
      clearInterval(decayInterval);
    };
  }, []);

  // Toggle a global .stage-terminal class on <html> whenever the CRT is
  // centered enough to be "on stage". CSS then dims .scene-ambient so the
  // terminal reads as the only lit thing in the room.
  useEffect(() => {
    const el = document.getElementById("terminal");
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const on = entries[0].isIntersecting;
        document.documentElement.classList.toggle("stage-terminal", on);
      },
      { rootMargin: "-25% 0px -25% 0px" }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      document.documentElement.classList.remove("stage-terminal");
    };
  }, []);

  // When a command is executed via the Quake console while the CRT is far
  // off-screen, ping the cabinet briefly so people notice the CRT *is* the
  // shell they just typed into.
  useEffect(() => {
    const on = () => {
      if (inView) return;
      setPing(true);
      window.setTimeout(() => setPing(false), 900);
    };
    window.addEventListener("termolio:activity", on);
    return () => window.removeEventListener("termolio:activity", on);
  }, [inView]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const rotateY = useTransform(scrollYProgress, [0, 0.5, 1], [22, 0, -18]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [-8, 2, 10]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 0.92]);

  const crtRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 90, damping: 18, mass: 0.7 });
  const smy = useSpring(my, { stiffness: 90, damping: 18, mass: 0.7 });
  const mouseRotY = useTransform(smx, [-0.5, 0.5], [-14, 14]);
  const mouseRotX = useTransform(smy, [-0.5, 0.5], [10, -10]);
  const pushX = useTransform(smx, [-0.5, 0.5], [-14, 14]);
  const pushY = useTransform(smy, [-0.5, 0.5], [-8, 8]);
  const glowX = useTransform(smx, [-0.5, 0.5], ["10%", "90%"]);
  const glowY = useTransform(smy, [-0.5, 0.5], ["10%", "90%"]);

  const onCrtMove = (e: React.MouseEvent) => {
    if (!crtRef.current) return;
    const rect = crtRef.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const onCrtLeave = () => {
    mx.set(0);
    my.set(0);
  };

  useEffect(() => {
    if (inView) inputRef.current?.focus({ preventScroll: true });
  }, [inView]);

  // While the CRT section is on-screen, it owns the keyboard.
  useEffect(() => {
    if (!inView) return;
    const onKeyDownGlobal = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tgt = e.target as HTMLElement | null;
      if (
        tgt &&
        (tgt.tagName === "INPUT" ||
          tgt.tagName === "TEXTAREA" ||
          tgt.isContentEditable)
      ) {
        return;
      }
      if (
        e.key.length === 1 ||
        e.key === "Backspace" ||
        e.key === "Enter" ||
        e.key === "Tab" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        inputRef.current?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", onKeyDownGlobal);
    return () => window.removeEventListener("keydown", onKeyDownGlobal);
  }, [inView]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(raf);
  }, [state.entries]);

  const run = (raw: string) => {
    shell.run(raw);
    setHistIdx(-1);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      run(input);
      setInput("");
      setCaret(0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const h = state.history;
      if (h.length === 0) return;
      const next = histIdx === -1 ? h.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(next);
      setInput(h[next]);
      setCaret(h[next].length);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const h = state.history;
      if (histIdx === -1) return;
      const next = histIdx + 1;
      if (next >= h.length) {
        setHistIdx(-1);
        setInput("");
        setCaret(0);
      } else {
        setHistIdx(next);
        setInput(h[next]);
        setCaret(h[next].length);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const completed = shell.complete(input);
      if (completed !== null) {
        setInput(completed);
        setCaret(completed.length);
      }
    } else if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      shell.clear();
    }
  };

  return (
    <section
      ref={sectionRef}
      // id="terminal" is on the CRT card below, not on the section, so that
      // #terminal anchor navigation lands directly on the CRT instead of
      // hundreds of pixels above it at the section header. Active-section
      // detection in the Nav (IntersectionObserver on #terminal) still works
      // because the CRT card is what's really "the terminal."
      className="relative min-h-[100svh] py-20 md:py-24 lg:py-28 flex flex-col justify-center"
    >
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10 w-full">
        <SectionHeader
          eyebrow="the engine, on display"
          crumb="~ $ tty  # /dev/portfolio"
          title="This whole site is one terminal."
          subtitle="Every section — projects, awards, articles — is a file in this shell. Type anywhere to drop the console; this CRT is the same shell, on its own stage."
        />

        <motion.div
          id="terminal"
          style={{
            rotateX,
            rotateY,
            scale,
            transformPerspective: 1400,
            transformStyle: "preserve-3d",
          }}
          // scroll-mt-24 leaves 96px above the CRT when a #terminal anchor
          // lands here: 64px fixed nav + 32px breathing room.
          className="relative mx-auto max-w-5xl scroll-mt-24"
        >
          <motion.div
            ref={crtRef}
            onMouseMove={onCrtMove}
            onMouseLeave={onCrtLeave}
            style={{
              rotateX: mouseRotX,
              rotateY: mouseRotY,
              x: pushX,
              y: pushY,
              transformPerspective: 1600,
              transformStyle: "preserve-3d",
            }}
            className="relative"
          >
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -inset-10 rounded-[40px] blur-3xl"
              style={{
                background: useTransform(
                  [glowX, glowY] as any,
                  ([gx, gy]: any) =>
                    `radial-gradient(500px circle at ${gx} ${gy}, rgba(0,255,65,0.22), transparent 65%)`
                ) as any,
                transform: "translateZ(-60px)",
              }}
            />

          <div
            className={`cabinet relative p-6 md:p-10 rounded-3xl ${
              ping ? "cabinet-ping" : ""
            }`}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Corner screws — small industrial detail that reads as "real
                hardware" rather than a themed div. */}
            <span aria-hidden className="screw screw-tl" />
            <span aria-hidden className="screw screw-tr" />
            <span aria-hidden className="screw screw-bl" />
            <span aria-hidden className="screw screw-br" />

            <div
              className="flex items-center justify-between px-2 pb-3 text-[10px] text-ink-dim/40 uppercase tracking-widest"
              style={{ transform: "translateZ(28px)" }}
            >
              <div className="flex items-center gap-3">
                <span className="led" />
                <span className="w-2 h-2 rounded-full bg-cyan-accent/50" />
                <span className="w-2 h-2 rounded-full bg-magenta/50" />
              </div>
              <div className="tracking-[0.4em]">TERMOLIO.CRT · v2.0</div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-matrix rounded-full animate-pulse" />
                <span>REC</span>
              </div>
            </div>

            <div
              // Bigger floor so the CRT stays imposing, but still scales down
              // gracefully on short viewports (svh is small-viewport-height,
              // stable across mobile browser chrome shifts).
              className="crt relative h-[clamp(460px,66svh,600px)]"
              style={{ transform: "translateZ(0px)" }}
              onClick={() => inputRef.current?.focus()}
            >
              <div
                ref={scrollRef}
                className="relative z-[2] h-full overflow-y-auto p-6 md:p-8 font-mono text-sm md:text-[15px] leading-relaxed"
              >
                {state.entries.map((e, i) => {
                  if (e.type === "banner") {
                    return (
                      <div key={i} className="mb-4">
                        <pre className="text-matrix glow-matrix text-xs md:text-sm leading-tight whitespace-pre-wrap">
{`  ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
  ▄  T E R M O L I O  ·  ahmadexe@portfolio  ▄
  ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀`}
                        </pre>
                        <div className="mt-3 text-ink-dim/80 whitespace-pre-wrap">
                          {e.text}
                        </div>
                      </div>
                    );
                  }
                  if (e.type === "prompt") {
                    return (
                      <div key={i} className="flex flex-wrap gap-x-1">
                        <span className="text-cyan-accent">
                          {identity.handle}@termolio
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
                      className="whitespace-pre-wrap text-ink-dim/90 mb-2"
                    >
                      {linkify(e.text)}
                    </div>
                  );
                })}

                <div className="flex flex-wrap items-center gap-x-1 mt-1">
                  <span className="text-cyan-accent">
                    {identity.handle}@termolio
                  </span>
                  <span className="text-ink-dim">:</span>
                  <span className="text-matrix">{state.path}</span>
                  <span className="text-ink-dim">$</span>
                  <div className="relative flex-1 flex items-center min-w-[80px]">
                    <span className="whitespace-pre text-ink pointer-events-none">
                      {input.slice(0, caret)}
                    </span>
                    <span className="caret" />
                    <span className="whitespace-pre text-ink pointer-events-none">
                      {input.slice(caret)}
                    </span>
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        setCaret(e.target.selectionStart ?? e.target.value.length);
                      }}
                      onKeyUp={(e) =>
                        setCaret(
                          (e.currentTarget.selectionStart ?? input.length)
                        )
                      }
                      onClick={(e) =>
                        setCaret(
                          (e.currentTarget.selectionStart ?? input.length)
                        )
                      }
                      onSelect={(e) =>
                        setCaret(
                          (e.currentTarget.selectionStart ?? input.length)
                        )
                      }
                      onKeyDown={onKey}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className="absolute inset-0 w-full h-full bg-transparent outline-none text-transparent caret-transparent selection:text-transparent"
                      aria-label="terminal input"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              className="mt-2 px-2 flex items-center justify-between text-[10px] text-ink-dim/40 uppercase tracking-widest"
              style={{ transform: "translateZ(28px)" }}
            >
              <div>PID 0x0AE1 · MEM {memPct}% · CPU {cpuPct.toFixed(1)}%</div>
              <div className="flex items-center gap-4">
                <span className="hidden md:inline">
                  hint: <span className="text-matrix">theme amber</span> ·{" "}
                  <span className="text-matrix">grep flutter</span> ·{" "}
                  <span className="text-matrix">open awards</span> ·{" "}
                  <span className="text-matrix">sudo unlock</span>
                </span>
                <span>UTF-8</span>
              </div>
            </div>
          </div>

          {/* Pedestal — trapezoidal stem widens into a base plate, so the CRT
              reads as sitting on furniture instead of floating over the page. */}
          <div
            aria-hidden
            className="pedestal-stem mx-auto mt-2 h-8 w-40"
            style={{ transform: "translateZ(-30px)" }}
          />
          <div
            aria-hidden
            className="pedestal-base mx-auto h-3 w-64 rounded-md"
            style={{ transform: "translateZ(-50px)" }}
          />
          <div
            aria-hidden
            className="mx-auto mt-3 h-1 w-72 rounded-full bg-matrix/25 blur-md"
            style={{ transform: "translateZ(-70px)" }}
          />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
