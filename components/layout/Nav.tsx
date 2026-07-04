"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";

const links = [
  { href: "#home", label: "home", index: "01" },
  { href: "#terminal", label: "terminal", index: "02" },
  { href: "#about", label: "about", index: "03" },
  { href: "#projects", label: "projects", index: "04" },
  { href: "#experience", label: "experience", index: "05" },
  { href: "#awards", label: "awards", index: "06" },
  { href: "#speaking", label: "speaking", index: "07" },
  { href: "#articles", label: "articles", index: "08" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("home");
  const [now, setNow] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    links.forEach((l) => {
      const el = document.querySelector(l.href);
      if (el) io.observe(el);
    });

    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      setNow(`${hh}:${mm}:${ss}`);
    };
    tick();
    const t = setInterval(tick, 1000);

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
      clearInterval(t);
    };
  }, []);

  return (
    <header
      className={clsx(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-black/50 backdrop-blur-md border-b border-matrix/20"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between text-xs">
        <Link
          href="#home"
          className="flex items-center gap-3 text-matrix glow-matrix hover:text-matrix-soft transition-colors"
          data-cursor="hover"
        >
          <span className="inline-block w-2 h-2 bg-matrix animate-pulse shadow-[0_0_10px_var(--matrix)]" />
          <span className="font-bold tracking-widest">AHMADEXE</span>
          <span className="text-ink-dim/50 hidden md:inline">
            :~/portfolio.sys
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => {
            const key = l.href.slice(1);
            const isActive = active === key;
            return (
              <Link
                key={l.href}
                href={l.href}
                data-cursor="hover"
                className={clsx(
                  "group px-3 py-2 flex items-center gap-2 transition-colors",
                  isActive
                    ? "text-matrix"
                    : "text-ink-dim/60 hover:text-matrix-soft"
                )}
              >
                <span className="opacity-50">{l.index}</span>
                <span className="font-bold uppercase tracking-widest">
                  {l.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 bg-matrix rounded-full shadow-[0_0_8px_var(--matrix)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3 text-ink-dim/60">
          <span className="w-1.5 h-1.5 rounded-full bg-matrix animate-pulse" />
          <span className="font-bold tracking-widest">ONLINE</span>
          <span className="opacity-40">|</span>
          <span>{now}</span>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="toggle menu"
          data-cursor="hover"
          className="lg:hidden relative w-9 h-9 flex flex-col items-center justify-center gap-1.5 border border-matrix/40 hover:border-matrix hover:bg-matrix/10 transition-colors"
        >
          <span
            className={clsx(
              "block h-px w-4 bg-matrix transition-transform origin-center",
              open && "translate-y-[3px] rotate-45"
            )}
          />
          <span
            className={clsx(
              "block h-px w-4 bg-matrix transition-transform origin-center",
              open && "-translate-y-[3px] -rotate-45"
            )}
          />
        </button>
      </div>

      {/* Mobile sheet */}
      <div
        className={clsx(
          "lg:hidden overflow-hidden bg-black/85 backdrop-blur-md border-b border-matrix/20 transition-[max-height,opacity] duration-500 ease-out",
          open ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="px-6 py-4 flex flex-col divide-y divide-matrix/10">
          {links.map((l) => {
            const key = l.href.slice(1);
            const isActive = active === key;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                data-cursor="hover"
                className={clsx(
                  "flex items-center gap-3 py-3 text-sm",
                  isActive
                    ? "text-matrix"
                    : "text-ink-dim/70 hover:text-matrix-soft"
                )}
              >
                <span className="opacity-50 text-xs">{l.index}</span>
                <span className="font-bold uppercase tracking-widest">
                  {l.label}
                </span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-matrix shadow-[0_0_8px_var(--matrix)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
