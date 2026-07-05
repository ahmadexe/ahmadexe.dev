"use client";

import { useEffect, useState } from "react";

/**
 * Returns true on viewports below `breakpoint` (default 768px).
 * Returns `null` on the first render (SSR + pre-hydration) so callers can
 * distinguish "not yet known" from "confirmed desktop/mobile".
 */
export function useIsMobile(breakpoint = 768): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}
