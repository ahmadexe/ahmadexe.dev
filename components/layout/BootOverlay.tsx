"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const bootLines = [
  "BIOS: ahmadexe.portfolio.rom  ·  rev 2.0",
  "loading kernel modules ..... [ok]",
  "mounting /projects ......... [ok]",
  "mounting /awards ........... [ok]",
  "mounting /speaking ......... [ok]",
  "warming up 3D pipeline ..... [ok]",
  "signal check ............... [ok]",
  "handing off to userland ....",
];

export function BootOverlay() {
  const [shown, setShown] = useState(true);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("booted") === "1") {
      setShown(false);
      return;
    }
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setStep(i);
      if (i >= bootLines.length) {
        clearInterval(iv);
        setTimeout(() => {
          sessionStorage.setItem("booted", "1");
          setShown(false);
        }, 350);
      }
    }, 130);
    return () => clearInterval(iv);
  }, []);

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          key="boot"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-0 scanlines" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,65,0.08),transparent_70%)]" />

          <div className="relative z-10 w-full max-w-lg px-6 font-mono text-matrix">
            <div className="text-xs uppercase tracking-[0.4em] mb-4 text-matrix/70">
              // boot sequence
            </div>
            <div className="text-[11px] md:text-xs space-y-1 min-h-[220px]">
              {bootLines.slice(0, step).map((l, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-matrix/50">&gt;</span>
                  <span className="glow-matrix">{l}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 h-1 w-full bg-matrix/10 overflow-hidden">
              <motion.div
                className="h-full bg-matrix shadow-[0_0_10px_var(--matrix)]"
                initial={{ width: "0%" }}
                animate={{ width: `${(step / bootLines.length) * 100}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <div className="mt-3 text-[10px] text-ink-dim/60 uppercase tracking-widest">
              {step >= bootLines.length ? "handoff" : "warming up ..."}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
