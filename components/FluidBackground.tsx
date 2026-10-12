"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  dot,
  float,
  floor,
  fract,
  length,
  mix,
  sin,
  smoothstep,
  uniform,
  uv,
  vec2,
  vec4
} from "three/tsl";
import { THREE } from "@/lib/webgpu";
import { getPointer } from "@/lib/pointer";
import { stage } from "@/lib/zoom";

/** Extra slack past the hero so the field does not pop at the edge. */
const HERO_FADE = 1.15;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type N = any;

/**
 * Hash → value-noise → fbm, all in TSL.
 *
 * The reference builds its background from a chain of six full-screen render
 * passes. This is a single-pass approximation of the same look: cream/blue
 * fragments drifting over a light base, pushed away from the cursor. One pass
 * rather than six render targets keeps it robust — there is nothing here that
 * can leave the canvas black if a pass fails to build.
 */
const hash21 = (p: N): N => fract(sin(dot(p, vec2(127.1, 311.7))).mul(43758.5453));
const noise = (p: N): N => {
  const i: N = floor(p);
  const f: N = fract(p);
  const u: N = f.mul(f).mul(float(3).sub(f.mul(2)));
  const a = hash21(i);
  const b = hash21(i.add(vec2(1, 0)));
  const c = hash21(i.add(vec2(0, 1)));
  const d = hash21(i.add(vec2(1, 1)));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
};
const fbm = (p: N): N =>
  noise(p).mul(0.5).add(noise(p.mul(2.03)).mul(0.25)).add(noise(p.mul(4.01)).mul(0.125));

/**
 * The hero's living backdrop, drawn in the shell instead of CSS.
 *
 * It is the thing the glass refracts, so it has to be inside the same canvas as
 * the wordmark. Kept deliberately pale and low-contrast to sit under the
 * headline without hurting its legibility, and it fades out with the hero so the
 * rest of the page keeps its plain light background.
 */
export default function FluidBackground() {
  const { camera, size, viewport } = useThree();
  const mesh = useRef<THREE.Mesh>(null);
  const centre = useMemo(() => new THREE.Vector3(), []);

  const uniforms = useMemo(
    () => ({
      uTime: uniform(0),
      uPointer: uniform(new THREE.Vector2(0.5, 0.42)),
      uOpacity: uniform(1),
      uAspect: uniform(1),
      uBase: uniform(new THREE.Color("#f2f7ff")),
      uField: uniform(new THREE.Color("#9cc3ff")),
      uWarm: uniform(new THREE.Color("#ffdcae"))
    }),
    []
  );

  const material = useMemo(() => {
    const mat = new THREE.MeshBasicNodeMaterial();
    try {
      const local = uv();
      const aspect = uniforms.uAspect;
      const p = vec2(local.x.mul(aspect), local.y);

      // Push the field away from the pointer, then sample drifting noise.
      const m = vec2(uniforms.uPointer.x.mul(aspect), float(1).sub(uniforms.uPointer.y));
      const md = length(p.sub(m));
      const warped = p.add(p.sub(m).div(md.add(1e-4)).mul(float(0.06)));
      const q = fbm(warped.mul(2.1).add(vec2(uniforms.uTime.mul(0.02), uniforms.uTime.mul(-0.015))));
      const q2 = fbm(warped.mul(1.3).sub(vec2(uniforms.uTime.mul(0.012), uniforms.uTime.mul(0.01))));

      const field = smoothstep(0.32, 0.9, q);
      const warm = smoothstep(0.55, 0.95, q2).mul(0.55);
      let colour: N = mix(uniforms.uBase, uniforms.uField, field);
      colour = mix(colour, uniforms.uWarm, warm);

      // Soft vignette toward the base colour so the frame edges stay light, but
      // keep more of the field's colour than before — the glass needs it.
      const d = length(local.sub(0.5));
      colour = mix(colour, uniforms.uBase, smoothstep(0.5, 1.0, d).mul(0.45));

      mat.colorNode = vec4(colour, uniforms.uOpacity);
    } catch (err) {
      console.warn("[fluid] background unavailable; leaving the plain page.", err);
    }
    mat.transparent = true;
    mat.depthWrite = false;
    mat.depthTest = false;
    mat.toneMapped = false;
    return mat;
  }, [uniforms]);

  useFrame((_, delta) => {
    const g = mesh.current;
    if (!g) return;

    // Size the plane to cover the viewport wherever the camera currently is,
    // and sit it well behind the wordmark so the glass refracts it.
    const worldAtZ = viewport.getCurrentViewport(camera, centre.set(0, 0, -8));
    g.position.set(0, 0, -8);
    g.scale.set(worldAtZ.width / 2, worldAtZ.height / 2, 1);

    uniforms.uTime.value += delta;
    uniforms.uAspect.value = size.width / Math.max(1, size.height);

    const p = getPointer();
    uniforms.uPointer.value.lerp(p.uv, 1 - Math.pow(0.002, delta));

    // Fade out with the hero so the rest of the page keeps its plain background.
    uniforms.uOpacity.value = Math.max(0, 1 - stage.heroExit * HERO_FADE);
    g.visible = uniforms.uOpacity.value > 0.01;
  });

  return (
    <mesh ref={mesh} material={material} frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
