"use client";

import { MutableRefObject, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  sphere,
  lattice,
  torusKnot,
  diamond,
  galaxy,
  randoms,
} from "./shapes";

// The protagonist. One particle cloud that never leaves the stage — it morphs
// through five shapes as the page scrolls, so the whole site reads as a single
// entity becoming many things instead of a reel of disconnected props.
//
// All the heavy lifting is on the GPU: every particle carries its position in
// all five shapes as vertex attributes, and the vertex shader picks the two
// shapes bracketing the current scroll progress and lerps between them, then
// adds curl-noise flow so the cloud is always alive (and explodes outward
// mid-transition + on fast scroll). No CPU per-frame work beyond a handful of
// uniform writes.

const VERT = /* glsl */ `
  #define PI 3.14159265359

  uniform float uTime;
  uniform float uProgress;   // 0..1 across the whole scroll
  uniform float uVelocity;   // smoothed scroll speed, 0..1
  uniform float uSize;
  uniform float uPixelRatio;

  attribute vec3 aShape0;
  attribute vec3 aShape1;
  attribute vec3 aShape2;
  attribute vec3 aShape3;
  attribute vec3 aShape4;
  attribute vec3 aRnd;       // per-particle randoms

  varying float vMix;        // color ramp input
  varying float vGlow;       // head/sparkle brightness
  varying float vForm;       // depth-form shading, 0 back .. 1 front

  // --- simplex noise (Ashima) ---
  vec3 mod289(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
  vec4 mod289(vec4 x){ return x - floor(x*(1.0/289.0))*289.0; }
  vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314*r; }
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m*m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  vec3 snoiseVec3(vec3 x){
    return vec3(
      snoise(x),
      snoise(vec3(x.y - 19.1, x.z + 33.4, x.x + 47.2)),
      snoise(vec3(x.z + 74.2, x.x - 124.5, x.y + 99.4))
    );
  }
  vec3 curlNoise(vec3 p){
    const float e = 0.1;
    vec3 dx = vec3(e, 0.0, 0.0);
    vec3 dy = vec3(0.0, e, 0.0);
    vec3 dz = vec3(0.0, 0.0, e);
    vec3 p_x0 = snoiseVec3(p - dx), p_x1 = snoiseVec3(p + dx);
    vec3 p_y0 = snoiseVec3(p - dy), p_y1 = snoiseVec3(p + dy);
    vec3 p_z0 = snoiseVec3(p - dz), p_z1 = snoiseVec3(p + dz);
    float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
    float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
    float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;
    return normalize(vec3(x, y, z) * (1.0 / (2.0 * e)));
  }

  void main(){
    // Which two shapes are we between?
    float segF = clamp(uProgress, 0.0, 0.9999) * 4.0;
    float seg = floor(segF);
    float t = smoothstep(0.0, 1.0, fract(segF));

    vec3 a, b;
    if (seg < 1.0)      { a = aShape0; b = aShape1; }
    else if (seg < 2.0) { a = aShape1; b = aShape2; }
    else if (seg < 3.0) { a = aShape2; b = aShape3; }
    else                { a = aShape3; b = aShape4; }
    vec3 pos = mix(a, b, t);
    vec3 basePos = pos;   // pre-flow, pre-spin — stable per-particle color anchor

    // Transition swell — particles scatter at the midpoint of every morph,
    // then reform, so shapes dissolve into each other instead of snapping.
    float transition = sin(fract(segF) * PI);

    // Curl-noise flow keeps the cloud alive but stays gentle at rest so each
    // shape's silhouette reads crisply; velocity + transition inflate it into
    // an explosion on hard scrolls and between shapes.
    float turb = 0.05 + uVelocity * 1.5 + transition * 1.3;
    vec3 flow = curlNoise(pos * 0.32 + uTime * 0.045);
    pos += flow * turb * (0.2 + aRnd.x * 0.55);

    // Slow global spin for parallax life.
    float ang = uTime * 0.05;
    float ca = cos(ang), sa = sin(ang);
    pos = vec3(ca * pos.x + sa * pos.z, pos.y, -sa * pos.x + ca * pos.z);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float dist = -mv.z;

    // Depth-form shading. Additive blending erases all depth, so a shell of
    // equal-brightness points renders as a flat noise disc. Compare each point's
    // view-space depth to the cloud centre: near-side points glow, far-side
    // points recede — restoring a legible 3D sphere instead of TV static.
    vec4 centerView = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float facing = smoothstep(-2.8, 2.8, mv.z - centerView.z);  // 0 back, 1 front
    float vForm = 0.25 + 0.75 * facing;

    // Size: per-particle variation, perspective attenuation, a pulse, and a
    // swell during transitions so morphs visibly surge.
    float pulse = 0.9 + 0.1 * sin(uTime * 1.5 + aRnd.z * 6.283);
    // Tighter size spread — a wild 3x range reads as brightness noise; keep
    // points near-uniform so the cloud looks like a deliberate constellation.
    float size = uSize * (0.78 + aRnd.y * 0.44) * pulse * (1.0 + transition * 0.5);
    // Near-side points a touch larger than far-side — reinforces the form.
    size *= 0.7 + 0.3 * facing;
    // uPixelRatio matches the renderer's real pixel ratio (set per-frame from
    // gl.getPixelRatio), so points are sized in true device pixels and stay
    // crisp at Retina 2x instead of being upscaled/smeared.
    gl_PointSize = clamp(size * uPixelRatio * (12.0 / dist), 1.5, 8.0);
    gl_Position = projectionMatrix * mv;

    // Color coherently, not per-particle. A smooth vertical gradient plus a
    // low-frequency noise band means neighbouring points share a hue, so the
    // cloud reads as a clean volume with green→cyan banding instead of
    // salt-and-pepper static. Velocity/transition push it toward cyan.
    float band = basePos.y * 0.16 + snoise(basePos * 0.4) * 0.18;
    vMix = clamp(0.5 + band + uVelocity * 0.3 + transition * 0.25, 0.0, 1.0);
    // A very sparse, gentle sparkle for life — kept rare and dim so dense
    // overlaps never wash to white over the page text.
    vGlow = step(0.988, aRnd.x) * 0.35 + transition * 0.12;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  varying float vMix;
  varying float vGlow;
  varying float vForm;

  void main(){
    // Crisp round points — a solid core with just a 1-2px soft rim, so the
    // cloud reads as distinct grains instead of an overlapping haze.
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.34, 0.5, d);

    vec3 col = mix(uColorA, uColorB, vMix);
    col += vGlow * vec3(0.35, 0.55, 0.45);   // sparse heads brighten gently
    // Depth-form: the near hemisphere reads bright, the far side sinks into the
    // dark so the cloud looks like a lit sphere, not a flat field of noise.
    gl_FragColor = vec4(col * vForm, alpha * uOpacity * vForm);
  }
`;

