"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Floating paper/glyph fragments for the Articles/Footer chapter.
 * Instanced planes with gentle drift. Sits at y=-80.
 */
export function PaperSwarm({ y = -80, count = 260 }: { y?: number; count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const data = useMemo(() => {
    const arr: {
      x: number;
      y: number;
      z: number;
      rx: number;
      ry: number;
      rz: number;
      speed: number;
      driftPhase: number;
    }[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 18,
        y: (Math.random() - 0.5) * 12,
        z: (Math.random() - 0.5) * 12 - 2,
        rx: Math.random() * Math.PI * 2,
        ry: Math.random() * Math.PI * 2,
        rz: Math.random() * Math.PI * 2,
        speed: 0.1 + Math.random() * 0.3,
        driftPhase: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      dummy.position.set(
        d.x + Math.sin(t * d.speed + d.driftPhase) * 0.3,
        d.y + Math.cos(t * d.speed * 0.6 + d.driftPhase) * 0.4,
        d.z + Math.sin(t * d.speed * 0.4 + d.driftPhase) * 0.2
      );
      dummy.rotation.set(
        d.rx + t * d.speed * 0.4,
        d.ry + t * d.speed * 0.3,
        d.rz + t * d.speed * 0.2
      );
      const s = 0.15 + Math.sin(t + d.driftPhase) * 0.03;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={[0, y, 0]}>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <planeGeometry args={[1.2, 1.6]} />
        <meshBasicMaterial
          color="#00ff41"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  );
}
