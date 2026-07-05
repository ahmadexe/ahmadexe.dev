"use client";

import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, Preload } from "@react-three/drei";
import { Suspense, useState } from "react";
import { HeroCore } from "@/components/three/HeroCore";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

export function HeroScene() {
  const [dpr, setDpr] = useState<number>(1.5);
  const [bloomOn, setBloomOn] = useState(true);

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45 }}
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1);
          setBloomOn(false);
        }}
        onIncline={() => {
          setDpr(1.5);
          setBloomOn(true);
        }}
      />
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#00ff41" />
        <pointLight position={[-5, -5, 3]} intensity={0.8} color="#00e5ff" />
        <HeroCore />
        {bloomOn && (
          <EffectComposer>
            <Bloom
              intensity={1.2}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
          </EffectComposer>
        )}
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
