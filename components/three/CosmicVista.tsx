"use client";

import { MutableRefObject, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { morphOf, pulseOf } from "./useChapterProgress";

// The sky. An inward-facing dome painted with a procedural nebula, layered
// twinkling starfields, a tilted galactic band and aurora curtains — so every
// camera angle in the stunt reel lands on an actual vista instead of black
// void. The palette grades per chapter (green abyss → cyan → gold → violet)
// and the whole sky flashes on every shape morph, tying the heavens to the
// protagonist. One draw call; all cost is fragment ALU.

const VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uPulse;      // morph flash, 0..1 (velocity-gated)
  uniform float uVelocity;
  uniform vec3 uColA;        // dominant nebula colour (chapter graded)
  uniform vec3 uColB;        // secondary / filament colour
  uniform vec3 uAur;         // aurora colour
  uniform float uAurAmt;     // aurora strength (chapter graded)

  varying vec3 vDir;

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

  float fbm(vec3 p){
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < OCTAVES; i++) {
      s += a * snoise(p);
      p = p * 2.02 + vec3(17.3, 9.1, 4.7);
      a *= 0.55;
    }
    return s;
  }

  float hash13(vec3 p){
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }
  vec3 hash33(vec3 p){
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.xxy + p.yxx) * p.zyx);
  }

  // Cell-hashed stars on the sphere: each 3D cell may own one twinkling point.
  float starLayer(vec3 d, float scale, float density, float t){
    vec3 p = d * scale;
    vec3 id = floor(p);
    vec3 f = fract(p);
    vec3 sp = hash33(id) * 0.7 + 0.15;
    float star = smoothstep(0.16, 0.02, length(f - sp));
    float sel = step(1.0 - density, hash13(id));
    float tw = 0.55 + 0.45 * sin(t * (1.0 + hash13(id + 7.7) * 2.5) + hash13(id + 3.3) * 6.2831);
    return star * sel * tw;
  }

  void main(){
    vec3 d = normalize(vDir);
    float t = uTime;

    // Tilted galactic band — the Milky Way stripe the nebula clings to.
    vec3 bn = normalize(vec3(0.34, 1.0, 0.18));
    float band = exp(-abs(dot(d, bn)) * 3.4);

    // Nebula: one field for volume, a warped second field for filaments.
    vec3 q = d * 2.3 + vec3(0.0, 0.0, t * 0.004);
    float n1 = fbm(q);
    float density = smoothstep(-0.25, 0.85, n1) * (0.35 + band * 0.95);
    vec3 col = uColA * density * 0.36;
    #ifndef LOWQ
      float n2 = fbm(q * 1.9 + vec3(5.2, 1.3, 8.4) + n1 * 0.7);
      float fil = pow(clamp(1.0 - abs(n2), 0.0, 1.0), 3.0) * (0.3 + band * 1.1);
      col += uColB * fil * 0.4;
    #endif

    // Stars — denser along the band. Bright heads poke over the bloom
    // threshold, so the sky genuinely glimmers.
    float s = starLayer(d, 26.0, 0.16 + band * 0.2, t) * 0.9;
    #ifndef LOWQ
      s += starLayer(d, 52.0, 0.10 + band * 0.16, t * 1.3) * 0.55;
    #endif
    col += vec3(0.75, 1.0, 0.9) * s;

    // Aurora curtains — vertical rays high in the sky, drifting slowly.
    #ifndef LOWQ
      float av = smoothstep(0.10, 0.34, d.y) * (1.0 - smoothstep(0.5, 0.82, d.y));
      float a1 = snoise(vec3(d.x * 3.1, d.y * 0.7 - t * 0.09, d.z * 3.1));
      float a2 = snoise(vec3(d.x * 6.4 + 9.0, d.y * 1.3 - t * 0.14, d.z * 6.4));
      float curt = pow(clamp(a1 * 0.5 + 0.5, 0.0, 1.0), 2.4) * (0.55 + 0.45 * a2);
      col += uAur * curt * av * uAurAmt;
    #endif

    // Thin glow line where sky meets the terrain.
    col += uColB * exp(-abs(d.y + 0.03) * 9.0) * 0.1;

    // The whole sky breathes on every shape morph and on hard scroll.
    col *= 1.0 + uPulse * 0.5 + uVelocity * 0.18;

    // Sink everything below the horizon into the dark; the floor owns it.
    col *= 0.12 + 0.88 * smoothstep(-0.42, 0.08, d.y);

    gl_FragColor = vec4(col, 1.0);
  }
