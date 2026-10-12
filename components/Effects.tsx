"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three/webgpu";
import { clamp, dot, float, mix, pass, pow, screenUV, uniform, vec2, vec3, vec4 } from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { film } from "three/addons/tsl/display/FilmNode.js";
import { stage } from "@/lib/zoom";

export type EffectTier = "full" | "light" | "off";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type N = any;

/**
 * Six-ray star flare, ported from the reference's post-process.
 *
 * It isolates the brightest pixels and lays three star axes over them, so the
 * glass highlights read as something filmed through a lens rather than a clean
 * render. Only bright sources contribute (high threshold, gated), which is what
 * keeps it from frosting the whole frame.
 */
function starFlare(beauty: N, texel: N, tail: N): N {
  const bright = (uvNode: N): N => {
    const colour = beauty.sample(uvNode);
    const luma = dot(colour.rgb, vec3(0.2126, 0.7152, 0.0722));
    const value = clamp(luma.sub(0.99).div(0.01), 0, 1);
    const smooth = value.mul(value).mul(float(3).sub(value.mul(2)));
    const gate = clamp(smooth.sub(0.88).div(0.12), 0, 1);
    return colour.mul(smooth.mul(gate));
  };

  const axis = (dx: number, dy: number): N => {
    let accumulated: N = vec3(0, 0, 0);
    for (let index = 1; index <= 5; index++) {
      const distance = float(index * 1.5);
      const weight = float(1).div(float(1).add(distance.mul(0.22)));
      const ramp = mix(vec3(1, 1, 1), tail, pow(clamp(distance.div(5), 0, 1), float(0.5)));
      // texel * streak scale (8) * distance, projected onto one axis.
      const offset = vec2(texel.x.mul(8).mul(dx).mul(distance), texel.y.mul(8).mul(dy).mul(distance));
      accumulated = accumulated.add(bright(screenUV.add(offset)).mul(weight.mul(weight).mul(ramp)));
      accumulated = accumulated.add(bright(screenUV.sub(offset)).mul(weight.mul(weight).mul(ramp)));
    }
    return accumulated;
  };

  // Vertical plus the two ±30° axes give the six rays.
  const c30 = 0.8660254;
  const s30 = 0.5;
  return bright(screenUV)
    .mul(1.2)
    .add(axis(0, 1))
    .add(axis(c30, s30))
    .add(axis(c30, -s30));
}

/**
 * Post-processing, built on three's `RenderPipeline` (renamed from
 * `PostProcessing` in r183 — the old name resolves to a shim that throws when
 * the node graph is built).
 *
 * Before this the site had no post-processing at all: the richness came purely
 * from material properties. Bloom is what makes the wordmark read as a lit
 * object rather than a shaded mesh.
 *
 * TSL, not GLSL, so the same graph compiles to WGSL on WebGPU and GLSL on the
 * WebGL2 fallback.
 *
 * FAIL-SAFE BY DESIGN. This component always takes over rendering (R3F's
 * automatic render is disabled once any useFrame has priority), so if it bailed
 * out silently the canvas would stay black and the whole hero would disappear.
 * Instead it falls back to a plain `gl.render(scene, camera)`, which is exactly
 * what R3F would have done — so the worst case is "no bloom", never "no page".
 */
export default function Effects({ tier }: { tier: EffectTier }) {
  const { gl, scene, camera } = useThree();
  const pipeline = useRef<THREE.RenderPipeline | null>(null);
  const flare = useRef<{ intensity: N; texel: N } | null>(null);

  useEffect(() => {
    pipeline.current = null;
    flare.current = null;
    if (tier === "off") return;

    try {
      // The canvas is transparent and the page's light gradient lives *behind*
      // it, so the pass has to carry alpha through. Without this the scene pass
      // comes back opaque and buries the whole background in black.
      gl.setClearAlpha(0);

      const scenePass = pass(scene, camera);
      const beauty = scenePass.getTextureNode();

      // A wide, soft radius reads as atmosphere; a tight one reads as a cheap
      // filter. The threshold sits high so only real highlights glow — a low
      // threshold bloomed the glass into a soft blob.
      const glow = bloom(beauty, tier === "full" ? 0.34 : 0.2, 0.55, 0.95);

      // Star flare, on the full tier only. Faded out via `intensity` once the
      // hero is gone, so the work section does not pay for its samples.
      const intensity = uniform(1);
      const texel = uniform(new THREE.Vector2(1 / 1920, 1 / 1080));
      const tail = uniform(new THREE.Color("#ffa300"));
      const star =
        tier === "full" ? starFlare(beauty, texel, tail).mul(intensity).mul(0.5) : vec3(0, 0, 0);
      flare.current = { intensity, texel };

      // Film stock last, so the grain sits *on* the image rather than being
      // smeared by anything after it. `film` hands back the FilmNode instance
      // rather than a typed vec4 node, so the swizzle helpers are missing from
      // the type even though it is one at runtime.
      const stock = film(beauty, float(tier === "full" ? 0.13 : 0.07)) as unknown as
        ReturnType<typeof vec4>;

      const p = new THREE.RenderPipeline(gl as never);
      // RGB from the chain; alpha carried through. The bloom and flare sums go
      // into RGB only, never into alpha, or the transparent canvas turns opaque.
      p.outputNode = vec4(stock.rgb.add(glow.rgb).add(star), stock.a);
      pipeline.current = p;
    } catch (err) {
      console.warn("[effects] post-processing unavailable; rendering directly.", err);
      pipeline.current = null;
      flare.current = null;
    }

    return () => {
      pipeline.current = null;
      flare.current = null;
    };
  }, [gl, scene, camera, tier]);

  // Priority 1 replaces R3F's automatic render.
  useFrame(() => {
    const f = flare.current;
    if (f) {
      const size = gl.getDrawingBufferSize(new THREE.Vector2());
      f.texel.value.set(1 / Math.max(1, size.x), 1 / Math.max(1, size.y));
      f.intensity.value = stage.heroExit < 0.99 ? 1 : 0;
    }
    if (pipeline.current) pipeline.current.render();
    else gl.render(scene, camera);
  }, 1);

  return null;
}
