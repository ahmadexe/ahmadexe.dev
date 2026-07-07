"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { site } from "@/components/site/siteStore";
import { fx } from "@/components/site/fxStore";

// The `hack` command's cinematic: a full-screen Hollywood pentest that ends
// in ACCESS GRANTED and quietly grants the same root mode as `sudo unlock`.
// Pure theater — every line is generated client-side. Timeline:
//   0.0s  trace    — recon log streams in (ports, hops, fingerprints)
//   1.6s  exploit  — payload hexdump + password bruteforce ticker
//   3.6s  granted  — flash, giant ACCESS GRANTED, root unlock, glitch burst
//   5.4s  done     — overlay dissolves

type Phase = "idle" | "trace" | "exploit" | "granted";

const HEX = "0123456789abcdef";
const PW_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ0123456789!#$%&";

function randHex(n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += HEX[(Math.random() * 16) | 0];
  return s;
}

function randIp() {
  return `${10 + ((Math.random() * 200) | 0)}.${(Math.random() * 255) | 0}.${
    (Math.random() * 255) | 0
  }.${(Math.random() * 255) | 0}`;
}

function hexDumpLine(offset: number) {
  const bytes = Array.from({ length: 8 }, () => randHex(4)).join(" ");
  return `0x${(offset).toString(16).padStart(8, "0")}  ${bytes}`;
}

function buildTraceLines(target: string): string[] {
  return [
    `[*] resolving ${target} ...`,
    `[*] target acquired → ${randIp()}`,
    `[*] route: hop 1 ${randIp()} (8ms) → hop 2 ${randIp()} (23ms)`,
    `[*] fingerprinting stack ...`,
    `[+] os: unixlike 6.x · ttl 64 · window 65535`,
    `[+] open 22/tcp   ssh     OpenSSH 9.7`,
    `[+] open 443/tcp  https   nginx 1.27 (TLS 1.3)`,
    `[+] open 5432/tcp postgres`,
    `[!] weak cipher negotiated on legacy endpoint`,
    `[*] selecting exploit chain: CVE-####-${1000 + ((Math.random() * 8999) | 0)}`,
  ];
}

export function HackOverlay() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [target, setTarget] = useState("the-mainframe");
  const [lines, setLines] = useState<string[]>([]);
  const [pw, setPw] = useState("");
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  // Phase machine, driven by the shell's termolio:hack event.
  useEffect(() => {
    const on = (e: Event) => {
      const t = ((e as CustomEvent).detail?.target as string) || "the-mainframe";
      // Ignore re-entry while a breach is running.
      setPhase((p) => (p === "idle" ? "trace" : p));
      setTarget(t);
      setLines([]);
      setPw("");
      setProgress(0);

      const later = (fn: () => void, ms: number) => {
        timers.current.push(window.setTimeout(fn, ms));
      };
      later(() => setPhase("exploit"), 1600);
      later(() => {
        setPhase("granted");
        fx.burst(700);
        site.unlock();
        window.dispatchEvent(new CustomEvent("termolio:accessgranted"));
      }, 3600);
      later(() => {
        setPhase("idle");
        timers.current = [];
      }, 5400);
    };
    window.addEventListener("termolio:hack", on);
    return () => {
      window.removeEventListener("termolio:hack", on);
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  // Stream log lines during trace + exploit.
  useEffect(() => {
    if (phase !== "trace" && phase !== "exploit") return;

    const source =
      phase === "trace" ? buildTraceLines(target) : null;
    let i = 0;
    let offset = 0x7ffe0000 + ((Math.random() * 0xffff) | 0);

    const id = window.setInterval(() => {
      if (source !== null) {
        if (i >= source.length) return;
        const line = source[i++];
        setLines((prev) => [...prev, line]);
      } else {
        offset += 32;
        const line = hexDumpLine(offset);
        setLines((prev) => [...prev, line].slice(-26));
      }
    }, phase === "trace" ? 130 : 55);

    return () => window.clearInterval(id);
  }, [phase, target]);

  // Bruteforce ticker + payload progress during exploit.
  useEffect(() => {
    if (phase !== "exploit") return;
    const started = performance.now();
    const id = window.setInterval(() => {
      setPw(
        Array.from(
          { length: 14 },
          () => PW_CHARS[(Math.random() * PW_CHARS.length) | 0]
        ).join("")
      );
      setProgress(Math.min(1, (performance.now() - started) / 1900));
    }, 50);
    return () => window.clearInterval(id);
  }, [phase]);

  // Autoscroll the stream.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  return (
    <AnimatePresence>
      {phase !== "idle" && (
        <motion.div
          key="hack"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
          className="fixed inset-0 z-[90] bg-black/92 backdrop-blur-sm font-mono pointer-events-none"
        >
          <div className="pointer-events-none absolute inset-0 scanlines opacity-40" />

          {phase !== "granted" && (
            <div className="absolute inset-0 flex flex-col p-6 md:p-14 max-w-4xl mx-auto">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.4em] text-danger/80 mb-4">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                  breach protocol · live
                </span>
                <span>target: {target}</span>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 overflow-hidden text-[11px] md:text-sm leading-relaxed text-matrix/90"
              >
                {lines.map((l, i) => (
                  <div
                    key={i}
                    className={
                      l.startsWith("[!]")
                        ? "text-danger"
                        : l.startsWith("[+]")
                        ? "text-cyan-accent"
                        : ""
                    }
                  >
                    {l}
                  </div>
                ))}
              </div>

              {phase === "exploit" && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-3 text-xs md:text-sm">
                    <span className="text-ink-dim/60 uppercase tracking-widest text-[10px]">
                      bruteforce
                    </span>
                    <span className="text-danger glow-matrix-hard">{pw}</span>
                  </div>
                  <div className="h-1 w-full bg-matrix/10 overflow-hidden">
                    <div
                      className="h-full bg-matrix shadow-[0_0_10px_var(--matrix)] transition-[width] duration-75"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-ink-dim/50">
                    injecting payload 0x{randHex(8)} · {Math.round(progress * 100)}%
                  </div>
                </div>
              )}
            </div>
          )}

          {phase === "granted" && (
            <motion.div
              key="granted"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-6"
            >
              <div
                className="glitch font-display font-bold text-4xl md:text-7xl lg:text-8xl text-matrix glow-matrix-hard tracking-tight"
                data-text="ACCESS GRANTED"
              >
                ACCESS GRANTED
              </div>
              <div className="text-[10px] md:text-xs uppercase tracking-[0.5em] text-ink-dim/70">
                root shell acquired · welcome to the machine
              </div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-matrix/50">
                (relax — you hacked a portfolio. it wanted you to.)
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
