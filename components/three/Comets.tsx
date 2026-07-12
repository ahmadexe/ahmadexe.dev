"use client";

import { MutableRefObject, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Meteors. A dozen instanced streaks on staggered cycles, each a camera-facing
// ribbon with a hot head and a long fading tail, crossing the deep sky far
// behind the set. Hard scrolling accelerates the shared clock, so a fast
// flick sends meteors raining. One draw call; the CPU only advances a clock.

const VERT = /* glsl */ `
  uniform float uT;

  attribute vec3 aSeed;    // phase, speed multiplier, size multiplier
  attribute vec3 aOrigin;  // cycle start point on the far sphere
  attribute vec3 aDir;     // normalized flight direction

  varying vec2 vQ;         // x: 0 head .. 1 tail, y: -1..1 across
  varying float vEnv;      // fade in/out over the pass

  void main() {
    float cyc = 9.0 / aSeed.y;                      // seconds per pass
    float life = fract(uT / cyc + aSeed.x);
    // Short travel around a far origin keeps every pass in the deep
    // background — a close fly-by would render as a fat beam, not a meteor.
    vec3 head = aOrigin + aDir * (life * 56.0 - 28.0);

    float len = 7.0 + aSeed.z * 9.0;
    float wid = 0.07 + aSeed.z * 0.1;

    // Ribbon: stretched along flight, billboarded across it.
    vec3 vdir = normalize(head - cameraPosition);
    vec3 side = normalize(cross(aDir, vdir));
    vec3 world = head - aDir * ((position.x + 0.5) * len)
               + side * (position.y * wid * 2.0);

    vEnv = sin(life * 3.14159);
    vQ = vec2(position.x + 0.5, position.y * 2.0);
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;

  varying vec2 vQ;
  varying float vEnv;

  void main() {
    float head = pow(1.0 - vQ.x, 3.0);
    float across = 1.0 - clamp(abs(vQ.y), 0.0, 1.0);
    float a = head * across * vEnv;
    vec3 col = mix(uColor, vec3(1.0), head * 0.7);
    gl_FragColor = vec4(col * a * 1.8, a);
  }
`;

const COUNT = 12;

// Deterministic PRNG — same shower every visit.
function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Comets({
  velocityRef,
}: {
  velocityRef?: MutableRefObject<number>;
}) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1);
    const rand = mulberry32(4242);
    const seeds = new Float32Array(COUNT * 3);
    const origins = new Float32Array(COUNT * 3);
    const dirs = new Float32Array(COUNT * 3);

    const o = new THREE.Vector3();
    const d = new THREE.Vector3();
    const tmp = new THREE.Vector3();
    for (let i = 0; i < COUNT; i++) {
      seeds[i * 3] = rand();
      seeds[i * 3 + 1] = 0.7 + rand() * 1.1;
      seeds[i * 3 + 2] = rand();

      // Origin on a far shell, biased to the upper sky.
      const theta = rand() * Math.PI * 2;
      const y = 0.05 + rand() * 0.85;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      o.set(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(
        58 + rand() * 20
      );
      origins[i * 3] = o.x;
      origins[i * 3 + 1] = o.y;
      origins[i * 3 + 2] = o.z;

      // Flight direction: tangent to the shell, tipped downward.
      tmp.set(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
      d.crossVectors(o, tmp).normalize();
      d.y -= 0.55 + rand() * 0.35;
      d.normalize();
      dirs[i * 3] = d.x;
      dirs[i * 3 + 1] = d.y;
      dirs[i * 3 + 2] = d.z;
    }
    g.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 3));
    g.setAttribute("aOrigin", new THREE.InstancedBufferAttribute(origins, 3));
    g.setAttribute("aDir", new THREE.InstancedBufferAttribute(dirs, 3));
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uT: { value: 0 },
          uColor: { value: new THREE.Color("#00e5ff") },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    []
  );

  const mesh = useMemo(() => {
    // The shader positions every vertex from instanced attributes, so the
    // (zeroed) instanceMatrix is never read — no per-instance CPU work.
    const m = new THREE.InstancedMesh(geometry, material, COUNT);
    m.frustumCulled = false;
    return m;
  }, [geometry, material]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      mesh.dispose();
    },
    [geometry, material, mesh]
  );

  const clock = useRef(0);

  useFrame((_, dt) => {
    // Scroll velocity accelerates the shared clock — flick hard, meteors rain.
    const v = velocityRef?.current ?? 0;
    clock.current += dt * (0.9 + v * 4.0);
    material.uniforms.uT.value = clock.current;
  });

  return <primitive object={mesh} />;
}
