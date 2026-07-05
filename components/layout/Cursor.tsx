"use client";

import { useEffect, useRef } from "react";

/**
 * CAD-style reticle cursor: four thin corner brackets around a 1px pip.
 * Expands + shifts to cyan on hoverable targets. No screen-blend glow —
 * the AI-portfolio look was mostly that glowing dot.
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
    };

    const isHover = (t: EventTarget | null): boolean => {
      if (!(t instanceof HTMLElement)) return false;
      if (t.dataset.cursor === "hover") return true;
      if (t.tagName === "A" || t.tagName === "BUTTON") return true;
      if (t.getAttribute("role") === "button") return true;
      return t.parentElement ? isHover(t.parentElement) : false;
    };

    const onOver = (e: MouseEvent) => {
      el.classList.toggle("is-hover", isHover(e.target));
    };

    const onDown = () => el.classList.add("is-down");
    const onUp = () => el.classList.remove("is-down");

    let raf = 0;
    const loop = () => {
      rx += (x - rx) * 0.32;
      ry += (y - ry) * 0.32;
      el.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    loop();

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <div ref={ref} className="cursor-reticle hidden md:block" aria-hidden>
      <span className="corner corner-tl" />
      <span className="corner corner-tr" />
      <span className="corner corner-bl" />
      <span className="corner corner-br" />
      <span className="pip" />
    </div>
  );
}
