"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Constellation for the Awards chapter: sparse background points,
 * 5 luminous "hero" orbs (one per award) linked by faint lines.
 * Sits at y=-58.
 */
export function AwardConstellation({ y = -58 }: { y?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  const heroOrbs = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 4.5 + Math.sin(i * 1.3) * 0.6;
      pts.push(
        new THREE.Vector3(
          Math.cos(angle) * r,
          Math.sin(i * 1.7) * 0.9,
          Math.sin(angle) * r * 0.5
        )
      );
    }
    return pts;
  }, []);

  const linkGeom = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < heroOrbs.length; i++) {
      for (let j = i + 1; j < heroOrbs.length; j++) {
        if (heroOrbs[i].distanceTo(heroOrbs[j]) < 7) {
          arr.push(
            heroOrbs[i].x,
            heroOrbs[i].y,
            heroOrbs[i].z,
            heroOrbs[j].x,
            heroOrbs[j].y,
            heroOrbs[j].z
          );
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    return g;
  }, [heroOrbs]);

  const dust = useMemo(() => {
    const pos = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      const r = 3 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.05;
      groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.06;
      groupRef.current.position.y = y + Math.sin(t * 0.3) * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[0, y, 0]}>
      {heroOrbs.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.18, 20, 20]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? "#00ff41" : "#00e5ff"}
            toneMapped={false}
          />
        </mesh>
      ))}
      <lineSegments>
        <primitive object={linkGeom} attach="geometry" />
        <lineBasicMaterial color="#00ff41" transparent opacity={0.25} />
      </lineSegments>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#00e5ff"
          transparent
          opacity={0.7}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
