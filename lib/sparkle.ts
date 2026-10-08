"use client";

import * as THREE from "three";

/**
 * Procedural sparkle maps: a blurred noise height field expanded into a fine
 * normal map (micro glints) and a roughness map (frosted variation), so the
 * glass reads like the speckled/iridescent surface rather than flat gloss.
 */
function smooth(field: Float32Array, size: number, passes: number): Float32Array {
  // Annotated so the src/dst swap below keeps a single compatible type.
  let src: Float32Array = field;
  let dst: Float32Array = new Float32Array(field.length);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = y * size + x;
        const l = src[y * size + ((x - 1 + size) % size)];
        const r = src[y * size + ((x + 1) % size)];
        const u = src[((y - 1 + size) % size) * size + x];
        const d = src[((y + 1) % size) * size + x];
        dst[i] = (src[i] * 4 + l + r + u + d) / 8;
      }
    }
    const t = src;
    src = dst;
    dst = t;
  }
  return src;
}

export type SparkleMaps = {
  roughnessMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
};

export function createSparkleMaps(size = 512, repeat = 6): SparkleMaps {
  const raw = new Float32Array(size * size);
  for (let i = 0; i < raw.length; i++) raw[i] = Math.random();
  const h = smooth(raw, size, 2);

  const rc = document.createElement("canvas");
  rc.width = rc.height = size;
  const rctx = rc.getContext("2d")!;
  const rdata = rctx.createImageData(size, size);

  const nc = document.createElement("canvas");
  nc.width = nc.height = size;
  const nctx = nc.getContext("2d")!;
  const ndata = nctx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const l = h[y * size + ((x - 1 + size) % size)];
      const r = h[y * size + ((x + 1) % size)];
      const u = h[((y - 1 + size) % size) * size + x];
      const d = h[((y + 1) % size) * size + x];

      const dx = (r - l) * 7;
      const dy = (d - u) * 7;
      const len = Math.hypot(dx, dy, 1);

      ndata.data[i * 4] = ((-dx / len) * 0.5 + 0.5) * 255;
      ndata.data[i * 4 + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      ndata.data[i * 4 + 2] = (1 / len) * 0.5 * 255 + 127.5;
      ndata.data[i * 4 + 3] = 255;

      const v = Math.round(70 + h[i] * 170);
      rdata.data[i * 4] = v;
      rdata.data[i * 4 + 1] = v;
      rdata.data[i * 4 + 2] = v;
      rdata.data[i * 4 + 3] = 255;
    }
  }

  rctx.putImageData(rdata, 0, 0);
  nctx.putImageData(ndata, 0, 0);

  const roughnessMap = new THREE.CanvasTexture(rc);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(repeat, repeat);
  roughnessMap.colorSpace = THREE.NoColorSpace;

  const normalMap = new THREE.CanvasTexture(nc);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(repeat, repeat);
  normalMap.colorSpace = THREE.NoColorSpace;

  return { roughnessMap, normalMap };
}
