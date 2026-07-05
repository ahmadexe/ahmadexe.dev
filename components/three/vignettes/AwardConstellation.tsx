"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Awards chapter vignette. Three layered starfields (near/mid/far) with
 * twinkle, a slow-drifting nebula haze, plus 5 luminous hero orbs (one per
 * award) linked by a constellation graph.
 */
export function AwardConstellation({ y = -58 }: { y?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const nearRef = useRef<THREE.Points>(null);
  const midRef = useRef<THREE.Points>(null);
  const farRef = useRef<THREE.Points>(null);
  const heroesRef = useRef<THREE.Group>(null);
  const linkMatRef = useRef<THREE.LineBasicMaterial>(null);

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

  const makeField = (
    count: number,
    innerR: number,
    outerR: number,
    yScale: number
  ) => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const cA = new THREE.Color("#d8ffe4");
    const cB = new THREE.Color("#00e5ff");
    const cC = new THREE.Color("#39ff85");
    for (let i = 0; i < count; i++) {
      const r = innerR + Math.pow(Math.random(), 0.6) * (outerR - innerR);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * yScale;
      pos[i * 3 + 2] = r * Math.cos(phi);

      const t = Math.random();
      const c =
        t < 0.75 ? cA : t < 0.92 ? cB : cC;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      seed[i] = Math.random() * Math.PI * 2;
    }
    return { pos, col, seed };
  };

  const near = useMemo(() => makeField(320, 4, 10, 0.7), []);
  const mid = useMemo(() => makeField(900, 8, 22, 0.55), []);
  const far = useMemo(() => makeField(1600, 18, 44, 0.4), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.03;
      groupRef.current.rotation.x = Math.sin(t * 0.08) * 0.05;
      groupRef.current.position.y = y + Math.sin(t * 0.25) * 0.15;
    }
    // Twinkle: cycle each layer's opacity on its own phase.
    if (nearRef.current) {
      const m = nearRef.current.material as THREE.PointsMaterial;
      m.opacity = 0.85 + Math.sin(t * 1.4) * 0.12;
    }
    if (midRef.current) {
      const m = midRef.current.material as THREE.PointsMaterial;
      m.opacity = 0.7 + Math.sin(t * 0.9 + 1.7) * 0.15;
      midRef.current.rotation.y = -t * 0.01;
    }
    if (farRef.current) {
      const m = farRef.current.material as THREE.PointsMaterial;
      m.opacity = 0.55 + Math.sin(t * 0.6 + 3.1) * 0.08;
      farRef.current.rotation.y = t * 0.006;
    }
    // Pulse the constellation links so the graph feels alive.
    if (linkMatRef.current) {
      linkMatRef.current.opacity = 0.22 + Math.sin(t * 0.8) * 0.12;
    }
    // Hero orbs — subtle breathing scale, staggered.
    if (heroesRef.current) {
      heroesRef.current.children.forEach((c, i) => {
        const s = 1 + Math.sin(t * 1.2 + i * 1.3) * 0.15;
        c.scale.setScalar(s);
      });
    }
  });

  return (
    <group ref={groupRef} position={[0, y, 0]}>
      {/* Hero orbs — the 5 awards */}
      <group ref={heroesRef}>
        {heroOrbs.map((p, i) => (
          <group key={i} position={p}>
            <mesh>
              <sphereGeometry args={[0.22, 24, 24]} />
              <meshBasicMaterial
                color={i % 2 === 0 ? "#00ff41" : "#00e5ff"}
                toneMapped={false}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.55, 16, 16]} />
              <meshBasicMaterial
                color={i % 2 === 0 ? "#00ff41" : "#00e5ff"}
                transparent
                opacity={0.14}
                toneMapped={false}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        ))}
      </group>

      <lineSegments>
        <primitive object={linkGeom} attach="geometry" />
        <lineBasicMaterial
          ref={linkMatRef}
          color="#00ff41"
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </lineSegments>

      {/* Near stars — bright, chunky, foreground sparks */}
      <points ref={nearRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[near.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[near.col, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.11}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Mid stars — the bulk of the field */}
      <points ref={midRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[mid.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[mid.col, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          vertexColors
          transparent
          opacity={0.75}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Far stars — dense pinprick backdrop */}
      <points ref={farRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[far.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[far.col, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.028}
          vertexColors
          transparent
          opacity={0.6}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Nebula haze — one big soft billboard behind everything */}
      <mesh position={[0, 0, -18]}>
        <planeGeometry args={[80, 40]} />
        <meshBasicMaterial
          color="#003a1a"
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
