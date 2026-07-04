"use client";

import { useEffect, useState } from "react";

export function Typewriter({
  lines,
  speed = 40,
  loop = false,
  className,
  cursor = true,
}: {
  lines: string[];
  speed?: number;
  loop?: boolean;
  className?: string;
  cursor?: boolean;
}) {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = lines[lineIdx] ?? "";
    if (!deleting && charIdx < current.length) {
      const t = setTimeout(() => setCharIdx(charIdx + 1), speed);
      return () => clearTimeout(t);
    }
    if (!deleting && charIdx === current.length) {
      if (loop && lines.length > 1) {
        const t = setTimeout(() => setDeleting(true), 1600);
        return () => clearTimeout(t);
      }
      return;
    }
    if (deleting && charIdx > 0) {
      const t = setTimeout(() => setCharIdx(charIdx - 1), speed / 2);
      return () => clearTimeout(t);
    }
    if (deleting && charIdx === 0) {
      setDeleting(false);
      setLineIdx((i) => (i + 1) % lines.length);
    }
  }, [charIdx, deleting, lineIdx, lines, speed, loop]);

  return (
    <span className={className}>
      {(lines[lineIdx] ?? "").slice(0, charIdx)}
      {cursor && <span className="caret ml-0.5" />}
    </span>
  );
}
