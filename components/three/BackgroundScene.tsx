"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor, Preload } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  ASCII,
  Glitch,
} from "@react-three/postprocessing";
import { BlendFunction, GlitchMode } from "postprocessing";
import {
  MutableRefObject,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { MatrixRain } from "./MatrixRain";
import { ParticleField } from "./ParticleField";
import { MorphParticles } from "./MorphParticles";
import { WireframeTerrain } from "./WireframeTerrain";
import { OrbitalRings } from "./OrbitalRings";
import {
  WAYPOINTS,
  pickSegment,
  useProgressRef,
  useVelocityRef,
} from "./useChapterProgress";
import { useIsMobile } from "@/lib/useIsMobile";
import { useFx } from "@/components/site/fxStore";

/**
 * Camera choreography: waypoint-lerped position, always aimed at the origin so
 * the morphing cloud stays framed while the camera orbits it. A cinematic intro
 * dolly lands the first frame; pointer parallax and velocity roll add life.
 */
function CameraRig({
  progressRef,
  velocityRef,
}: {
  progressRef: MutableRefObject<number>;
  velocityRef: MutableRefObject<number>;
}) {
  const { camera } = useThree();
  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const tmpLook = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const posParallax = useMemo(() => new THREE.Vector2(0, 0), []);
  const introRef = useRef(1);
  const rollRef = useRef(0);

  useFrame((state, dt) => {
    const t = progressRef.current;
    const [a, b, k] = pickSegment(t);
    tmpPos.set(
      a.pos[0] + (b.pos[0] - a.pos[0]) * k,
      a.pos[1] + (b.pos[1] - a.pos[1]) * k,
      a.pos[2] + (b.pos[2] - a.pos[2]) * k
    );
    tmpLook.set(
      a.look[0] + (b.look[0] - a.look[0]) * k,
      a.look[1] + (b.look[1] - a.look[1]) * k,
      a.look[2] + (b.look[2] - a.look[2]) * k
    );

    // FOV breathes with the move — tight on the fly-by, wide on the finale.
    const cam = camera as THREE.PerspectiveCamera;
    const fovTarget = a.fov + (b.fov - a.fov) * k;
    if (Math.abs(cam.fov - fovTarget) > 0.01) {
      cam.fov += (fovTarget - cam.fov) * 0.08;
      cam.updateProjectionMatrix();
    }

    if (introRef.current > 0.001) {
      introRef.current = Math.max(0, introRef.current - dt * 0.6);
      const eased = 1 - Math.pow(1 - introRef.current, 3);
      tmpPos.z += eased * 34;
      tmpPos.y += eased * 3;
    }

    posParallax.x += (state.pointer.x * 0.7 - posParallax.x) * 0.05;
    posParallax.y += (state.pointer.y * 0.45 - posParallax.y) * 0.05;
    tmpPos.x += posParallax.x;
    tmpPos.y += posParallax.y;

    camera.position.lerp(tmpPos, 0.12);
    lookTarget.lerp(tmpLook, 0.12);
    camera.lookAt(lookTarget);

    const v = velocityRef.current;
    const signed = (state.pointer.x >= 0 ? 1 : -1) * v * 0.08;
    rollRef.current += (signed - rollRef.current) * 0.08;
    camera.rotation.z = rollRef.current;
  });
  return null;
}

/**
 * Fog color/near/far lerp per chapter for cinematic mood swings around the
 * subject (subject sits inside the near plane, so fog only tints the ambient
 * rain/stars behind it).
 */
const FOG_STOPS: {
  p: number;
  color: THREE.Color;
  near: number;
  far: number;
}[] = [
  { p: 0.0, color: new THREE.Color("#000000"), near: 10, far: 34 },
  { p: 0.25, color: new THREE.Color("#02120a"), near: 9, far: 30 },
  { p: 0.5, color: new THREE.Color("#031018"), near: 9, far: 32 },
  { p: 0.75, color: new THREE.Color("#0a0a04"), near: 10, far: 34 },
  { p: 1.0, color: new THREE.Color("#050210"), near: 12, far: 44 },
];

function FogRig({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const { scene } = useThree();
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const fog = scene.fog as THREE.Fog | null;
    if (!fog) return;
    const t = progressRef.current;
    let a = FOG_STOPS[0];
    let b = FOG_STOPS[FOG_STOPS.length - 1];
    for (let i = 0; i < FOG_STOPS.length - 1; i++) {
      if (t >= FOG_STOPS[i].p && t <= FOG_STOPS[i + 1].p) {
        a = FOG_STOPS[i];
        b = FOG_STOPS[i + 1];
        break;
      }
    }
    const k = Math.min(1, Math.max(0, (t - a.p) / (b.p - a.p || 1)));
    tmp.copy(a.color).lerp(b.color, k);
    fog.color.lerp(tmp, 0.08);
    fog.near += (a.near + (b.near - a.near) * k - fog.near) * 0.08;
    fog.far += (a.far + (b.far - a.far) * k - fog.far) * 0.08;
  });

  return null;
}

