"use client";

import { useEffect, useState } from "react";
import { identity } from "@/lib/data";

const EMAIL = "muahmad710@gmail.com";

export function Footer() {
  const [year, setYear] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => setYear(new Date().getFullYear()), []);

  const onEmailClick = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(EMAIL).then(
        () => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        },
        () => {}
      );
    }
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
                <span
                  className={`text-[10px] uppercase tracking-widest text-matrix transition-opacity duration-200 ${
                    copied ? "opacity-100" : "opacity-0"
                  }`}
                  aria-live="polite"
                >
                  copied ✓
                </span>
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
                <span className="text-matrix">$</span> stack: Next.js · R3F ·
                GSAP
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
    </footer>
  );
}
