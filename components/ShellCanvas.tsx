"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { THREE, createRenderer } from "@/lib/webgpu";
import { useQuality } from "@/lib/quality";
import { useTheme } from "@/lib/useTheme";
import { getScrollY } from "@/lib/scroll";
import { usePointerBus, getPointer } from "@/lib/pointer";
import { stage } from "@/lib/zoom";
import WordText from "./WordText";
import FluidBackground from "./FluidBackground";
import WorkLayers from "./WorkLayers";
import Effects from "./Effects";

const WORD_Y = 0.45;
const BLUE = new THREE.Color("#2f7ef0");
const EMBER = new THREE.Color("#050505");

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a), 0, 1);

/**
 * The key light, constrained to a circle around the wordmark.
 *
 * Its angle follows the pointer, but never its distance — so the highlight
 * travels the rim instead of drifting onto the face of the glass and flattening
 * the silhouette. Angles are damped along the shortest arc, or crossing ±π
 * would send the highlight the long way round.
 */
function RimLight() {
  const light = useRef<THREE.DirectionalLight>(null);
  const radius = Math.hypot(4, 9);
  const restAngle = Math.atan2(9, 4);
  const angle = useRef(restAngle);

  useFrame((_, delta) => {
    const p = getPointer();
    const target = p.inside ? Math.atan2(p.uv.y * 2 - 1, p.uv.x * 2 - 1) : restAngle;
    const shortest = Math.atan2(Math.sin(target - angle.current), Math.cos(target - angle.current));
    angle.current += shortest * (1 - Math.exp(-6 * delta));
    const l = light.current;
    if (l) l.position.set(radius * Math.cos(angle.current), radius * Math.sin(angle.current), 3);
  });

  return <directionalLight ref={light} position={[4, 9, 3]} intensity={2.6} />;
}

function Lighting({ dark }: { dark: boolean }) {
  return (
    <>
      {/* Bright studio-ish environment: a big soft key, a narrow strip that
          reads as a long specular streak, and coloured rim lights. */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={[dark ? "#131922" : "#f6faff"]} />
        <Lightformer intensity={4.5} position={[0, 7, -9]} scale={[16, 16, 1]} color="#ffffff" />
        <Lightformer intensity={6} position={[-1, 3, -5]} scale={[1.1, 12, 1]} color="#ffffff" />
        <Lightformer intensity={3} position={[-8, 2, -2]} scale={[10, 10, 1]} color="#7faaff" />
        <Lightformer intensity={2.4} position={[8, -1, -2]} scale={[10, 10, 1]} color="#ffd0a0" />
        <Lightformer intensity={3} position={[0, -7, 5]} scale={[14, 14, 1]} color="#ffffff" />
      </Environment>
      <ambientLight intensity={dark ? 0.35 : 0.55} />
      <RimLight />
      <directionalLight position={[-6, 4, -6]} intensity={dark ? 1.2 : 1.6} color="#a9c8ff" />
    </>
  );
}

/**
 * Moves the camera, rather than transforming the page.
 *
 * This is how the reference achieves what reads as the whole page bending: the
 * camera dollies back as you scroll while the content stays anchored, so the
 * scene recedes and the frame opens up. It is not a CSS or shader transform —
 * which also means it carries none of the pinned-section risk that a page-wide
 * transform would.
 *
 * Values are adapted to our scene scale, not copied: the reference's Z 24 → 32
 * and FOV 60 are for a model at scale 22, and our wordmark sits around z = 1 at a
 * camera distance of 5. The *shape* is what transfers — a dolly over roughly the
 * first viewport and a quarter, with the pointer adding a small rotational
 * parallax — so the ratios are tuned here rather than lifted.
 */
function CameraRig({ scroll }: { scroll: React.RefObject<number> }) {
  const { camera, pointer } = useThree();
  const restZ = useRef(5);
  const aim = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    const k = Math.min(1, delta * 3);
    const y = scroll.current ?? 0;
    const vh = Math.max(window.innerHeight, 1);

    // 0 at the top, 1 once the hero has scrolled away.
    const t = Math.min(Math.max(y / (vh * 1.25), 0), 1);
    const eased = t * t * (3 - 2 * t);

    // Dolly back. Small numbers, because our scene is compact — a large move
    // would push the wordmark out of frame entirely rather than just opening it.
    const targetZ = restZ.current + eased * 2.4;
    camera.position.z += (targetZ - camera.position.z) * k;

    // Pointer parallax. The reference uses strength 1.4 / lag 0.18 / rotation
    // 0.12; ours works out smaller because our camera is far closer to the
    // subject, so the same rotation would swing much further on screen.
    aim.current.x += (pointer.x * 0.16 - aim.current.x) * k;
    aim.current.y += (pointer.y * 0.1 - aim.current.y) * k;
    camera.lookAt(aim.current.x, aim.current.y, 0);
  });

  return null;
}

