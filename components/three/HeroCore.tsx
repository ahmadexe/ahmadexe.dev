"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function useDistortShader() {
  return useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uAmp: { value: 0.15 },
        uColor: { value: new THREE.Color("#00ff41") },
        uAccent: { value: new THREE.Color("#00e5ff") },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uAmp;
        varying vec3 vNormal;
        varying vec3 vPos;
        varying float vNoise;

        // simple 3d noise
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

        void main(){
          vNormal = normal;
          vec3 pos = position;
          float n = snoise(pos * 1.3 + vec3(uTime * 0.4));
          vNoise = n;
          pos += normal * n * uAmp;
          vPos = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uAccent;
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vPos;
        varying float vNoise;

        void main(){
          float fres = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0,0.0,1.0))), 2.0);
          vec3 col = mix(uColor, uAccent, fres * 0.6 + vNoise * 0.3);
          float scan = smoothstep(0.48, 0.5, fract(vPos.y * 3.0 + uTime * 0.5));
          col += vec3(scan) * 0.15;
          gl_FragColor = vec4(col, 0.85);
        }
      `,
    }),
    []
  );
}

export function HeroCore() {
  const groupRef = useRef<THREE.Group>(null);
  const solidRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);

  const shader = useDistortShader();
  const pointer = useRef(new THREE.Vector2(0, 0));

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    shader.uniforms.uTime.value = t;

    // Smooth pointer follow (pointer is normalized -1..1 in R3F state)
    pointer.current.x += (state.pointer.x - pointer.current.x) * 0.05;
    pointer.current.y += (state.pointer.y - pointer.current.y) * 0.05;
    const px = pointer.current.x;
    const py = pointer.current.y;

    if (groupRef.current) {
      groupRef.current.rotation.y = px * 0.35;
      groupRef.current.rotation.x = -py * 0.25;
      groupRef.current.position.x = px * 0.25;
      groupRef.current.position.y = py * 0.2;
    }
    if (solidRef.current) {
      solidRef.current.rotation.x = t * 0.15;
      solidRef.current.rotation.y = t * 0.2;
    }
    if (wireRef.current) {
      wireRef.current.rotation.x = t * 0.15;
      wireRef.current.rotation.y = t * 0.2;
      const s = 1 + Math.sin(t * 2) * 0.02 + Math.abs(px + py) * 0.03;
      wireRef.current.scale.setScalar(s);
    }
    if (ring1.current) {
      ring1.current.rotation.x = t * 0.4 + py * 0.3;
      ring1.current.rotation.y = t * 0.3 + px * 0.3;
    }
    if (ring2.current) {
      ring2.current.rotation.x = -t * 0.25 - py * 0.2;
      ring2.current.rotation.z = t * 0.35 + px * 0.2;
    }
    if (ring3.current) {
      ring3.current.rotation.y = t * 0.5 + px * 0.4;
      ring3.current.rotation.z = -t * 0.2 - py * 0.3;
    }

    // Shader distortion pulses gently with cursor proximity
    shader.uniforms.uAmp.value =
      0.15 + Math.min(0.12, Math.hypot(px, py) * 0.1);
  });

  return (
    <group ref={groupRef}>
      <mesh ref={solidRef}>
        <icosahedronGeometry args={[1.7, 32]} />
        <shaderMaterial args={[shader]} transparent />
      </mesh>

      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1.72, 2]} />
        <meshBasicMaterial
          color="#00ff41"
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>

      <mesh ref={ring1}>
        <torusGeometry args={[2.6, 0.02, 8, 128]} />
        <meshBasicMaterial color="#00ff41" transparent opacity={0.7} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 3, 0, Math.PI / 4]}>
        <torusGeometry args={[3.1, 0.015, 8, 128]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.6} />
      </mesh>
      <mesh ref={ring3} rotation={[Math.PI / 6, Math.PI / 4, 0]}>
        <torusGeometry args={[3.7, 0.012, 8, 128]} />
        <meshBasicMaterial color="#00ff41" transparent opacity={0.35} />
      </mesh>

      {/* satellite dots */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const r = 4.2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * r, Math.sin(angle) * r, 0]}
          >
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color={i % 4 === 0 ? "#00e5ff" : "#00ff41"} />
          </mesh>
        );
      })}
    </group>
  );
}