/**
 * Scene-wide wireframe toggle driven by the shell's `wireframe` command.
 */
function WireframeRig() {
  const { wireframe } = useFx();
  const { scene } = useThree();

  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const m of mats) {
        if (!m || !("wireframe" in m)) continue;
        const mat = m as THREE.MeshBasicMaterial;
        if (wireframe) {
          if (mat.userData.__origWire === undefined) {
            mat.userData.__origWire = mat.wireframe;
          }
          mat.wireframe = true;
        } else if (mat.userData.__origWire !== undefined) {
          mat.wireframe = mat.userData.__origWire;
          delete mat.userData.__origWire;
        }
      }
    });
  }, [wireframe, scene]);

  return null;
}

const CA_OFFSET = new THREE.Vector2(0.0007, 0.0009);

function CAWarp({ velocityRef }: { velocityRef: MutableRefObject<number> }) {
  useFrame(() => {
    const v = velocityRef.current;
    CA_OFFSET.set(0.0007 + v * 0.006, 0.0009 + v * 0.004);
  });
  return null;
}

/**
 * PostFX — Bloom + velocity-warped chromatic aberration + vignette, plus the
 * shell-controlled ASCII render mode and Glitch bursts on every command.
 */
function PostFX({ enabled }: { enabled: boolean }) {
  const { ascii } = useFx();
  const [glitching, setGlitching] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => {
    const burst = (ms: number) => {
      setGlitching(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setGlitching(false), ms);
    };
    const onGlitch = (e: Event) =>
      burst(((e as CustomEvent).detail?.ms as number) ?? 300);
    const onActivity = () => burst(240);
    window.addEventListener("termolio:glitch", onGlitch);
    window.addEventListener("termolio:activity", onActivity);
    return () => {
      window.removeEventListener("termolio:glitch", onGlitch);
      window.removeEventListener("termolio:activity", onActivity);
      window.clearTimeout(timer.current);
    };
  }, []);

  // The whole effect chain used to be gated behind `enabled`, so any perf dip
  // silently killed ASCII/Glitch/CA along with Bloom. Those three are cheap
  // full-screen passes and must always work (ASCII is a headline feature);
  // only the expensive mipmap Bloom responds to the performance flag.
  const effects = [
    ...(enabled
      ? [
          <Bloom
            key="bloom"
            intensity={0.55}
            luminanceThreshold={0.5}
            luminanceSmoothing={0.85}
            mipmapBlur
          />,
        ]
      : []),
    <ChromaticAberration
      key="ca"
      offset={CA_OFFSET}
      blendFunction={BlendFunction.NORMAL}
      radialModulation={false}
      modulationOffset={0.15}
    />,
    ...(ascii
      ? [
          <ASCII
            key="ascii"
            fontSize={54}
            cellSize={10}
            characters=" .:-=+*#%@"
            color="#00ff41"
          />,
        ]
      : []),
    <Glitch
      key="glitch"
      active={glitching}
      mode={GlitchMode.CONSTANT_WILD}
      strength={new THREE.Vector2(0.15, 0.35)}
      ratio={0.85}
    />,
    <Vignette key="vignette" eskil={false} offset={0.2} darkness={0.85} />,
  ];

  // Key on the flags that change the pass count so the composer rebuilds its
  // chain cleanly instead of trying to diff effect children.
  return (
    <EffectComposer key={`${enabled ? "b" : ""}${ascii ? "a" : ""}`}>
      {effects}
    </EffectComposer>
  );
}

