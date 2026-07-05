"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor, Preload, Text } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { MutableRefObject, Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { MatrixRain } from "./MatrixRain";
import { ParticleField } from "./ParticleField";
import { HeroCore } from "./HeroCore";
import { TerminalMonolith } from "./vignettes/TerminalMonolith";
import { ProjectHoloArc } from "./vignettes/ProjectHoloArc";
import { AwardConstellation } from "./vignettes/AwardConstellation";
import { PaperSwarm } from "./vignettes/PaperSwarm";
import {
  WAYPOINTS,
  pickSegment,
  useProgressRef,
  useVelocityRef,
} from "./useChapterProgress";

/**
 * Camera choreography: waypoint-lerped position/lookAt driven by Lenis progress.
 * A cinematic intro dolly (camera pulls in from z=40 → waypoint over ~1.6s)
 * lands the first frame; pointer parallax and velocity-driven z-roll add life.
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
  const introRef = useRef(1); // 1 → 0 over the intro window
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

    // Cinematic intro: ease introRef → 0, pull camera back from far z.
    if (introRef.current > 0.001) {
      introRef.current = Math.max(0, introRef.current - dt * 0.65);
      const e = introRef.current;
      // easeOutCubic
      const eased = 1 - Math.pow(1 - e, 3);
      tmpPos.z += eased * 32;
      tmpPos.y += eased * 4;
    }

    // Subtle pointer parallax
    posParallax.x += (state.pointer.x * 0.6 - posParallax.x) * 0.05;
    posParallax.y += (state.pointer.y * 0.4 - posParallax.y) * 0.05;
    tmpPos.x += posParallax.x;
    tmpPos.y += posParallax.y;

    camera.position.lerp(tmpPos, 0.12);
    lookTarget.lerp(tmpLook, 0.12);
    camera.lookAt(lookTarget);

    // Velocity-driven dutch-angle roll for cinematography
    const v = velocityRef.current;
    const signed = (state.pointer.x >= 0 ? 1 : -1) * v * 0.08;
    rollRef.current += (signed - rollRef.current) * 0.08;
    camera.rotation.z = rollRef.current;
  });
  return null;
}

/**
 * MatrixRain + ParticleField follow the camera down so they blanket every chapter.
 */
function AmbientFollow({
  velocityRef,
}: {
  velocityRef: MutableRefObject<number>;
}) {
  const rainRef = useRef<THREE.Group>(null);
  const partsRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (rainRef.current) {
      rainRef.current.position.y +=
        (camera.position.y - rainRef.current.position.y) * 0.1;
    }
    if (partsRef.current) {
      partsRef.current.position.y +=
        (camera.position.y - partsRef.current.position.y) * 0.1;
    }
  });

  return (
    <>
      <group ref={rainRef}>
        <MatrixRain count={700} spread={45} depth={25} velocityRef={velocityRef} />
      </group>
      <group ref={partsRef}>
        <ParticleField count={400} radius={35} />
      </group>
    </>
  );
}

/**
 * Fog color/near/far lerp per chapter for cinematic mood swings.
 */
const FOG_STOPS: {
  p: number;
  color: THREE.Color;
  near: number;
  far: number;
}[] = [
  { p: 0.0, color: new THREE.Color("#000000"), near: 18, far: 55 },
  { p: 0.18, color: new THREE.Color("#02110a"), near: 14, far: 46 },
  { p: 0.42, color: new THREE.Color("#010618"), near: 12, far: 44 },
  { p: 0.7, color: new THREE.Color("#000f1a"), near: 16, far: 52 },
  { p: 1.0, color: new THREE.Color("#020210"), near: 18, far: 60 },
];

function FogRig({
  progressRef,
}: {
  progressRef: MutableRefObject<number>;
}) {
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
 * Frustum-cull vignettes by camera Y distance to keep draw calls minimal.
 */
function ChapterGate({
  y,
  children,
}: {
  y: number;
  children: React.ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.visible = Math.abs(camera.position.y - y) < 26;
  });

  return <group ref={groupRef}>{children}</group>;
}

/**
 * Giant floating chapter title behind each chapter. Uses drei <Text>
 * (SDF, cheap). Rotates slowly, fades in/out based on camera Y proximity,
 * and pulses on scroll velocity so aggressive scrolls warp the type.
 */
