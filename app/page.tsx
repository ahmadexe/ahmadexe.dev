"use client";

import dynamic from "next/dynamic";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { GridOverlay } from "@/components/layout/GridOverlay";
import { Cursor } from "@/components/layout/Cursor";
import { BootOverlay } from "@/components/layout/BootOverlay";
import { KonamiOverride } from "@/components/layout/KonamiOverride";
import { SceneScrim } from "@/components/layout/SceneScrim";
import { Hero } from "@/components/hero/Hero";
import { Terminal } from "@/components/terminal/Terminal";
import { QuakeTerminal } from "@/components/terminal/QuakeTerminal";
import { About } from "@/components/about/About";
import { Projects } from "@/components/projects/Projects";
import { Experience } from "@/components/experience/Experience";
import { Awards } from "@/components/awards/Awards";
import { Speaking } from "@/components/speaking/Speaking";
import { Articles } from "@/components/articles/Articles";

const BackgroundScene = dynamic(
  () =>
    import("@/components/three/BackgroundScene").then((m) => m.BackgroundScene),
  { ssr: false }
);

const Singularity = dynamic(
  () =>
    import("@/components/three/Singularity").then((m) => m.Singularity),
  { ssr: false }
);

export default function Home() {
  return (
    <SmoothScroll>
      <BootOverlay />
      <KonamiOverride />
      <Cursor />
      {/* Ambient scenes dim while the terminal is on stage so the CRT reads
          as the room's only light source. See .stage-terminal .scene-ambient
          in globals.css. */}
      <div className="scene-ambient">
        <GridOverlay />
        <BackgroundScene />
        <SceneScrim />
      </div>
      <Nav />
      <main className="relative z-10">
        <Hero />
        <Terminal />
        <About />
        <Projects />
        <Experience />
        <Awards />
        <Speaking />
        <Articles />
      </main>
      <Footer />
      <QuakeTerminal />
      <Singularity />
    </SmoothScroll>
  );
}
