"use client";

// The WebGPU bridge.
//
// Everything in the R3F shell must import three from *this* module rather than
// "three", because three/module.js and three/webgpu.js are two different
// renderer bundles. They do share ./three.core.js, so the core classes (Mesh,
// BufferGeometry, MeshPhysicalMaterial, Shape, …) are the same instances either
// way — the point here is that the WebGPU entry also gives us the node
// materials, PostProcessing and the compute path.
import * as THREE from "three/webgpu";
import * as TSL from "three/tsl";
import { extend, type ThreeToJSXElements } from "@react-three/fiber";

declare module "@react-three/fiber" {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

// Registers the whole three catalogue as JSX elements so node materials and the
// WebGPU classes are usable as <pointsNodeMaterial /> etc.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
extend(THREE as any);

export { THREE, TSL };

/**
 * Async renderer factory for R3F's `gl` prop.
 *
 * WebGPURenderer picks the WebGPU backend when the browser has it and falls back
 * to a WebGL2 backend otherwise, so one code path covers both. That fallback is
 * why the TSL shaders below are written in TSL rather than GLSL: TSL compiles to
 * WGSL on WebGPU and GLSL on WebGL2, whereas a raw GLSL ShaderMaterial would work
 * on one backend and silently produce nothing on the other.
 */
export async function createRenderer(props: Record<string, unknown>) {
  const renderer = new THREE.WebGPURenderer({
    ...props,
    antialias: false,
    alpha: true,
    powerPreference: "high-performance"
  } as never);

  await renderer.init();
  return renderer;
}