`;

// Chapter-graded sky moods, sampled like FOG_STOPS so sky and fog agree.
const SKY_STOPS: {
  p: number;
  a: THREE.Color;
  b: THREE.Color;
  aur: THREE.Color;
  amt: number;
}[] = [
  { p: 0.0, a: new THREE.Color("#07341c"), b: new THREE.Color("#052c3e"), aur: new THREE.Color("#00ff41"), amt: 0.5 },
  { p: 0.25, a: new THREE.Color("#0a3f1e"), b: new THREE.Color("#06333f"), aur: new THREE.Color("#00ff41"), amt: 0.3 },
  { p: 0.5, a: new THREE.Color("#07354b"), b: new THREE.Color("#0a3d2a"), aur: new THREE.Color("#00e5ff"), amt: 0.35 },
  { p: 0.75, a: new THREE.Color("#4a3a08"), b: new THREE.Color("#123a28"), aur: new THREE.Color("#ffd24a"), amt: 0.45 },
  { p: 1.0, a: new THREE.Color("#2a0c52"), b: new THREE.Color("#0a1442"), aur: new THREE.Color("#8a5cff"), amt: 0.75 },
];

export function CosmicVista({
  progressRef,
  velocityRef,
  quality = "high",
}: {
  progressRef: MutableRefObject<number>;
  velocityRef?: MutableRefObject<number>;
  quality?: "high" | "low";
}) {
  const geometry = useMemo(() => new THREE.SphereGeometry(90, 48, 32), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        defines:
          quality === "low" ? { OCTAVES: 3, LOWQ: 1 } : { OCTAVES: 4 },
        uniforms: {
          uTime: { value: 0 },
          uPulse: { value: 0 },
          uVelocity: { value: 0 },
          uColA: { value: SKY_STOPS[0].a.clone() },
          uColB: { value: SKY_STOPS[0].b.clone() },
          uAur: { value: SKY_STOPS[0].aur.clone() },
          uAurAmt: { value: SKY_STOPS[0].amt },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
      }),
    [quality]
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  const meshRef = useRef<THREE.Mesh>(null);
  const easedP = useRef(0);
  const tmpA = useMemo(() => new THREE.Color(), []);
  const tmpB = useMemo(() => new THREE.Color(), []);
  const tmpAur = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const u = material.uniforms;
    u.uTime.value = state.clock.elapsedTime;

    const v = velocityRef?.current ?? 0;
    u.uVelocity.value += (v - u.uVelocity.value) * 0.08;

    // Same easing as the morph cloud, so the sky flash lands with the scatter.
    easedP.current += ((progressRef.current ?? 0) - easedP.current) * 0.08;
    const p = easedP.current;
    u.uPulse.value = pulseOf(morphOf(p), v);

    // Chapter palette lerp.
    let a = SKY_STOPS[0];
    let b = SKY_STOPS[SKY_STOPS.length - 1];
    for (let i = 0; i < SKY_STOPS.length - 1; i++) {
      if (p >= SKY_STOPS[i].p && p <= SKY_STOPS[i + 1].p) {
        a = SKY_STOPS[i];
        b = SKY_STOPS[i + 1];
        break;
      }
    }
    const k = Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p || 1)));
    tmpA.copy(a.a).lerp(b.a, k);
    tmpB.copy(a.b).lerp(b.b, k);
    tmpAur.copy(a.aur).lerp(b.aur, k);
    (u.uColA.value as THREE.Color).lerp(tmpA, 0.06);
    (u.uColB.value as THREE.Color).lerp(tmpB, 0.06);
    (u.uAur.value as THREE.Color).lerp(tmpAur, 0.06);
    u.uAurAmt.value += (a.amt + (b.amt - a.amt) * k - u.uAurAmt.value) * 0.06;

    // Imperceptibly slow sky drift so long dwell times still feel alive.
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.0035;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      renderOrder={-100}
      frustumCulled={false}
    />
  );
}
