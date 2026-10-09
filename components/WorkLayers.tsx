"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  float,
  length,
  max,
  mix,
  min,
  uniform,
  vec2,
  vec3,
  vec4,
  uv,
  abs,
  clamp,
  dot,
  fract,
  smoothstep,
  sqrt,
  step,
  texture
} from "three/tsl";
import { THREE } from "@/lib/webgpu";
import { getScrollY } from "@/lib/scroll";
import { DomRectSampler } from "@/lib/domRects";
import { projects } from "@/lib/data";

/**
 * Scroll-speed curl, matching the recovered production constants: the image
 * flexes along the horizontal axis in response to speed rather than
 * accumulating distortion with distance, and relaxes back to flat on release.
 */
const CURL_VELOCITY = 800;
const CURL_ATTACK = 0.025;
const CURL_RELEASE = 0.175;
const CURL_MAX = 0.06;
/** Image "develops" from negative to colour over this long on viewport entry. */
const DEVELOP_DURATION = 0.8;
/** Hover dot-matrix reveal duration per card. */
const HOVER_DURATION = 0.42;
/** Dot-matrix cell size, CSS px. */
const CELL_PX = 18;

type Layer = {
  material: THREE.MeshBasicNodeMaterial;
  geometry: THREE.PlaneGeometry;
  uniforms: {
    uCurl: { value: number };
    uDevelop: { value: number };
    uHover: { value: number };
    uCellPx: { value: number };
    uCardPx: { value: THREE.Vector2 };
  };
};

type Runtime = { progress: number; hover: number };

const easeInOutCubic = (v: number) => (v < 0.5 ? 4 * v ** 3 : 1 - (-2 * v + 2) ** 3 / 2);

/** Rasterises a work image (SVG or raster) into a texture the shell can sample. */
async function loadWorkTexture(url: string) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.decoding = "async";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`work image failed: ${url}`));
    image.src = url;
  });
  const width = image.naturalWidth || 1600;
  const height = image.naturalHeight || 1200;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.drawImage(image, 0, 0, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return { tex, aspect: width / height };
}

/**
 * One fullscreen-quad material per card, sampling the image through a
 * scroll-driven curl, a develop-on-entry polarity and a dot-matrix hover reveal.
 *
 * Everything is a TSL node graph, not GLSL, so it compiles to WGSL on the WebGPU
 * backend and GLSL on the WebGL2 fallback. A raw ShaderMaterial would render on
 * one backend and silently produce nothing on the other.
 */
function makeLayer(map: THREE.Texture, texAspect: number): Layer {
  const uCurl = uniform(0);
  const uDevelop = uniform(0);
  const uHover = uniform(0);
  const uCellPx = uniform(CELL_PX);
  const uCardPx = uniform(new THREE.Vector2(1, 1));

  const local = uv();
  const cardAspect = uCardPx.x.div(uCardPx.y);

  // object-fit: cover — narrow the sampled range, never widen it.
  const coverScale = vec2(
    min(float(1), cardAspect.div(texAspect)),
    min(float(1), float(texAspect).div(cardAspect))
  );
  const cover = local.sub(0.5).mul(coverScale).add(0.5);

  // Semicircular profile: the middle of the image barely moves, the top and
  // bottom bow — a flex rather than a warp.
  const centered = cover.y.mul(2).sub(1);
  const profile = float(1).sub(sqrt(max(float(0), float(1).sub(centered.mul(centered)))));
  const uvScale = float(1).sub(profile.mul(uCurl));
  const curled = vec2(cover.x.sub(0.5).mul(uvScale).add(0.5), cover.y);

  const base = texture(map, clamp(curled, vec2(0.002), vec2(0.998)));

  // Negative → colour develops on entry.
  const developed = mix(vec3(1).sub(base.rgb), base.rgb, clamp(uDevelop, 0, 1));

  // Dot-matrix hover: a square grows inside each screen-space cell within a
  // radius that expands from the card centre.
  const cell = fract(local.mul(uCardPx).div(max(uCellPx, float(2))));
  const squareDist = max(abs(cell.x.sub(0.5)), abs(cell.y.sub(0.5)));
  const c = local.mul(2).sub(1);
  const distToCenter = length(vec2(c.x.mul(cardAspect), c.y));
  const maxRadius = length(vec2(cardAspect, 1));
  const hp = clamp(uHover, 0, 1);
  const radius = hp.mul(maxRadius.add(0.12));
  const grow = float(1).sub(smoothstep(radius.sub(0.12), radius.add(0.12), distToCenter)).mul(step(0.0001, hp));
  const extent = mix(float(0), float(0.5), grow);
  const aa = float(0.01);
  const mask = float(1).sub(smoothstep(extent.sub(aa), extent.add(aa), squareDist));

  const lum = dot(developed, vec3(0.2126, 0.7152, 0.0722));
  const duo = mix(vec3(0.04, 0.13, 0.38), vec3(0.66, 0.85, 1.0), lum);
  const rgb = mix(developed, duo, mask.mul(hp));

  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = vec4(rgb, 1);
  material.transparent = false;
  material.depthTest = false;
  material.depthWrite = false;
  material.toneMapped = false;

  const geometry = new THREE.PlaneGeometry(2, 2);
  return { material, geometry, uniforms: { uCurl, uDevelop, uHover, uCellPx, uCardPx } };
}