/**
 * Pared-down scene for phones: static camera, the same morphing protagonist at
 * a lower particle count, and lighter ambient rain/stars.
 */
function MobileScene({
  progressRef,
  velocityRef,
}: {
  progressRef: MutableRefObject<number>;
  velocityRef: MutableRefObject<number>;
}) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        frameloop="always"
      >
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 12, 40]} />
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <MatrixRain count={200} spread={26} depth={16} />
          <ParticleField count={120} radius={20} />
          <MorphParticles
            count={22000}
            size={3.0}
            progressRef={progressRef}
            velocityRef={velocityRef}
          />
          <EffectComposer>
            <Bloom
              intensity={0.6}
              luminanceThreshold={0.3}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
            <Vignette eskil={false} offset={0.2} darkness={0.85} />
          </EffectComposer>
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Native display DPR, capped at 2. Rendering the WebGL buffer below the
// display's pixel ratio (e.g. 1.35 on a Retina 2x panel) makes the browser
// upscale it — smearing every crisp particle. On Retina we must render at 2.
const MAX_DPR =
  typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1.5;

export function BackgroundScene() {
  const progressRef = useProgressRef();
  const velocityRef = useVelocityRef();
  const [dpr, setDpr] = useState<number>(MAX_DPR);
  const [fx, setFx] = useState(true);
  const isMobile = useIsMobile();

  if (isMobile === null) return null;
  if (isMobile)
    return (
      <MobileScene progressRef={progressRef} velocityRef={velocityRef} />
    );

  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        camera={{ position: WAYPOINTS[0].pos, fov: 50 }}
        dpr={dpr}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        frameloop="always"
      >
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 10, 34]} />
        <PerformanceMonitor
          onDecline={() => {
            // Never drop below 1.5 — half-res on a Retina panel looks worse
            // than a few dropped frames. Shed the expensive Bloom instead.
            setDpr(Math.max(1.5, MAX_DPR - 0.5));
            setFx(false);
          }}
          onIncline={() => {
            setDpr(MAX_DPR);
            setFx(true);
          }}
        />
        <Suspense fallback={null}>
          <CameraRig progressRef={progressRef} velocityRef={velocityRef} />
          <FogRig progressRef={progressRef} />

          <ambientLight intensity={0.3} />
          <pointLight position={[5, 5, 5]} intensity={0.8} color="#00ff41" />
          <pointLight position={[-5, -5, 3]} intensity={0.5} color="#00e5ff" />

          {/* Ambient world — rain + stars around the subject, no camera follow
              now that everything lives at the origin. */}
          <MatrixRain
            count={600}
            spread={40}
            depth={24}
            velocityRef={velocityRef}
          />
          <ParticleField count={360} radius={32} />

          {/* The set — wire terrain below, gyroscopic rings around the
              subject. The fly-by waypoint passes inside the outer rings, so
              scrolling produces true near-field parallax. */}
          <WireframeTerrain velocityRef={velocityRef} />
          <OrbitalRings velocityRef={velocityRef} />

          {/* The protagonist. */}
          <MorphParticles
            count={34000}
            progressRef={progressRef}
            velocityRef={velocityRef}
          />

          <WireframeRig />
          <CAWarp velocityRef={velocityRef} />
          <PostFX enabled={fx} />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
