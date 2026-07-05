"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const GLYPHS = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ".split("");

function makeGlyphTexture() {
  const size = 512;
  const rows = 8;
  const cols = 8;
  const cell = size / cols;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.clearRect(0, 0, size, size);
  ctx.font = `bold ${Math.floor(cell * 0.7)}px "JetBrains Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#00ff41";
  ctx.shadowColor = "#00ff41";
  ctx.shadowBlur = 8;
  for (let i = 0; i < rows * cols; i++) {
    const g = GLYPHS[i % GLYPHS.length];
    const x = (i % cols) * cell + cell / 2;
    const y = Math.floor(i / cols) * cell + cell / 2;
    ctx.fillText(g, x, y);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export function MatrixRain({
  count = 2400,
  spread = 60,
  depth = 30,
  velocityRef,
}: {
  count?: number;
  spread?: number;
  depth?: number;
  velocityRef?: React.MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dataRef = useRef<
    { x: number; y: number; z: number; speed: number; brightness: number }[]
  >([]);

  const texture = useMemo(() => makeGlyphTexture(), []);

  const geometry = useMemo(() => new THREE.PlaneGeometry(0.6, 0.6), []);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: new THREE.Color("#00ff41"),
      }),
    [texture]
  );

  useEffect(() => {
    const arr: typeof dataRef.current = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * spread * 2,
        y: (Math.random() - 0.5) * spread * 2,
        z: (Math.random() - 0.5) * depth,
        speed: 2 + Math.random() * 6,
        brightness: 0.2 + Math.random() * 0.8,
      });
    }
    dataRef.current = arr;
  }, [count, spread, depth]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const data = dataRef.current;
    const half = spread;
    const boost = 1 + (velocityRef?.current ?? 0) * 5;
    for (let i = 0; i < data.length; i++) {
      const p = data[i];
      p.y -= p.speed * dt * boost;
      if (p.y < -half) {
        p.y = half + Math.random() * 5;
        p.x = (Math.random() - 0.5) * spread * 2;
        p.speed = 2 + Math.random() * 6;
        p.brightness = 0.2 + Math.random() * 0.8;
      }
      dummy.position.set(p.x, p.y, p.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      const b = p.brightness;
      color.setRGB(0, b, b * 0.3);
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    >
      <instancedBufferAttribute
        attach="instanceColor"
        args={[new Float32Array(count * 3), 3]}
      />
    </instancedMesh>
  );
}