/**
 * Keeps the wordmark centred in the hero as you scroll.
 *
 * Deliberately the simple version: the name sits at a fixed world Y and travels
 * one viewport-height per viewport scrolled, so it is on screen at load whatever
 * the window size. A world-unit section-anchor was tried here and is what made
 * the name vanish on shorter screens — the hero is taller than the viewport, so
 * anchoring to its centre pushed the name below the fold.
 */
function WordDriver({
  dark,
  glass,
  scroll
}: {
  dark: boolean;
  glass: boolean;
  scroll: React.RefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const sc = scroll.current ?? 0;
    const vh = Math.max(window.innerHeight, 1);
    g.position.y = WORD_Y + (sc / vh) * viewport.height;
    g.visible = sc < vh * 1.1;
  });

  return (
    <group ref={group}>
      <WordText dark={dark} y={0} glass={glass} />
    </group>
  );
}

function makeRoundedTriangle(radius: number, round: number) {
  const sides = 3;
  const shape = new THREE.Shape();
  const pts = Array.from({ length: sides }, (_, i) => {
    const a = (i / sides) * Math.PI * 2 + Math.PI / 2;
    return new THREE.Vector2(Math.cos(a) * radius, Math.sin(a) * radius);
  });

  for (let i = 0; i < sides; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % sides];
    const p2 = pts[(i + 2) % sides];
    const start = p0.clone().lerp(p1, round);
    const end = p1.clone().lerp(p2, round);
    if (i === 0) shape.moveTo(start.x, start.y);
    else shape.lineTo(start.x, start.y);
    shape.quadraticCurveTo(p1.x, p1.y, end.x, end.y);
  }
  shape.closePath();
  return shape;
}

/**
 * The floating 3D pointer.
 * Lifecycle: rests bottom-right of the hero → slides off right as the hero
 * leaves → is hidden for the rest of the page → re-enters from the right during
 * the pinned transition → scales up until it masks the viewport.
 */