function ChapterTitle({
  y,
  text,
  color = "#00ff41",
  velocityRef,
}: {
  y: number;
  text: string;
  color?: string;
  velocityRef: MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const textRef = useRef<any>(null);
  const { camera } = useThree();

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const dy = camera.position.y - y;
    const dist = Math.abs(dy);
    g.visible = dist < 24;
    const targetOpacity = Math.max(0, 1 - dist / 14) * 0.16;
    if (textRef.current) {
      const cur = textRef.current.fillOpacity ?? 0;
      textRef.current.fillOpacity = cur + (targetOpacity - cur) * 0.1;
      const oc = textRef.current.outlineOpacity ?? 0;
      textRef.current.outlineOpacity = oc + (targetOpacity * 1.5 - oc) * 0.1;
    }
    const v = velocityRef.current;
    g.rotation.y =
      Math.sin(state.clock.elapsedTime * 0.15) * 0.08 + v * 0.4;
    g.position.y = y + dy * 0.15 - v * 1.4;
    g.scale.setScalar(1 + v * 0.15);
  });

  return (
    <group ref={groupRef} position={[0, y, -14]}>
      <Text
        ref={textRef}
        fontSize={5}
        color={color}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.06}
        outlineWidth={0.03}
        outlineColor={color}
        fillOpacity={0}
        outlineOpacity={0}
      >
        {text}
      </Text>
    </group>
  );
}

// Mutated in place each frame by CAWarp so the postprocessing uniform picks up
// the new values without recreating the effect chain.
const CA_OFFSET = new THREE.Vector2(0.0007, 0.0009);

function CAWarp({ velocityRef }: { velocityRef: MutableRefObject<number> }) {
  useFrame(() => {
    const v = velocityRef.current;
    CA_OFFSET.set(0.0007 + v * 0.006, 0.0009 + v * 0.004);
  });
  return null;
}

/**
 * PostFX — Bloom + velocity-warped chromatic aberration + vignette.
 */
function PostFX({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <EffectComposer>
      <Bloom
        intensity={0.9}
        luminanceThreshold={0.22}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <ChromaticAberration
        offset={CA_OFFSET}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={false}
        modulationOffset={0.15}
      />
      <Vignette eskil={false} offset={0.28} darkness={0.7} />
    </EffectComposer>
  );
}

export function BackgroundScene() {
  const progressRef = useProgressRef();
  const velocityRef = useVelocityRef();
  const [dpr, setDpr] = useState<number>(1.35);
  const [fx, setFx] = useState(true);

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
        <fog attach="fog" args={["#000000", 18, 55]} />
        <PerformanceMonitor
          onDecline={() => {
            setDpr(1);
            setFx(false);
          }}
          onIncline={() => {
            setDpr(1.35);
            setFx(true);
          }}
        />
        <Suspense fallback={null}>
          <CameraRig progressRef={progressRef} velocityRef={velocityRef} />
          <FogRig progressRef={progressRef} />

          <ambientLight intensity={0.4} />
          <pointLight position={[5, 5, 5]} intensity={1.2} color="#00ff41" />
          <pointLight position={[-5, -5, 3]} intensity={0.8} color="#00e5ff" />

          <AmbientFollow velocityRef={velocityRef} />

          {/* Giant floating chapter titles — one per waypoint */}
          <ChapterTitle y={0} text="HELLO_WORLD" velocityRef={velocityRef} />
          <ChapterTitle
            y={-14}
            text="./TERMINAL"
            color="#00ff41"
            velocityRef={velocityRef}
          />
          <ChapterTitle
            y={-34}
            text="PROJECTS.DIR"
            color="#00e5ff"
            velocityRef={velocityRef}
          />
          <ChapterTitle
            y={-58}
            text="AWARDS//"
            color="#ffb454"
            velocityRef={velocityRef}
          />
          <ChapterTitle
            y={-80}
            text="ARTICLES.LOG"
            color="#7a3fbf"
            velocityRef={velocityRef}
          />

          {/* Hero chapter — reused HeroCore, positioned at world origin */}
          <ChapterGate y={0}>
            <HeroCore progressRef={progressRef} />
          </ChapterGate>

          {/* Terminal chapter */}
          <ChapterGate y={-14}>
            <TerminalMonolith y={-14} />
          </ChapterGate>

          {/* Projects chapter */}
          <ChapterGate y={-34}>
            <ProjectHoloArc y={-34} />
          </ChapterGate>

          {/* Awards chapter */}
          <ChapterGate y={-58}>
            <AwardConstellation y={-58} />
          </ChapterGate>

          {/* Articles/Footer chapter */}
          <ChapterGate y={-80}>
            <PaperSwarm y={-80} />
          </ChapterGate>

          <CAWarp velocityRef={velocityRef} />
          <PostFX enabled={fx} />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
