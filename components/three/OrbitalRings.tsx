"use client";

import { MutableRefObject, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// The subject's "machinery": three gyroscopic rings and a handful of
// wireframe octahedron satellites orbiting the morph cloud. They exist for
// the camera — the fly-by waypoint (p≈0.3) passes inside the outer rings, so
// scroll produces genuine near-field parallax instead of a subject that just
// pans. Scroll velocity spins the whole gimbal up like a reactor.

const RING_DEFS: {
  radius: number;
  tilt: [number, number, number];
  speed: number;
  color: string;
  opacity: number;
}[] = [
  { radius: 5.1, tilt: [1.1, 0.2, 0.3], speed: 0.16, color: "#00ff41", opacity: 0.34 },
  { radius: 6.6, tilt: [-0.4, 0.9, 1.2], speed: -0.11, color: "#00ff41", opacity: 0.22 },
  { radius: 8.3, tilt: [0.5, -1.2, 0.4], speed: 0.07, color: "#00e5ff", opacity: 0.16 },
];

const SAT_COUNT = 5;

export function OrbitalRings({
  velocityRef,
}: {
  velocityRef?: MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const satRefs = useRef<(THREE.Mesh | null)[]>([]);
  const spinRef = useRef(0);

  const ringGeos = useMemo(
    () =>
      RING_DEFS.map(
        (d) => new THREE.TorusGeometry(d.radius, 0.016, 6, 160)
      ),
    []
  );
  const ringMats = useMemo(
    () =>
      RING_DEFS.map(
        (d) =>
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(d.color),
            transparent: true,
            opacity: d.opacity,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
      ),
    []
  );

  const satGeo = useMemo(() => new THREE.OctahedronGeometry(0.34), []);
  const satMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#00ff41"),
        wireframe: true,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const sats = useMemo(
    () =>
      Array.from({ length: SAT_COUNT }, (_, i) => ({
        radius: 6.2 + (i % 3) * 1.1,
        phase: (i / SAT_COUNT) * Math.PI * 2,
        speed: 0.14 + (i % 2) * 0.08,
        yAmp: 1.6 + (i % 3) * 0.8,
        scale: 0.7 + (i % 3) * 0.35,
      })),
    []
  );

  useEffect(
    () => () => {
      ringGeos.forEach((g) => g.dispose());
      ringMats.forEach((m) => m.dispose());
      satGeo.dispose();
      satMat.dispose();
    },
    [ringGeos, ringMats, satGeo, satMat]
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const v = velocityRef?.current ?? 0;
    // Velocity spins the gimbal up; the integral keeps it continuous so a
    // scroll stop coasts down instead of snapping.
    spinRef.current += dt * (1 + v * 6);
    const spin = spinRef.current;

    ringRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const d = RING_DEFS[i];
      mesh.rotation.set(
        d.tilt[0] + Math.sin(t * 0.1 + i) * 0.15,
        d.tilt[1] + spin * d.speed,
        d.tilt[2] + Math.cos(t * 0.08 + i * 2) * 0.12
      );
    });

    satRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const s = sats[i];
      const a = s.phase + spin * s.speed;
      mesh.position.set(
        Math.cos(a) * s.radius,
        Math.sin(a * 0.7 + s.phase) * s.yAmp,
        Math.sin(a) * s.radius
      );
      mesh.rotation.x = t * 0.6 + s.phase;
      mesh.rotation.y = t * 0.4;
    });

    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(t * 0.05) * 0.06;
    }
  });

  return (
    <group ref={groupRef}>
      {RING_DEFS.map((d, i) => (
        <mesh
          key={`ring-${i}`}
          ref={(el) => {
            ringRefs.current[i] = el;
          }}
          geometry={ringGeos[i]}
          material={ringMats[i]}
          frustumCulled={false}
        />
      ))}
      {sats.map((s, i) => (
        <mesh
          key={`sat-${i}`}
          ref={(el) => {
            satRefs.current[i] = el;
          }}
          geometry={satGeo}
          material={satMat}
          scale={s.scale}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}