function PointerObject() {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  // Scale is tracked here rather than read back off the mesh: reading
  // mesh.scale.x (already multiplied by the non-uniform ratio) fed the result
  // back into the lerp and made the pointer jitter.
  const scale = useRef(1);
  const { viewport } = useThree();

  const geometry = useMemo(() => {
    const shape = makeRoundedTriangle(0.5, 0.34);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.34,
      bevelEnabled: true,
      bevelThickness: 0.09,
      bevelSize: 0.09,
      bevelSegments: 8,
      curveSegments: 24
    }).center();
  }, []);

  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    const k = Math.min(1, delta * 6);

    const heroExit = clamp(stage.heroExit, 0, 1);
    const warp = clamp(stage.warp, 0, 1);

    const restX = viewport.width / 2 - 1.35;
    const restY = -viewport.height / 2 + 1.25;

    let tx: number;
    let ty: number;
    let ts: number;
    let visible = true;

    if (stage.transitionVisible) {
      // On screen from the moment the section enters (warp is still 0), so the
      // frame is never empty; then it travels in and scales up to mask the view.
      const travel = seg(warp, 0, 0.22);
      const grow = seg(warp, 0.12, 0.34);

      // Anchored by distance from the right edge so the object is always fully
      // in frame at warp 0, whatever the viewport width.
      const startX = viewport.width / 2 - 1.0;
      tx = THREE.MathUtils.lerp(startX, 0, travel * travel * (3 - 2 * travel));
      ty = 0;
      ts = THREE.MathUtils.lerp(1, 17, Math.pow(grow, 1.5));
      visible = warp < 0.9;
    } else {
      tx = restX + heroExit * viewport.width * 1.3;
      ty = restY + Math.sin(t * 1.1) * 0.05;
      ts = 1 - heroExit * 0.82;
      visible = heroExit < 0.98;
    }

    m.visible = visible;
    m.position.x += (tx - m.position.x) * k;
    m.position.y += (ty - m.position.y) * k;
    m.position.z = 1.1;

    scale.current += (ts - scale.current) * k;
    m.scale.set(scale.current * 0.82, scale.current * 1.18, scale.current);

    const spin = warp > 0.001 ? 0 : -0.4 + Math.sin(t * 0.8) * 0.09;
    m.rotation.z += (spin - m.rotation.z) * k;
    m.rotation.x += ((warp > 0.001 ? 0 : Math.sin(t * 0.6) * 0.12) - m.rotation.x) * k;

    // darkens into the tunnel so the mask hands over to the dark background
    if (mat.current) {
      const dk = seg(warp, 0.16, 0.34);
      mat.current.color.copy(BLUE).lerp(EMBER, dk);
    }
  });

  return (
    <mesh ref={mesh} geometry={geometry}>
      <meshPhysicalMaterial
        ref={mat}
        color="#2f7ef0"
        roughness={0.16}
        metalness={0.08}
        clearcoat={1}
        clearcoatRoughness={0.12}
        envMapIntensity={1.3}
      />
    </mesh>
  );
}

/** Writes the live scroll position into a ref each frame (no React re-render). */
function ScrollBridge({ scroll }: { scroll: React.RefObject<number> }) {
  useFrame(() => {
    // getScrollY(), not window.scrollY — see lib/scroll.ts. Reading the raw
    // window value means the shell renders against a scroll position one frame
    // stale, which is what makes canvas content drift from the DOM on fast
    // scrolls.
    scroll.current = getScrollY();
  });
  return null;
}

export default function ShellCanvas() {
  const quality = useQuality();
  const { mode } = useTheme();
  const scroll = useRef(0);
  const dark = mode === "dark";
  usePointerBus();
  // Transmission costs an extra full-scene pass per frame — only enable it on
  // machines that can take it.
  const glass = quality.fx;

  // Post-processing: bloom, depth of field, lens dispersion and grain.
  // Effects stays fail-safe — if the pipeline cannot be built it falls back to a
  // plain render rather than leaving a black canvas.
  const POST_PROCESSING = true;
  const effectTier: "full" | "light" | "off" = !POST_PROCESSING || quality.reduced
    ? "off"
    : quality.fx
      ? "full"
      : "light";

  return (
    // The shell renders continuously. It used to pause via `frameloop="never"`
    // when it judged nothing was on screen, but that gate was fragile — when the
    // predicate was wrong the whole canvas (name included) silently vanished.
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <Canvas
        frameloop="always"
        dpr={quality.dpr}
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={createRenderer}
      >
        <ScrollBridge scroll={scroll} />
        <FluidBackground />
        <CameraRig scroll={scroll} />
        <Lighting dark={dark} />
        <Suspense fallback={null}>
          <WordDriver dark={dark} glass={glass} scroll={scroll} />
          <WorkLayers />
        </Suspense>
        <PointerObject />
        <Effects tier={effectTier} />
      </Canvas>
    </div>
  );
}
