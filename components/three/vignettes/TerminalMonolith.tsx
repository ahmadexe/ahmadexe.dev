"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Floating holographic CRT monolith — wire-outlined box with scanline shader.
 * Sits at y=-14 (Terminal chapter).
 */
export function TerminalMonolith({ y = -14 }: { y?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const shellRef = useRef<THREE.Mesh>(null);

  const shell = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("#00ff41") },
        uAccent: { value: new THREE.Color("#00e5ff") },
      },
      vertexShader: `
        varying vec3 vPos;
        varying vec3 vN;
        void main(){
          vPos = position;
          vN = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform vec3 uAccent;
        varying vec3 vPos;
        varying vec3 vN;
        void main(){
          float scan = smoothstep(0.48, 0.5, fract(vPos.y * 4.0 + uTime * 0.7));
          float fres = pow(1.0 - abs(dot(normalize(vN), vec3(0.0,0.0,1.0))), 2.0);
          vec3 col = mix(uColor, uAccent, fres * 0.6);
          float grid = smoothstep(0.02, 0.0, abs(fract(vPos.x * 2.0) - 0.5))
                     + smoothstep(0.02, 0.0, abs(fract(vPos.y * 2.0) - 0.5));
          col += vec3(grid) * 0.15;
          col += vec3(scan) * 0.35;
          float alpha = 0.22 + fres * 0.35 + scan * 0.15;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    }),
    []
  );

  const edgesGeom = useMemo(() => {
    const box = new THREE.BoxGeometry(4.6, 3.2, 3.0);
    return new THREE.EdgesGeometry(box);
  }, []);

  const dust = useMemo(() => {
    const pos = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4.2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.6;
    }
    return pos;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    shell.uniforms.uTime.value = t;
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.35 + t * 0.05;
      groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.06;
      groupRef.current.position.y = y + Math.sin(t * 0.4) * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[0, y, 0]}>
      <mesh ref={shellRef}>
        <boxGeometry args={[4.6, 3.2, 3.0]} />
        <shaderMaterial
          args={[shell]}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <lineSegments>
        <primitive object={edgesGeom} attach="geometry" />
        <lineBasicMaterial color="#00ff41" transparent opacity={0.8} />
      </lineSegments>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color="#00ff41"
          transparent
          opacity={0.8}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
