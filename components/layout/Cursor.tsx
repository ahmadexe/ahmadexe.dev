"use client";

import { useEffect, useRef } from "react";

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current!;
    const ring = ringRef.current!;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    };

    const isHover = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false;
      if (el.dataset.cursor === "hover") return true;
      if (el.tagName === "A" || el.tagName === "BUTTON") return true;
      if (el.getAttribute("role") === "button") return true;
      return el.parentElement ? isHover(el.parentElement) : false;
    };

    const onOver = (e: MouseEvent) => {
      if (isHover(e.target)) {
        ring.style.width = "60px";
        ring.style.height = "60px";
        ring.style.borderColor = "#00e5ff";
        ring.style.boxShadow = "0 0 30px rgba(0, 229, 255, 0.7)";
      } else {
        ring.style.width = "34px";
        ring.style.height = "34px";
        ring.style.borderColor = "#00ff41";
        ring.style.boxShadow = "0 0 20px rgba(0, 255, 65, 0.4)";
      }
    };

    let raf = 0;
    const loop = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    loop();

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot hidden md:block" />
      <div ref={ringRef} className="cursor-ring hidden md:block" />
    </>
  );
}
