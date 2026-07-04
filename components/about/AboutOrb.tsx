"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import * as THREE from "three";

function Orb() {
  const g1 = useRef<THREE.Group>(null);
  const g2 = useRef<THREE.Group>(null);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (g1.current) {
      g1.current.rotation.x = t * 0.25;
      g1.current.rotation.y = t * 0.3;
    }
    if (g2.current) {
      g2.current.rotation.x = -t * 0.15;
      g2.current.rotation.y = t * 0.2;
      g2.current.rotation.z = t * 0.1;
    }
  });

  return (
    <>
      <group ref={g1}>
        <mesh>
          <dodecahedronGeometry args={[1.5, 0]} />
          <meshBasicMaterial color="#00ff41" wireframe />
        </mesh>
      </group>
      <group ref={g2}>
        <mesh>
          <octahedronGeometry args={[2.2, 0]} />
          <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.4} />
        </mesh>
      </group>
      <mesh>
        <sphereGeometry args={[0.15, 24, 24]} />
        <meshBasicMaterial color="#00ff41" />
      </mesh>
    </>
  );
}

export function AboutOrb() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
    >
      <Suspense fallback={null}>
        <Orb />
      </Suspense>
    </Canvas>
  );
}
