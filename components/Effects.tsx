"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three/webgpu";
import { pass, vec4 } from "three/tsl";
import { float } from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { afterImage } from "three/addons/tsl/display/AfterImageNode.js";
import { film } from "three/addons/tsl/display/FilmNode.js";

export type EffectTier = "full" | "light" | "off";

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

  useEffect(() => {
    pipeline.current = null;
    if (tier === "off") return;

    try {
      // The canvas is transparent and the page's light gradient lives *behind*
      // it, so the pass has to carry alpha through. Without this the scene pass
      // comes back opaque and buries the whole background in black.
      gl.setClearAlpha(0);

      const scenePass = pass(scene, camera);
      const beauty = scenePass.getTextureNode();

      // A wide, soft radius reads as atmosphere; a tight one reads as a cheap
      // filter. The threshold sits high so only real highlights glow.
      const glow = bloom(beauty, tier === "full" ? 0.55 : 0.3, 0.62, 0.82);

      // Feedback trails, so the particle field carries inertia between frames
      // instead of teleporting. Runs on the raw beauty pass rather than through
      // an intermediate texture.
      const trailed = afterImage(beauty, float(tier === "full" ? 0.82 : 0.92));

      // Film stock last, so the grain sits *on* the image rather than being
      // smeared by anything after it. `film` hands back the FilmNode instance
      // rather than a typed vec4 node, so the swizzle helpers are missing from
      // the type even though it is one at runtime.
      const stock = film(trailed, float(tier === "full" ? 0.13 : 0.07)) as unknown as
        ReturnType<typeof vec4>;

      const p = new THREE.RenderPipeline(gl as never);
      // RGB from the chain; alpha carried through. The bloom sum goes into RGB
      // only, never into alpha, or the transparent canvas turns opaque black.
      p.outputNode = vec4(stock.rgb.add(glow.rgb), stock.a);
      pipeline.current = p;
    } catch (err) {
      console.warn("[effects] post-processing unavailable; rendering directly.", err);
      pipeline.current = null;
    }

    return () => {
      pipeline.current = null;
    };
  }, [gl, scene, camera, tier]);

  // Priority 1 replaces R3F's automatic render.
  useFrame(() => {
    if (pipeline.current) pipeline.current.render();
    else gl.render(scene, camera);
  }, 1);

  return null;
}
