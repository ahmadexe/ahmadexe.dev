"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// A colossal eclipsed planet hanging on the horizon — roughly 25 degrees of
// sky. The body is near-black with a blazing fresnel rim (hot enough to feed
// the bloom pass) plus an additive atmosphere halo, so it reads as a total
// eclipse no matter where the stunt camera is. Scale is what sells awe: the
// entire spire city fits inside its silhouette. Two draw calls.

const BODY_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vW;
  void main() {
    vN = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vW = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const BODY_FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uRim;

  varying vec3 vN;
  varying vec3 vW;

  // Cheap value noise for faint surface mottling.
  float hash(vec3 p){
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float vnoise(vec3 x){
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }

  void main() {
    vec3 n = normalize(vN);
    vec3 view = normalize(cameraPosition - vW);
    float facing = clamp(dot(n, view), 0.0, 1.0);

    // Near-black disc with the faintest surface detail so it isn't a hole.
    float m = vnoise(n * 6.0 + uTime * 0.008);
    vec3 col = vec3(0.004, 0.012, 0.008) * (0.5 + m);

    // The blazing eclipse rim. Slow shimmer keeps it alive.
    float rim = pow(1.0 - facing, 6.0);
    float shimmer = 0.85 + 0.15 * sin(uTime * 0.7 + n.y * 14.0);
    col += uRim * rim * 1.9 * shimmer;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const HALO_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vW;
  void main() {
    vN = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vW = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const HALO_FRAG = /* glsl */ `
  precision highp float;

  uniform vec3 uGlow;

  varying vec3 vN;
  varying vec3 vW;

  void main() {
    vec3 n = normalize(vN);
    vec3 view = normalize(cameraPosition - vW);
    float fres = pow(1.0 - clamp(dot(n, view), 0.0, 1.0), 2.6);
    gl_FragColor = vec4(uGlow * fres, fres * 0.55);
  }
`;

export function EclipsePlanet({
  position = [40, 22, -58] as [number, number, number],
  radius = 17,
}: {
  position?: [number, number, number];
  radius?: number;
}) {
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 48, 32), []);

  const bodyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uRim: { value: new THREE.Color("#aaffd0") },
        },
        vertexShader: BODY_VERT,
        fragmentShader: BODY_FRAG,
      }),
    []
  );

  const haloMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uGlow: { value: new THREE.Color("#37ffa0") },
        },
        vertexShader: HALO_VERT,
        fragmentShader: HALO_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useEffect(
    () => () => {
      geometry.dispose();
      bodyMat.dispose();
      haloMat.dispose();
    },
    [geometry, bodyMat, haloMat]
  );

  const bodyRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    bodyMat.uniforms.uTime.value = state.clock.elapsedTime;
    if (bodyRef.current) {
      bodyRef.current.rotation.y = state.clock.elapsedTime * 0.006;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={bodyRef}
        geometry={geometry}
        material={bodyMat}
        scale={radius}
        frustumCulled={false}
      />
      <mesh
        geometry={geometry}
        material={haloMat}
        scale={radius * 1.07}
        frustumCulled={false}
      />
    </group>
  );
}
