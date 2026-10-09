"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { attribute, texture, uniform, uv, vec4 } from "three/tsl";
import { THREE } from "@/lib/webgpu";

/**
 * Colourful sprites drifting behind the wordmark.
 *
 * The glass reads as glass because of what is *behind* it: refraction and
 * dispersion need coloured content to bend. So this is not decoration — it is
 * the content the hero glass refracts. The real site uses twelve hand-drawn
 * stickers; this generates equivalent colourful shapes at runtime so nothing is
 * missing while the real art is pending. Swap `STICKER_SOURCES` for image URLs
 * to drop in real stickers with no other change.
 */
const STICKER_SOURCES: string[] | null = null;

const COLUMNS = 4;
const SPRITE = 128;
const PAD = 6;

const PALETTE: Array<[string, string]> = [
  ["#2f7ef0", "#8fd0ff"],
  ["#ff7a3d", "#ffd07a"],
  ["#ff4d8d", "#ffb3d1"],
  ["#3ddc97", "#b6ffdd"],
  ["#8b5cf6", "#d9c8ff"],
  ["#ffd233", "#fff2a8"],
  ["#00c2ff", "#bdf0ff"],
  ["#ff5252", "#ffc4c4"]
];

function drawSprite(ctx: CanvasRenderingContext2D, index: number, x: number, y: number) {
  const [a, b] = PALETTE[index % PALETTE.length];
  const cx = x + SPRITE / 2;
  const cy = y + SPRITE / 2;
  const grad = ctx.createLinearGradient(x, y, x + SPRITE, y + SPRITE);
  grad.addColorStop(0, a);
  grad.addColorStop(1, b);
  ctx.fillStyle = grad;
  const shape = index % 4;
  if (shape === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, SPRITE * 0.36, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 1) {
    const s = SPRITE * 0.62;
    const r = SPRITE * 0.16;
    ctx.beginPath();
    ctx.roundRect(cx - s / 2, cy - s / 2, s, s, r);
    ctx.fill();
  } else if (shape === 2) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - SPRITE * 0.4);
    ctx.lineTo(cx + SPRITE * 0.38, cy + SPRITE * 0.28);
    ctx.lineTo(cx - SPRITE * 0.38, cy + SPRITE * 0.28);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.lineWidth = SPRITE * 0.16;
    ctx.strokeStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, SPRITE * 0.3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function makeAtlas() {
  const count = PALETTE.length;
  const rows = Math.ceil(count / COLUMNS);
  const cell = SPRITE + PAD;
  const canvas = document.createElement("canvas");
  canvas.width = COLUMNS * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext("2d");
  const uvRects = new Float32Array(count * 4);
  if (!ctx) return { texture: null, uvRects, count };
  for (let i = 0; i < count; i++) {
    const col = i % COLUMNS;
    const row = Math.floor(i / COLUMNS);
    const x = col * cell + PAD / 2;
    const y = row * cell + PAD / 2;
    drawSprite(ctx, i, x, y);
    uvRects[i * 4] = x / canvas.width;
    uvRects[i * 4 + 1] = 1 - (y + SPRITE) / canvas.height;
    uvRects[i * 4 + 2] = SPRITE / canvas.width;
    uvRects[i * 4 + 3] = SPRITE / canvas.height;
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return { texture: tex, uvRects, count };
}

/** Recovered particle settings, rescaled to our scene. */
const COUNT = 18;
const SPAWN_X = 4.2;
const TOP_Y = 3.4;
const FALL_DISTANCE = 6.6;
const BASE_Z = -1.6;
const Z_SPREAD = 1.6;
const SCALE = 0.5;
const FALL_SPEED = 0.55;
const ROTATION_SPEED = 0.8;
const WIND_STRENGTH = 0.55;
const WIND_FREQUENCY = 0.3;

type Particle = {
  x: number;
  y: number;
  z: number;
  startY: number;
  fallSpeed: number;
  rotation: number;
  rotationSpeed: number;
  windPhase: number;
  windAmplitude: number;
  index: number;
  scale: number;
};

export default function StickerField({ dark }: { dark: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const elapsed = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const atlas = useMemo(() => (typeof document === "undefined" ? null : makeAtlas()), []);
  const particles = useRef<Particle[]>([]);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2, 2);
    geo.setAttribute("uvRect", new THREE.InstancedBufferAttribute(new Float32Array(COUNT * 4), 4));
    return geo;
  }, []);

  const material = useMemo(() => {
    const rect = attribute("uvRect", "vec4");
    const atlasUv = rect.xy.add(uv().mul(rect.zw));
    const brightness = uniform(dark ? 0.82 : 1);
    const mat = new THREE.MeshBasicNodeMaterial();
    if (atlas?.texture) {
      const texel = texture(atlas.texture, atlasUv);
      mat.colorNode = vec4(texel.rgb.mul(brightness), texel.a);
    }
    mat.transparent = true;
    mat.depthWrite = false;
    mat.depthTest = false;
    mat.toneMapped = false;
    return mat;
  }, [atlas, dark]);

  useEffect(() => {
    if (!atlas) return;
    particles.current = Array.from({ length: COUNT }, (_, i) => spawn(i, true));
  }, [atlas]);

  useEffect(
    () => () => {
      atlas?.texture?.dispose();
      geometry.dispose();
      material.dispose();
    },
    [atlas, geometry, material]
  );

  useFrame((_, delta) => {
    const inst = mesh.current;
    if (!inst || !atlas) return;
    const dt = Math.min(delta, 0.1);
    elapsed.current += dt;
    const now = elapsed.current;
    const rectAttr = geometry.getAttribute("uvRect") as THREE.InstancedBufferAttribute;

    for (let i = 0; i < particles.current.length; i++) {
      const p = particles.current[i];
      p.y -= p.fallSpeed * dt;
      p.x += Math.sin(now * WIND_FREQUENCY + p.windPhase) * p.windAmplitude * dt;
      p.rotation += p.rotationSpeed * dt;
      if (p.y < TOP_Y - FALL_DISTANCE) particles.current[i] = spawn(i, false);

      const progress = (p.startY - p.y) / FALL_DISTANCE;
      const life = progress < 0.1 ? progress / 0.1 : progress > 0.85 ? (1 - progress) / 0.15 : 1;
      const scale = p.scale * THREE.MathUtils.clamp(life, 0, 1);
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, 0, p.rotation);
      dummy.scale.set(scale, scale, 1);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      const o = p.index * 4;
      rectAttr.setXYZW(i, atlas.uvRects[o], atlas.uvRects[o + 1], atlas.uvRects[o + 2], atlas.uvRects[o + 3]);
    }
    inst.instanceMatrix.needsUpdate = true;
    rectAttr.needsUpdate = true;
  });

  if (!atlas) return null;
  return <instancedMesh ref={mesh} args={[geometry, material, COUNT]} frustumCulled={false} renderOrder={-1} />;
}

function spawn(order: number, scatter: boolean): Particle {
  const startY = TOP_Y - (scatter ? Math.random() * FALL_DISTANCE : 0);
  return {
    x: (Math.random() - 0.5) * SPAWN_X,
    y: startY,
    z: BASE_Z + (Math.random() - 0.5) * Z_SPREAD,
    startY,
    fallSpeed: FALL_SPEED * (0.6 + Math.random() * 0.8),
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * ROTATION_SPEED * 2,
    windPhase: Math.random() * Math.PI * 2,
    windAmplitude: 0.3 + Math.random() * WIND_STRENGTH,
    index: order % 8,
    scale: SCALE * (0.7 + Math.random() * 0.6)
  };
}
