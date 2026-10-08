"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { THREE, createRenderer } from "@/lib/webgpu";
import {
  attribute,
  cos,
  exp,
  float,
  length,
  pointUV,
  positionLocal,
  sin,
  smoothstep,
  uniform,
  vec2,
  vec4,
  vec3
} from "three/tsl";
import { useQuality } from "@/lib/quality";
import { useTheme } from "@/lib/useTheme";
import { stage } from "@/lib/zoom";
import WordText from "./WordText";
import Effects from "./Effects";

const WORD_Y = 0.45;
const BLUE = new THREE.Color("#2f7ef0");
const EMBER = new THREE.Color("#050505");

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a), 0, 1);

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
      <directionalLight position={[6, 9, 4]} intensity={dark ? 2.0 : 2.6} />
      <directionalLight position={[-6, 4, -6]} intensity={dark ? 1.2 : 1.6} color="#a9c8ff" />
    </>
  );
}

/** Keeps the wordmark anchored to the hero as the document scrolls. */
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
    g.position.y = WORD_Y + (sc / Math.max(window.innerHeight, 1)) * viewport.height;
    g.visible = sc < window.innerHeight * 1.1;
  });

  return (
    <group ref={group}>
      <WordText dark={dark} y={0} glass={glass} />
    </group>
  );
}

/**
 * Fine grains drifting through the hero, brushed aside by the cursor.
 *
 * Written in TSL rather than GLSL. A raw ShaderMaterial would compile on the
 * WebGL2 fallback backend and silently render nothing under WebGPU; TSL is
 * authored once and compiles to WGSL or GLSL depending on the active backend.
 */
function ParticleField({
  count,
  dark,
  active
}: {
  count: number;
  dark: boolean;
  active: boolean;
}) {
  const { pointer } = useThree();

  const { positions, randoms } = useMemo(() => {
    const n = Math.max(4000, Math.min(count, 60000));
    const pos = new Float32Array(n * 3);
    const rnd = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = Math.random() * 2 - 1;
      pos[i * 3 + 1] = Math.random() * 2 - 1;
      pos[i * 3 + 2] = Math.random() * 2 - 1;
      rnd[i * 3] = Math.random();
      rnd[i * 3 + 1] = Math.random();
      rnd[i * 3 + 2] = Math.random();
    }
    return { positions: pos, randoms: rnd };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: uniform(0),
      uSize: uniform(1.4),
      uDpr: uniform(typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio, 1.5)),
      uMouse: uniform(new THREE.Vector2(0, 0)),
      uColor: uniform(new THREE.Color("#5b7fb8"))
    }),
    []
  );

  const material = useMemo(() => {
    const { uTime, uSize, uDpr, uMouse, uColor } = uniforms;
    const aRandom = attribute("aRandom", "vec3");

    const amp = aRandom.x.mul(0.1).add(0.05);
    const flow = vec3(
      sin(positionLocal.y.mul(1.6).add(uTime.mul(0.3)).add(aRandom.x.mul(6.2831))),
      cos(positionLocal.x.mul(1.4).sub(uTime.mul(0.26)).add(aRandom.y.mul(6.2831))),
      float(0)
    );

    const x = positionLocal.x.add(flow.x.mul(amp));
    // Wraps through [-1, 1] so the field never runs out of grains.
    const y = positionLocal.y
      .add(flow.y.mul(amp))
      .add(uTime.mul(aRandom.y.mul(0.012).add(0.006)))
      .add(1)
      .mod(2)
      .sub(1);

    // Shove grains away from the cursor, then let them drift back.
    const d = vec2(x, y).sub(uMouse);
    const push = exp(d.length().mul(-5)).mul(0.14);
    const off = d.mul(push).div(d.length().add(1e-4));

    // pointUV is the point-sprite coordinate (gl_PointCoord). @types/three
    // declares it as a bare `Node`, so the vector operators are missing from the
    // type even though the runtime value is a vec2 node — hence the narrow cast
    // through the typed vec2 surface.
    const centred = (pointUV as unknown as ReturnType<typeof vec2>).sub(0.5);
    const sprite = length(centred);
    const falloff = smoothstep(float(0.5), float(0.05), sprite);
    const alpha = falloff.mul(aRandom.x.mul(0.38).add(0.08));

    const m = new THREE.PointsNodeMaterial();
    m.positionNode = vec3(x.add(off.x), y.add(off.y), positionLocal.z);
    m.sizeNode = uSize.mul(uDpr).mul(aRandom.z.mul(0.9).add(0.35));
    m.colorNode = vec4(uColor, 1);
    m.opacityNode = alpha;
    m.transparent = true;
    m.depthTest = false;
    m.depthWrite = false;
    m.blending = THREE.AdditiveBlending;
    return m;
  }, [uniforms]);

  useEffect(() => {
    uniforms.uColor.value.set(dark ? "#8fb4ff" : "#5b7fb8");
  }, [dark, uniforms]);

  useFrame((state, delta) => {
    if (!active) return;
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uMouse.value.lerp(pointer, 1 - Math.pow(0.002, delta));
  });

  return (
    <points frustumCulled={false} renderOrder={-1} material={material}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aRandom" args={[randoms, 3]} />
      </bufferGeometry>
    </points>
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
    scroll.current = window.scrollY;
  });
  return null;
}

export default function ShellCanvas() {
  const quality = useQuality();
  const { mode } = useTheme();
  const scroll = useRef(0);
  const dark = mode === "dark";
  // Transmission costs an extra full-scene pass per frame — only enable it on
  // machines that can take it.
  const glass = quality.fx;

  // Nothing here is visible once the hero has scrolled away and the transition
  // is idle, so stop rendering entirely rather than burning a frame every 16ms.
  const [active, setActive] = useState(true);
  useEffect(() => {
    const evaluate = () => {
      const nearTop = window.scrollY < window.innerHeight * 1.35;
      const next = nearTop || stage.warping;
      setActive((prev) => (prev === next ? prev : next));
    };
    evaluate();
    window.addEventListener("scroll", evaluate, { passive: true });
    const id = window.setInterval(evaluate, 500);
    return () => {
      window.removeEventListener("scroll", evaluate);
      window.clearInterval(id);
    };
  }, []);

  // Post-processing is built but held off: the scene pass renders to a texture
  // without an alpha channel, so the transparent canvas comes back as opaque
  // black and buries the light background. Effects stays wired and fail-safe;
  // flip this on once the pass preserves alpha.
  const POST_PROCESSING = false;
  const effectTier: "full" | "light" | "off" = !POST_PROCESSING || quality.reduced
    ? "off"
    : quality.fx
      ? "full"
      : "light";

  return (
    // Hidden outright when the shell is paused: `frameloop="never"` stops
    // useFrame, so whatever the pointer's last state was would otherwise stay
    // frozen on screen (e.g. after a jump-scroll straight past the hero).
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: active ? 1 : 0 }}
      aria-hidden
    >
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={quality.dpr}
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={createRenderer}
      >
        <ScrollBridge scroll={scroll} />
        <Lighting dark={dark} />
        <ParticleField count={quality.particles} dark={dark} active={active} />
        <Suspense fallback={null}>
          <WordDriver dark={dark} glass={glass} scroll={scroll} />
        </Suspense>
        <PointerObject />
        <Effects tier={effectTier} />
      </Canvas>
    </div>
  );
}
