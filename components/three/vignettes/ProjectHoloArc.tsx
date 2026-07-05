"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Arc of 5 hologram tiles around a shared center — one per project.
 * Sits at y=-34 (Projects chapter).
 */
export function ProjectHoloArc({ y = -34 }: { y?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  const tileShader = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("#00ff41") },
        uAccent: { value: new THREE.Color("#00e5ff") },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main(){
          vUv = uv;
          vNormal = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform vec3 uAccent;
        varying vec2 vUv;
        varying vec3 vNormal;
        void main(){
          vec2 uv = vUv;
          float scan = smoothstep(0.48, 0.5, fract(uv.y * 20.0 + uTime * 0.6));
          float edge = smoothstep(0.02, 0.0, min(uv.x, 1.0 - uv.x))
                     + smoothstep(0.02, 0.0, min(uv.y, 1.0 - uv.y));
          float grid = smoothstep(0.02, 0.0, abs(fract(uv.x * 10.0) - 0.5)) * 0.4
                     + smoothstep(0.02, 0.0, abs(fract(uv.y * 10.0) - 0.5)) * 0.4;
          float fres = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0,0.0,1.0))), 2.0);
          vec3 col = mix(uColor, uAccent, fres * 0.4);
          col += vec3(scan) * 0.3 + edge * 0.8 + grid * 0.15;
          float alpha = 0.12 + edge * 0.7 + fres * 0.35 + scan * 0.1;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    }),
    []
  );

  const tiles = useMemo(() => {
    const arr: {
      x: number;
      z: number;
      rot: number;
      color: THREE.Color;
    }[] = [];
    const count = 5;
    const radius = 5.6;
    const arcSpan = Math.PI * 0.9;
    const palette = ["#00ff41", "#00e5ff", "#ff2bd6", "#00ff41", "#00e5ff"];
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1) - 0.5;
      const angle = t * arcSpan;
      const x = Math.sin(angle) * radius;
      const z = -Math.cos(angle) * radius + 2;
      arr.push({
        x,
        z,
        rot: -angle,
        color: new THREE.Color(palette[i]),
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    tileShader.uniforms.uTime.value = t;
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.2 + t * 0.04;
      groupRef.current.position.y = y + Math.sin(t * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[0, y, 0]}>
      {tiles.map((tile, i) => (
        <group key={i} position={[tile.x, 0, tile.z]} rotation={[0, tile.rot, 0]}>
          <mesh>
            <planeGeometry args={[2.6, 3.4]} />
            <shaderMaterial
              args={[tileShader]}
              transparent
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(2.6, 3.4)]} />
            <lineBasicMaterial
              color={tile.color}
              transparent
              opacity={0.9}
            />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}
