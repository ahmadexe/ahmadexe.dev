"use client";

import { useEffect, useState } from "react";
import { identity } from "@/lib/data";
import clsx from "clsx";

/**
 * Contact panel. `mailto:` silently dies on machines with no default mail
 * handler, so this offers copy-to-clipboard + Gmail compose link + mailto
 * fallback + LinkedIn — click any and the message actually goes somewhere.
 */
export function ContactPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const email = identity.socials.email;
  const gmailCompose = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    email
  )}`;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked — user can still select the email text visually.
    }
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-[100] flex items-center justify-center p-6 transition-opacity duration-300",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        className={clsx(
          "relative w-full max-w-md border border-matrix/40 bg-black/90 backdrop-blur-md p-6 md:p-8 shadow-[0_0_40px_rgba(0,255,65,0.15)] transition-transform duration-300",
          open ? "translate-y-0 scale-100" : "translate-y-4 scale-95"
        )}
      >
        <span className="absolute -top-px -left-px w-3 h-3 border-t border-l border-matrix" />
        <span className="absolute -top-px -right-px w-3 h-3 border-t border-r border-matrix" />
        <span className="absolute -bottom-px -left-px w-3 h-3 border-b border-l border-matrix" />
        <span className="absolute -bottom-px -right-px w-3 h-3 border-b border-r border-matrix" />

        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-matrix text-xs uppercase tracking-[0.3em] mb-2">
              // channel: open
            </div>
            <div className="font-display text-2xl md:text-3xl font-bold text-ink">
              Send a signal.
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="close"
            data-cursor="hover"
            className="w-8 h-8 flex items-center justify-center border border-ink-dim/30 text-ink-dim hover:text-matrix hover:border-matrix transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        <p className="text-ink-dim/70 text-sm mb-6 leading-relaxed">
          Pick a channel. Copy the address if your machine has no default mail
          client wired up.
        </p>

        <div className="space-y-2">
          <button
            onClick={copy}
            data-cursor="hover"
            className="w-full flex items-center justify-between gap-3 px-4 py-3 border border-matrix/40 text-matrix hover:bg-matrix/10 hover:border-matrix transition-colors group"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="opacity-60">@</span>
              <span className="font-mono text-sm truncate">{email}</span>
            </span>
            <span className="text-xs uppercase tracking-widest opacity-70 group-hover:opacity-100 shrink-0">
              {copied ? "copied" : "copy"}
            </span>
          </button>

          <a
            href={gmailCompose}
            target="_blank"
            rel="noreferrer"
            data-cursor="hover"
            className="w-full flex items-center justify-between gap-3 px-4 py-3 border border-ink-dim/20 text-ink-dim hover:text-matrix hover:border-matrix/60 transition-colors"
          >
            <span className="flex items-center gap-3">
              <span className="opacity-60">✉</span>
              <span className="text-sm">open in gmail</span>
            </span>
            <span className="opacity-60">↗</span>
          </a>

          <a
            href={`mailto:${email}`}
            data-cursor="hover"
            className="w-full flex items-center justify-between gap-3 px-4 py-3 border border-ink-dim/20 text-ink-dim hover:text-matrix hover:border-matrix/60 transition-colors"
          >
            <span className="flex items-center gap-3">
              <span className="opacity-60">$</span>
              <span className="text-sm">launch mail client</span>
            </span>
            <span className="opacity-60">→</span>
          </a>

          <a
            href={identity.socials.linkedin}
            target="_blank"
            rel="noreferrer"
            data-cursor="hover"
            className="w-full flex items-center justify-between gap-3 px-4 py-3 border border-ink-dim/20 text-ink-dim hover:text-matrix hover:border-matrix/60 transition-colors"
          >
            <span className="flex items-center gap-3">
              <span className="opacity-60">in</span>
              <span className="text-sm">linkedin</span>
            </span>
            <span className="opacity-60">↗</span>
          </a>
        </div>

        <div className="mt-6 text-[10px] text-ink-dim/40 uppercase tracking-[0.3em]">
          status: accepting_signals
        </div>
      </div>
    </div>
  );
}
