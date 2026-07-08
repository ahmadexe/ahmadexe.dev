"use client";

import { MutableRefObject, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// A shader-drawn grid floor under the whole scene — the classic hacker
// "wire terrain". Gentle height waves keep it alive, a scan pulse sweeps
// outward from under the subject, and everything fades with distance so it
// reads as an infinite plane instead of a plate with edges. Because the
// camera orbits the origin, the floor is what turns that orbit into real,
// felt motion: parallax lines sweeping past at the bottom of the frame.

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uVelocity;

  varying vec3 vWorld;
  varying float vHeight;

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

    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uVelocity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying vec3 vWorld;
  varying float vHeight;

  void main() {
    // Anti-aliased 1-unit grid on world xz.
    vec2 coord = vWorld.xz;
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    float line = 1.0 - min(min(grid.x, grid.y), 1.0);
    if (line < 0.01) discard;

    float dist = length(vWorld.xz);
    // Distance fade — the plane dissolves before its edge is ever visible.
    float fade = 1.0 - smoothstep(18.0, 58.0, dist);
    // Scan pulse sweeping outward from beneath the subject.
    float ring = fract(dist * 0.055 - uTime * 0.11);
    float pulse = smoothstep(0.18, 0.0, ring) * 0.85;
    // Crests catch more light than troughs.
    float relief = 0.55 + 0.45 * smoothstep(-1.6, 1.9, vHeight);

    vec3 col = mix(uColorA, uColorB, pulse);
    float a = line * fade * relief * (0.16 + pulse * 0.5 + uVelocity * 0.25);
    gl_FragColor = vec4(col, a);
  }
`;

export function WireframeTerrain({
  velocityRef,
  y = -5.4,
}: {
  velocityRef?: MutableRefObject<number>;
  y?: number;
}) {
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(130, 130, 130, 130),
    []
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uVelocity: { value: 0 },
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

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    const v = velocityRef?.current ?? 0;
    const u = material.uniforms.uVelocity;
    u.value += (v - u.value) * 0.08;
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