function readThemeColors(): [THREE.Color, THREE.Color] {
  const a = new THREE.Color("#00ff41");
  const b = new THREE.Color("#00e5ff");
  if (typeof window === "undefined") return [a, b];
  try {
    const cs = getComputedStyle(document.documentElement);
    const m = cs.getPropertyValue("--matrix").trim();
    const c = cs.getPropertyValue("--cyan").trim();
    if (m) a.set(m);
    if (c) b.set(c);
  } catch {
    /* keep defaults */
  }
  return [a, b];
}

export function MorphParticles({
  count = 90000,
  progressRef,
  velocityRef,
  size = 2.6,
}: {
  count?: number;
  progressRef: MutableRefObject<number>;
  velocityRef?: MutableRefObject<number>;
  size?: number;
}) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const s0 = sphere(new Float32Array(count * 3), count);
    const s1 = lattice(new Float32Array(count * 3), count);
    const s2 = torusKnot(new Float32Array(count * 3), count);
    const s3 = diamond(new Float32Array(count * 3), count);
    const s4 = galaxy(new Float32Array(count * 3), count);
    // position is required by three; point it at the first shape.
    g.setAttribute("position", new THREE.BufferAttribute(s0, 3));
    g.setAttribute("aShape0", new THREE.BufferAttribute(s0, 3));
    g.setAttribute("aShape1", new THREE.BufferAttribute(s1, 3));
    g.setAttribute("aShape2", new THREE.BufferAttribute(s2, 3));
    g.setAttribute("aShape3", new THREE.BufferAttribute(s3, 3));
    g.setAttribute("aShape4", new THREE.BufferAttribute(s4, 3));
    g.setAttribute("aRnd", new THREE.BufferAttribute(randoms(count), 3));
    // Never cull — the cloud can inflate well past its rest bounds.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1e3);
    return g;
  }, [count]);

  // Build the material imperatively and own it outright. Passing uniforms
  // through the <shaderMaterial> prop makes R3F clone them, so per-frame writes
  // land on a detached copy the shader never reads — mutating this material's
  // own uniforms is the only reliable path.
  const material = useMemo(() => {
    const [a, b] = readThemeColors();
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uVelocity: { value: 0 },
        uSize: { value: size },
        uPixelRatio: {
          value:
            typeof window !== "undefined"
              ? Math.min(window.devicePixelRatio, 2)
              : 1,
        },
        uOpacity: { value: 0.95 },
        uColorA: { value: a },
        uColorB: { value: b },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      // Depth-write ON + normal blending: front points occlude the ones behind
      // them, so the shell renders as a solid 3D surface of grains instead of an
      // additive pile-up that reads as flat TV static. This is the single change
      // that makes the orb look crisp and clean rather than noisy.
      depthWrite: true,
      depthTest: true,
      blending: THREE.NormalBlending,
    });
  }, [size]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  // Re-read theme colors whenever the shell flips the palette.
  useEffect(() => {
    const onTheme = () => {
      const [a, b] = readThemeColors();
      material.uniforms.uColorA.value = a;
      material.uniforms.uColorB.value = b;
    };
    const mo = new MutationObserver(onTheme);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => mo.disconnect();
  }, [material]);

  useFrame((state) => {
    const u = material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    // Keep point sizing locked to the actual render resolution, which can move
    // when the PerformanceMonitor changes DPR.
    u.uPixelRatio.value = state.gl.getPixelRatio();
    // Ease progress/velocity so the morph never jitters on noisy scroll input.
    const p = progressRef.current ?? 0;
    u.uProgress.value += (p - u.uProgress.value) * 0.08;
    const v = velocityRef?.current ?? 0;
    u.uVelocity.value += (v - u.uVelocity.value) * 0.1;
  });

  return (
    <points geometry={geometry} material={material} frustumCulled={false} />
  );
}
