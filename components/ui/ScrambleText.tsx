"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

const GLYPHS = "!<>-_\\/[]{}—=+*^?#$%&@01アイウエオカキクケコサシスセソ";

/**
 * Decrypt-style reveal: characters cycle through random glyphs and lock in
 * left-to-right once the element scrolls into view. The hacker-movie staple,
 * done cheaply — one rAF loop, no per-character spans until animating.
 */
export function ScrambleText({
  text,
  className,
  as: Tag = "span",
  charDelay = 34,
  holdFrames = 2,
}: {
  text: string;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
  /** ms between each character locking in */
  charDelay?: number;
  /** frames between glyph re-rolls for still-scrambled chars */
  holdFrames?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const [display, setDisplay] = useState(text);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!inView) {
      // Hide the real text until the reveal starts so there's no flash.
      setDisplay(" ");
      return;
    }

    let raf = 0;
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const locked = Math.floor((now - start) / charDelay);
      if (locked >= text.length) {
        setDisplay(text);
        setDone(true);
        return;
      }
      frame++;
      if (frame % holdFrames === 0) {
        let s = text.slice(0, locked);
        for (let i = locked; i < text.length; i++) {
          const c = text[i];
          s +=
            c === " "
              ? " "
              : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        setDisplay(s);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, text, charDelay, holdFrames]);

  const Component = Tag as any;
  return (
    <Component
      ref={ref}
      className={className}
      // Reserve layout with the real text so the scramble never reflows.
      style={{ position: "relative", display: "inline-block" }}
      aria-label={text}
    >
      <span aria-hidden style={{ visibility: "hidden" }}>
        {text}
      </span>
      <span
        aria-hidden
        style={{ position: "absolute", inset: 0 }}
        data-done={done || undefined}
      >
        {display}
      </span>
    </Component>
  );
}
