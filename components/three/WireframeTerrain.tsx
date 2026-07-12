"use client";

import { MutableRefObject, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { morphOf, pulseOf } from "./useChapterProgress";

// A shader-drawn grid floor under the whole scene — the classic hacker
// "wire terrain". Gentle height waves keep it alive, a scan pulse sweeps
// outward from under the subject, and a jagged mountain ridge rises at the
// rim so every horizon shot ends in a glowing silhouette instead of a flat
// void. On each shape morph a shockwave ring races outward across the plane,
// synced with the particle cloud's scatter.

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uVelocity;

  varying vec3 vWorld;
  varying float vHeight;
  varying float vRidge;

  void main() {
    vec3 pos = position;
    // Two crossed low-frequency waves — rolling dunes, not noise fizz.
    float amp = 0.55 + uVelocity * 0.9;
    float h =
      sin(pos.x * 0.22 + uTime * 0.35) * 0.6 +
      cos(pos.y * 0.17 - uTime * 0.22) * 0.5 +
      sin((pos.x + pos.y) * 0.09 + uTime * 0.12) * 0.9;
    pos.z += h * amp; // plane is rotated -90° so local z is world up
    vHeight = h;

    // Mountain rim: static ridged peaks past the spire field. Integer angular
    // frequencies keep the ring seamless at ±PI.
    float dist = length(pos.xy);
    float ang = atan(pos.y, pos.x);
    float ridge =
      (1.0 - abs(sin(ang * 9.0 + sin(ang * 3.0) * 1.7))) * 0.55 +
      (1.0 - abs(sin(ang * 17.0 + 2.3))) * 0.3 +
      (1.0 - abs(sin(ang * 29.0 + 5.1))) * 0.15;
    float rim = smoothstep(30.0, 52.0, dist);
    vRidge = ridge * rim;
    pos.z += ridge * ridge * rim * 13.0;

    vec4 world = modelMatrix * vec4(pos, 1.0);
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
  varying float vHeight;
  varying float vRidge;

  void main() {
    // Anti-aliased 1-unit grid on world xz.
    vec2 coord = vWorld.xz;
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    float line = 1.0 - min(min(grid.x, grid.y), 1.0);
    if (line < 0.01) discard;

    float dist = length(vWorld.xz);
    // Distance fade — the plane dissolves before its edge is ever visible.
    float fade = 1.0 - smoothstep(34.0, 88.0, dist);
    // Scan pulse sweeping outward from beneath the subject.
    float ring = fract(dist * 0.055 - uTime * 0.11);
    float pulse = smoothstep(0.18, 0.0, ring) * 0.85;
    // Crests catch more light than troughs; mountain ridges blaze.
    float relief = 0.55 + 0.45 * smoothstep(-1.6, 1.9, vHeight);

    // Morph shockwave: a hot ring racing from the origin to the mountains,
    // its radius scrubbed by morph progress so it reverses with the scroll.
    float shockR = uMorph * 60.0;
    float shock = smoothstep(2.4, 0.0, abs(dist - shockR)) * uPulse;

    vec3 col = mix(uColorA, uColorB, clamp(pulse + vRidge * 0.7 + shock, 0.0, 1.0));
    float a = line * fade * relief *
      (0.22 + pulse * 0.6 + uVelocity * 0.25 + vRidge * 0.55 + shock * 0.9);
    gl_FragColor = vec4(col, a);
  }
`;

export function WireframeTerrain({
  progressRef,
  velocityRef,
  y = -5.4,
}: {
  progressRef?: MutableRefObject<number>;
  velocityRef?: MutableRefObject<number>;
  y?: number;
}) {
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(190, 190, 190, 190),
    []
  );

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

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  const easedP = useRef(0);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    const v = velocityRef?.current ?? 0;
    const u = material.uniforms.uVelocity;
    u.value += (v - u.value) * 0.08;

    // Same easing as the morph cloud so the shockwave leaves the origin at
    // the exact moment the particles scatter.
    easedP.current += ((progressRef?.current ?? 0) - easedP.current) * 0.08;
    const m = morphOf(easedP.current);
    material.uniforms.uMorph.value = m;
    material.uniforms.uPulse.value = pulseOf(m, v);
  });

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation-x={-Math.PI / 2}
      position-y={y}
      frustumCulled={false}
    />
  );
}
