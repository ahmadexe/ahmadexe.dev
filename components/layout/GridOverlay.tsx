"use client";

export function GridOverlay() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 bg-grid grid-mask" />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,65,0.06),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,229,255,0.04),transparent_60%)]" />
      </div>
      <div className="pointer-events-none fixed inset-0 z-[60] scanlines" />
      <div className="pointer-events-none fixed inset-0 z-[60] noise opacity-40" />
      <div className="pointer-events-none fixed inset-0 z-[60] [box-shadow:inset_0_0_180px_rgba(0,0,0,0.9)]" />
    </>
  );
}
