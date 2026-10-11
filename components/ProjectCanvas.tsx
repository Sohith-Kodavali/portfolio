"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useQuality } from "@/lib/quality";

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uAspect;
  uniform vec2  uMouse;
  uniform vec3  uA;
  uniform vec3  uB;
  uniform float uFreq;
  uniform float uWarp;

  float hash(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = vec2(uv.x * uAspect, uv.y);
    float t = uTime * 0.04;
    vec2 m = vec2(uMouse.x * uAspect, uMouse.y);
    float md = distance(p, m);
    p += normalize(p - m + 1e-4) * exp(-md * 3.0) * 0.05;

    vec2 q = vec2(fbm(p * uFreq + vec2(t, -t * 0.7)),
                  fbm(p * uFreq + vec2(3.2 - t * 0.5, 1.7 + t * 0.3)));
    vec2 r = vec2(fbm(p * uFreq + uWarp * q + vec2(1.7 + t * 0.4, 9.2 - t * 0.6)),
                  fbm(p * uFreq + uWarp * q + vec2(8.3 - t * 0.3, 2.8 + t * 0.4)));
    float n = fbm(p * uFreq + uWarp * r);

    float field = smoothstep(0.35, 0.98, n + length(q) * 0.2);
    vec3 col = mix(uB, uA, field * 0.85);
    col = mix(col, uB * 0.4, smoothstep(0.6, 1.0, length(r)) * 0.5);

    float vfall = smoothstep(0.0, 0.4, uv.y);
    col *= mix(0.45, 1.0, vfall);
    float d = distance(uv, vec2(0.5));
    col *= 1.0 - d * 0.5;
    col += (hash(uv * vec2(uAspect, 1.0) * 800.0 + t * 40.0) - 0.5) * 0.03;

    gl_FragColor = vec4(col, 1.0);
  }
`;

type Props = {
  colors: { c1: [number, number, number]; c2: [number, number, number]; freq: number; warp: number };
};

function Plane({ colors }: Props) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const mouse = useRef(new THREE.Vector2(0.5, 0.5));
  const { reduced } = useQuality();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uA: { value: new THREE.Vector3(...colors.c1) },
      uB: { value: new THREE.Vector3(...colors.c2) },
      uFreq: { value: colors.freq },
      uWarp: { value: colors.warp }
    }),
    [colors]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((state, delta) => {
    if (!mat.current) return;
    const u = mat.current.uniforms;
    u.uTime.value = reduced ? 0 : state.clock.elapsedTime;
    u.uAspect.value = state.size.width / Math.max(state.size.height, 1);
    u.uMouse.value.lerp(mouse.current, 1 - Math.pow(0.01, delta));
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment} depthTest={false} depthWrite={false} />
    </mesh>
  );
}

export default function ProjectCanvas({ colors }: Props) {
  const quality = useQuality();
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.16]" aria-hidden>
      <Canvas
        dpr={quality.dpr}
        flat
        gl={{ antialias: false, alpha: false, depth: false, stencil: false }}
        onCreated={({ gl }) => gl.setClearColor("#08080a", 1)}
      >
        <Plane colors={colors} />
      </Canvas>
    </div>
  );
}
