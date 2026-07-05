"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function ParticleField({
  count = 1400,
  radius = 40,
}: {
  count?: number;
  radius?: number;
}) {
  const ref = useRef<THREE.Points>(null);

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * Math.pow(Math.random(), 0.5);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      sz[i] = 0.02 + Math.random() * 0.08;
    }
    return [pos, sz];
  }, [count, radius]);

  const target = useRef(new THREE.Vector2(0, 0));

  useFrame((state) => {
    if (!ref.current) return;
    target.current.x += (state.pointer.x - target.current.x) * 0.03;
    target.current.y += (state.pointer.y - target.current.y) * 0.03;
    ref.current.rotation.y =
      state.clock.elapsedTime * 0.02 + target.current.x * 0.15;
    ref.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.05) * 0.1 - target.current.y * 0.12;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#00ff41"
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
