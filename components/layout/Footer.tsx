"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { identity } from "@/lib/data";

const EMAIL = "muahmad710@gmail.com";
const GMAIL_COMPOSE = `https://mail.google.com/mail/?view=cm&fs=1&to=${EMAIL}`;

export function Footer() {
  const [year, setYear] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => setYear(new Date().getFullYear()), []);

  const onEmailClick = (e: React.MouseEvent) => {
    // Copy to clipboard as a helpful side-effect but let the native mailto: fire.
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(EMAIL).catch(() => {});
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2400);
    // If the user has no mail client, offer Gmail compose after a beat.
    const t = window.setTimeout(() => {
      // best-effort: if the page is still focused (mail client didn't take over)
      if (document.hasFocus()) {
        window.open(GMAIL_COMPOSE, "_blank", "noopener,noreferrer");
      }
    }, 600);
    // If the mailto is going to work, focus will leave the page — clear the timer.
    const onBlur = () => window.clearTimeout(t);
    window.addEventListener("blur", onBlur, { once: true });
  };

  return (
    <footer
      id="contact"
      className="relative border-t border-matrix/20 bg-black/60 backdrop-blur-sm mt-32"
    >
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-16">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <div className="text-matrix text-xs uppercase tracking-[0.4em] mb-4 section-eyebrow">
              That&apos;s all for now
            </div>
            <h3 className="font-display text-3xl md:text-4xl font-bold text-ink glow-matrix">
              If anything here
              <br />
              landed, say hi.
            </h3>
          </div>

          <div>
            <div className="text-ink-dim/50 text-xs uppercase tracking-widest mb-3">
              // links
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-3">
                <a
                  href={`mailto:${EMAIL}`}
                  onClick={onEmailClick}
                  className="link"
                  data-cursor="hover"
                >
                  → {EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={identity.socials.github}
                  target="_blank"
                  rel="noreferrer"
                  className="link"
                  data-cursor="hover"
                >
                  → github.com/ahmadexe
                </a>
              </li>
              <li>
                <a
                  href={identity.socials.medium}
                  target="_blank"
                  rel="noreferrer"
                  className="link"
                  data-cursor="hover"
                >
                  → medium.com/@ahmadexe
                </a>
              </li>
              <li>
                <a
                  href={identity.socials.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="link"
                  data-cursor="hover"
                >
                  → linkedin.com/in/ahmadexe
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-ink-dim/50 text-xs uppercase tracking-widest mb-3">
              // meta
            </div>
            <ul className="text-ink-dim/70 space-y-2 text-sm">
              <li>
                <span className="text-matrix">$</span> location:{" "}
                {identity.location}
              </li>
              <li>
                <span className="text-matrix">$</span> status:{" "}
                <span className="text-matrix">accepting_signals</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-matrix/10 flex flex-col md:flex-row justify-between text-xs text-ink-dim/40 gap-2">
          <div>
            © {year ?? ""} {identity.fullName} · made carefully
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-matrix rounded-full animate-pulse shadow-[0_0_8px_var(--matrix)]" />
            connection secured
          </div>
        </div>
      </div>
      <AnimatePresence>
        {copied && (
          <motion.div
            key="email-toast"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
          >
            <div className="relative flex items-center gap-3 px-5 py-3 rounded-full border border-matrix/60 bg-black/85 backdrop-blur-md shadow-matrix-strong">
              <span className="w-2 h-2 rounded-full bg-matrix animate-pulse shadow-[0_0_10px_var(--matrix)]" />
              <div className="flex flex-col">
                <span className="text-matrix text-[10px] uppercase tracking-[0.35em]">
                  email copied
                </span>
                <span className="text-ink text-sm font-mono">
                  {EMAIL}
                </span>
              </div>
              <span className="text-matrix text-lg glow-matrix">✓</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}
