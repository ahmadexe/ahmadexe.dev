"use client";

import { MutableRefObject, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WAYPOINTS, morphOf, pulseOf } from "./useChapterProgress";

// A forest of glowing data monoliths rising from the wire terrain. This is
// what makes the camera stunts LEGIBLE: motion is only felt when structures
// pass close to the lens, and the old scene had nothing between the subject
// and the horizon. The spires stand in an annulus around the orbit band, so
// the deck-skim waypoint threads between them, the corkscrew sweeps them
// across the frame, and the god shot looks straight down a canyon of them.
//
// One instanced draw call. Placement is rejection-sampled away from every
// camera path segment so no stunt ever clips through a spire.

const VERT = /* glsl */ `
  varying vec3 vWorld;
  varying float vLocalY;

  void main() {
    vLocalY = position.y; // unit box is base-anchored: y in 0..1 pre-scale
    vec4 p = vec4(position, 1.0);
    #ifdef USE_INSTANCING
      p = instanceMatrix * p;
    #endif
    vec4 world = modelMatrix * p;
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uVelocity;
  uniform float uMorph;   // 0..1 within the current shape morph
  uniform float uPulse;   // velocity-gated morph flash
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying vec3 vWorld;
  varying float vLocalY;

  void main() {
    // Window-grid on the faces, drawn in world space so it matches the floor.
    vec2 c = vec2(vWorld.y * 1.4, (vWorld.x + vWorld.z) * 1.4);
    vec2 grid = abs(fract(c - 0.5) - 0.5) / fwidth(c);
    float line = 1.0 - min(min(grid.x, grid.y), 1.0);
    if (line < 0.01) discard;

    // Data pulse climbing each spire; scroll velocity uploads faster.
    float pulse = smoothstep(0.22, 0.0,
      fract(vLocalY * 2.0 - uTime * (0.18 + uVelocity * 0.5)));

    // Same distance dissolve as the terrain so the field has no hard edge.
    float fade = 1.0 - smoothstep(16.0, 46.0, length(vWorld.xz));
    // Thin out toward the tip — spires taper into the dark instead of capping.
    float tip = 1.0 - vLocalY * 0.45;

    // Terrain shockwave lighting the city in a wave as it passes through.
    float shock = smoothstep(3.0, 0.0, abs(length(vWorld.xz) - uMorph * 60.0)) * uPulse;

    vec3 col = mix(uColorA, uColorB, clamp(pulse + vLocalY * 0.3 + shock, 0.0, 1.0));
    float a = line * fade * tip *
      (0.3 + pulse * 0.9 + uVelocity * 0.25 + shock * 1.1);
    gl_FragColor = vec4(col, a);
  }
`;

// Deterministic PRNG — the field must be identical every visit/render.
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

// Distance from point q to segment ab, in the xz plane.
function distToSegmentXZ(
  qx: number,
  qz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number
) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  const t =
    len2 === 0
      ? 0
      : Math.min(1, Math.max(0, ((qx - ax) * dx + (qz - az) * dz) / len2));
  const px = ax + dx * t;
  const pz = az + dz * t;
  return Math.hypot(qx - px, qz - pz);
}

const SPIRE_COUNT = 56;
const CLEARANCE = 2.6; // min xz distance from any camera path segment
const FLOOR_Y = -5.4; // matches WireframeTerrain

export function DataSpires({
  progressRef,
  velocityRef,
}: {
  progressRef?: MutableRefObject<number>;
  velocityRef?: MutableRefObject<number>;
}) {
  const geometry = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0); // base-anchor so instance scale-y is pure height
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uVelocity: { value: 0 },
          uMorph: { value: 0 },
          uPulse: { value: 0 },
          uColorA: { value: new THREE.Color("#00ff41") },
          uColorB: { value: new THREE.Color("#00e5ff") },
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
    const m = new THREE.InstancedMesh(geometry, material, SPIRE_COUNT);
    const rand = mulberry32(1337);
    const mat4 = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const posV = new THREE.Vector3();
    const sclV = new THREE.Vector3();

    let placed = 0;
    let guard = 0;
    while (placed < SPIRE_COUNT && guard++ < SPIRE_COUNT * 40) {
      const ang = rand() * Math.PI * 2;
      const radius = 8 + rand() * 18;
      const x = Math.cos(ang) * radius;
      const z = Math.sin(ang) * radius;

      // Keep every stunt segment clear — the skim flies at spire height.
      let clear = true;
      for (let i = 0; i < WAYPOINTS.length - 1 && clear; i++) {
        const a = WAYPOINTS[i].pos;
        const b = WAYPOINTS[i + 1].pos;
        if (distToSegmentXZ(x, z, a[0], a[2], b[0], b[2]) < CLEARANCE) {
          clear = false;
        }
      }
      if (!clear) continue;

      const h = 3 + rand() * 9;
      const w = 0.35 + rand() * 0.55;
      posV.set(x, FLOOR_Y, z);
      quat.setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        rand() * Math.PI * 0.5
      );
      sclV.set(w, h, w);
      mat4.compose(posV, quat, sclV);
      m.setMatrixAt(placed++, mat4);
    }
    m.count = placed;
    m.instanceMatrix.needsUpdate = true;
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

  const easedP = useRef(0);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    const v = velocityRef?.current ?? 0;
    const u = material.uniforms.uVelocity;
    u.value += (v - u.value) * 0.08;

    // Track the terrain shockwave (same easing as the morph cloud).
    easedP.current += ((progressRef?.current ?? 0) - easedP.current) * 0.08;
    const m = morphOf(easedP.current);
    material.uniforms.uMorph.value = m;
    material.uniforms.uPulse.value = pulseOf(m, v);
  });

  return <primitive object={mesh} />;
}
