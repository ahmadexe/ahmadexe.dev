"use client";

import { MutableRefObject, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { morphOf, pulseOf } from "./useChapterProgress";

// A colossal ring-gate megastructure hanging over the horizon (~40 degrees of
// sky) — the scene's scale anchor. Sixty-four instanced monolith segments with
// window grids, packets of light orbiting the structure, a thin blazing rim,
// and a slowly swirling portal disc inside. It flares on every shape morph.
// Three draw calls, everything else is shader work.

const TAU = Math.PI * 2;

const SEG_VERT = /* glsl */ `
  attribute float aAng;

  varying vec3 vLocal;
  varying float vAng;

  void main() {
    vLocal = position;   // unit box, -0.5..0.5
    vAng = aAng;
    vec4 p = vec4(position, 1.0);
    #ifdef USE_INSTANCING
      p = instanceMatrix * p;
    #endif
    gl_Position = projectionMatrix * modelViewMatrix * p;
  }
`;

const SEG_FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uPulse;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying vec3 vLocal;
  varying float vAng;

  void main() {
    // Window grid in segment-local space.
    vec2 g = vLocal.xy * vec2(9.0, 12.0);
    vec2 grid = abs(fract(g - 0.5) - 0.5) / fwidth(g);
    float line = 1.0 - min(min(grid.x, grid.y), 1.0);
    if (line < 0.01) discard;

    // Two counter-orbiting packets of light race around the ring.
    float pk = smoothstep(0.2, 0.0, fract(vAng * 0.15915 - uTime * 0.05));
    pk += smoothstep(0.14, 0.0, fract(-vAng * 0.15915 - uTime * 0.037)) * 0.7;
    pk = clamp(pk, 0.0, 1.5);

    vec3 col = mix(uColorA, uColorB, clamp(pk, 0.0, 1.0));
    float a = line * (0.15 + pk * 0.7 + uPulse * 0.9);
    gl_FragColor = vec4(col, a);
  }
`;

const PORTAL_VERT = /* glsl */ `
  varying vec2 vP;
  uniform float uR;
  void main() {
    vP = position.xy / uR;   // -1..1 across the disc
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PORTAL_FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uPulse;
  uniform float uVelocity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying vec2 vP;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 x){
    vec2 i = floor(x);
    vec2 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
               mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
  }

  void main() {
    float r = length(vP);
    if (r > 1.0) discard;
    float ang = atan(vP.y, vP.x);

    // Spiral arms winding into the centre, textured with drifting noise.
    float sw = sin(ang * 3.0 - r * 7.0 + uTime * (0.32 + uVelocity * 0.9));
    sw = pow(clamp(sw * 0.5 + 0.5, 0.0, 1.0), 2.4);
    float n = vnoise(vP * 3.2 + uTime * 0.05);
    float val = sw * (0.35 + 0.65 * n);

    // Energy clings to the rim; the centre stays a dark window to the sky.
    float rimBias = 0.2 + 0.8 * smoothstep(0.15, 0.95, r);
    float edge = smoothstep(1.0, 0.92, r);

    vec3 col = mix(uColorB, uColorA, val);
    float a = val * rimBias * edge * (0.3 + uPulse * 0.75 + uVelocity * 0.25);
    gl_FragColor = vec4(col, a);
  }
`;

const SEG_COUNT = 64;

export function RingGate({
  progressRef,
  velocityRef,
  position = [-34, 10, -62] as [number, number, number],
  radius = 26,
}: {
  progressRef: MutableRefObject<number>;
  velocityRef?: MutableRefObject<number>;
  position?: [number, number, number];
  radius?: number;
}) {
  const segGeometry = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    // Per-instance angle, used by the orbiting light packets.
    const angles = new Float32Array(SEG_COUNT);
    for (let i = 0; i < SEG_COUNT; i++) angles[i] = (i / SEG_COUNT) * TAU;
    g.setAttribute("aAng", new THREE.InstancedBufferAttribute(angles, 1));
    return g;
  }, []);

  const segMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPulse: { value: 0 },
          uColorA: { value: new THREE.Color("#00ff41") },
          uColorB: { value: new THREE.Color("#00e5ff") },
        },
        vertexShader: SEG_VERT,
        fragmentShader: SEG_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    []
  );

  const segMesh = useMemo(() => {
    const m = new THREE.InstancedMesh(segGeometry, segMaterial, SEG_COUNT);
    const mat4 = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const posV = new THREE.Vector3();
    const sclV = new THREE.Vector3();
    const zAxis = new THREE.Vector3(0, 0, 1);
    for (let i = 0; i < SEG_COUNT; i++) {
      const a = (i / SEG_COUNT) * TAU;
      posV.set(Math.cos(a) * radius, Math.sin(a) * radius, 0);
      quat.setFromAxisAngle(zAxis, a);
      sclV.set(2.4, 3.2, 1.2); // tangential, radial, depth
      mat4.compose(posV, quat, sclV);
      m.setMatrixAt(i, mat4);
    }
    m.instanceMatrix.needsUpdate = true;
    m.frustumCulled = false;
    return m;
  }, [segGeometry, segMaterial, radius]);

  const rimGeometry = useMemo(
    () => new THREE.TorusGeometry(radius, 0.09, 8, 160),
    [radius]
  );
  const rimMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#00e5ff"),
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false, // the gate sits far past the fog's far plane
      }),
    []
  );

  const portalGeometry = useMemo(
    () => new THREE.CircleGeometry(radius * 0.92, 72),
    [radius]
  );
  const portalMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPulse: { value: 0 },
          uVelocity: { value: 0 },
          uR: { value: radius * 0.92 },
          uColorA: { value: new THREE.Color("#00ff41") },
          uColorB: { value: new THREE.Color("#00e5ff") },
        },
        vertexShader: PORTAL_VERT,
        fragmentShader: PORTAL_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [radius]
  );

  useEffect(
    () => () => {
      segGeometry.dispose();
      segMaterial.dispose();
      segMesh.dispose();
      rimGeometry.dispose();
      rimMaterial.dispose();
      portalGeometry.dispose();
      portalMaterial.dispose();
    },
    [
      segGeometry,
      segMaterial,
      segMesh,
      rimGeometry,
      rimMaterial,
      portalGeometry,
      portalMaterial,
    ]
  );

  const groupRef = useRef<THREE.Group>(null);
  const easedP = useRef(0);

  // Face the scene, then knock the ring off-axis so it reads as a structure
  // in space rather than a billboard.
  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.lookAt(0, 0, 0);
    g.rotateY(0.35);
    g.rotateX(-0.12);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const v = velocityRef?.current ?? 0;
    easedP.current += ((progressRef.current ?? 0) - easedP.current) * 0.08;
    const pulse = pulseOf(morphOf(easedP.current), v);

    segMaterial.uniforms.uTime.value = t;
    segMaterial.uniforms.uPulse.value = pulse;
    portalMaterial.uniforms.uTime.value = t;
    portalMaterial.uniforms.uPulse.value = pulse;
    const uv = portalMaterial.uniforms.uVelocity;
    uv.value += (v - uv.value) * 0.08;
    rimMaterial.opacity = 0.32 + pulse * 0.5;

    // The whole structure turns, slowly enough to feel enormous.
    segMesh.rotation.z = t * 0.02;
  });

  return (
    <group ref={groupRef} position={position}>
      <primitive object={segMesh} />
      <mesh
        geometry={rimGeometry}
        material={rimMaterial}
        frustumCulled={false}
      />
      <mesh
        geometry={portalGeometry}
        material={portalMaterial}
        frustumCulled={false}
      />
    </group>
  );
}
