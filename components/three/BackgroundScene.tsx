"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { MatrixRain } from "./MatrixRain";
import { ParticleField } from "./ParticleField";

export function BackgroundScene() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 opacity-70">
      <Canvas
        camera={{ position: [0, 0, 22], fov: 60 }}
        dpr={[1, 1.25]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        frameloop="always"
      >
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 20, 55]} />
        <Suspense fallback={null}>
          <MatrixRain count={900} spread={45} depth={25} />
          <ParticleField count={500} radius={35} />
        </Suspense>
      </Canvas>
    </div>
  );
}