/**
 * The project images, drawn in the shell instead of on their own canvases.
 *
 * The DOM keeps a transparent placeholder for each card; the drawing happens
 * here, once, in the shared WebGPU canvas, so the curl is one page-wide effect
 * rather than five unrelated bends and there is only one GL context, not one per
 * card.
 */
export default function WorkLayers() {
  const { camera, size, viewport } = useThree();
  const [images, setImages] = useState<Array<{ tex: THREE.Texture; aspect: number }>>([]);
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const sampler = useRef(new DomRectSampler());
  const meshes = useRef<Array<THREE.Mesh | null>>([]);
  const curl = useRef(0);
  const lastScroll = useRef<number | null>(null);
  const centre = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    let cancelled = false;
    Promise.all(projects.map((p) => loadWorkTexture(p.image)))
      .then((list) => {
        if (!cancelled) setImages(list);
      })
      .catch((err) => console.warn("[work-layers] textures unavailable; keeping DOM images.", err));
    return () => {
      cancelled = true;
    };
  }, []);

  const layers = useMemo(() => images.map((img) => makeLayer(img.tex, img.aspect)), [images]);
  const runtime = useMemo<Runtime[]>(() => layers.map(() => ({ progress: 0, hover: 0 })), [layers]);

  // Only once the layers exist do we hide the DOM images, so a texture failure
  // leaves the card visible rather than blank.
  useEffect(() => {
    if (layers.length === 0) return;
    const measure = () => sampler.current.reset("[data-media]");
    measure();
    window.addEventListener("resize", measure, { passive: true });
    document.documentElement.classList.add("gpu-work-ready");
    return () => {
      window.removeEventListener("resize", measure);
      document.documentElement.classList.remove("gpu-work-ready");
    };
  }, [layers]);

  useEffect(
    () => () => {
      layers.forEach((layer) => {
        layer.material.dispose();
        layer.geometry.dispose();
      });
      images.forEach((img) => img.tex.dispose());
    },
    [layers, images]
  );

  useFrame((_, frameDelta) => {
    if (layers.length === 0) return;
    const dt = Math.min(Math.max(frameDelta, 1 / 240), 0.1);
    const scrollTop = getScrollY();
    const vh = Math.max(1, window.innerHeight);
    sampler.current.sample(scrollTop, vh);

    // Curl strength from smoothed scroll speed.
    const previous = lastScroll.current;
    lastScroll.current = scrollTop;
    const velocity = previous === null ? 0 : Math.abs(scrollTop - previous) / dt;
    const target = Math.min(Math.max(velocity / CURL_VELOCITY, 0), 1);
    const tau = target > curl.current ? CURL_ATTACK : CURL_RELEASE;
    curl.current += (target - curl.current) * (1 - Math.exp(-dt / tau));
    const curlStrength = curl.current * CURL_MAX;

    const world = viewport.getCurrentViewport(camera, centre.set(0, 0, 0));
    const worldW = world.width;
    const worldH = world.height;

    let index = 0;
    for (const entry of sampler.current.values()) {
      const layer = layers[index];
      const mesh = meshes.current[index];
      const rt = runtime[index];
      index += 1;
      if (!layer || !mesh || !rt || !entry.measured) continue;

      const { left, top, width, height } = entry;
      const near = top + height > -vh * 0.25 && top < vh * 1.25;
      if (!near || width <= 0 || height <= 0) {
        mesh.visible = false;
        rt.progress = 0;
        continue;
      }
      mesh.visible = true;

      const nx = (left + width / 2) / size.width;
      const ny = (top + height / 2) / size.height;
      mesh.position.set((nx - 0.5) * worldW, (0.5 - ny) * worldH, 0);
      mesh.scale.set((width / size.width) * worldW * 0.5, (height / size.height) * worldH * 0.5, 1);

      const hovered = entry.el.closest(".group")?.matches(":hover") ?? false;
      const hoverStep = dt / HOVER_DURATION;
      rt.hover = hovered ? Math.min(1, rt.hover + hoverStep) : Math.max(0, rt.hover - hoverStep);

      const intersects =
        left + width > 0 && left < size.width && top + height > 0 && top < size.height;
      if (!intersects) rt.progress = 0;
      else if (reduced) rt.progress = 1;
      else rt.progress = Math.min(1, rt.progress + dt / DEVELOP_DURATION);

      const u = layer.uniforms;
      u.uCurl.value = curlStrength;
      u.uDevelop.value = reduced ? 1 : easeInOutCubic(rt.progress);
      u.uHover.value = 0.5 - 0.5 * Math.cos(Math.PI * rt.hover);
      u.uCardPx.value.set(Math.max(1, width), Math.max(1, height));
    }
  });

  return (
    <>
      {layers.map((layer, i) => (
        <mesh
          key={projects[i]?.slug ?? i}
          ref={(node) => {
            meshes.current[i] = node;
          }}
          geometry={layer.geometry}
          material={layer.material}
          frustumCulled={false}
          renderOrder={20}
          visible={false}
        />
      ))}
    </>
  );
}
