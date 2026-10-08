"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
// FontLoader reads a pre-baked typeface JSON (see scripts/make-font.mjs, `pnpm
// font`). TTFLoader is deliberately not used: as of r186 it imports opentype.js
// from a jsDelivr URL, which webpack cannot resolve and which fails the build.
// The JSON is also subsetted to these six glyphs — ~6 KB against a 322 KB TTF,
// with no runtime font parsing.
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { createSparkleMaps } from "@/lib/sparkle";

// A rounded brush script. Its rounded strokes give the inflated, tubular read.
const FONT_URL = "/fonts/pacifico-sohith.json";
const WORD = "sohith";
const NORMAL_SCALE = new THREE.Vector2(0.5, 0.5);

export default function WordText({
  dark,
  y,
  glass = true
}: {
  dark: boolean;
  y: number;
  glass?: boolean;
}) {
  const inner = useRef<THREE.Group>(null);
  const hover = useRef(0);
  const wobble = useRef({ value: 0 });
  const { pointer } = useThree();

  const font = useLoader(FontLoader, FONT_URL);

  const shaped = useMemo(() => {
    const geo = new TextGeometry(WORD, {
      font,
      size: 1.15,
      depth: 0.2,
      curveSegments: 32,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.06,
      bevelOffset: 0,
      bevelSegments: 12
    });
    geo.center();
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    const box = geo.boundingBox;
    const h = box ? box.max.y - box.min.y : 1;
    return { geometry: geo, height: h };
  }, [font]);

  const sparkle = useMemo(() => createSparkleMaps(512, 7), []);

  // Liquid read comes from the surface, not the silhouette: the roughness and
  // normal maps drift against each other so the highlight crawls across the
  // metal. (Patching the standard vertex shader to displace geometry did not
  // survive compilation, so this stays inside documented material properties.)
  const liquidRef = useRef<THREE.MeshPhysicalMaterial | null>(null);

  useFrame((state, delta) => {
    const g = inner.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    wobble.current.value = t;

    if (liquidRef.current) {
      const m = liquidRef.current;
      m.roughnessMap!.offset.set(Math.sin(t * 0.11) * 0.05, t * 0.012);
      m.normalMap!.offset.set(Math.cos(t * 0.09) * 0.05, -t * 0.015);
      const s = 0.45 + Math.sin(t * 0.5) * 0.12;
      m.normalScale.set(s, s);
    }

    const k = Math.min(1, delta * 4);
    const tx = THREE.MathUtils.clamp(pointer.x, -1, 1);
    const ty = THREE.MathUtils.clamp(pointer.y, -1, 1);

    // subtle 3D tilt + sway driven by the pointer
    g.rotation.y += (tx * 0.4 - g.rotation.y) * k;
    g.rotation.x += (-ty * 0.26 - g.rotation.x) * k;
    g.position.x += (tx * 0.16 - g.position.x) * k;
    g.position.y += (ty * 0.1 + Math.sin(t * 0.6) * 0.04 - g.position.y) * k;

    const near = Math.abs(tx) < 0.75 && Math.abs(ty) < 0.6 ? 1 : 0;
    hover.current += (near - hover.current) * k;
    g.scale.setScalar(1 + hover.current * 0.03);
  });

  const h = shaped.height;

  return (
    <group position={[0, y, 0]}>
      <group ref={inner}>
        <mesh geometry={shaped.geometry}>
          <meshPhysicalMaterial
            ref={liquidRef}
            color="#92b5f6"
            // Glass, not chrome. Full metal was tried and rejected: on a light
            // page it reads as flat silver in a light environment, or goes dark
            // in a contrasting one and fights the black headline.
            metalness={0}
            roughness={0.22}
            transmission={glass ? 0.85 : 0}
            ior={1.2}
            thickness={2}
            clearcoat={1}
            clearcoatRoughness={0.08}
            envMapIntensity={1.5}
            iridescence={1}
            iridescenceIOR={1.4}
            iridescenceThicknessRange={[100, 1400]}
            roughnessMap={sparkle.roughnessMap}
            normalMap={sparkle.normalMap}
            normalScale={NORMAL_SCALE}
          />
        </mesh>

        {/* Floor reflection: the same form mirrored below itself and faded, so
            the word sits on a glossy surface instead of floating. */}
        <mesh geometry={shaped.geometry} position={[0, -h, 0]} scale={[1, -1, 1]}>
          <meshPhysicalMaterial
            color={dark ? "#8fa4c4" : "#b9c8de"}
            metalness={1}
            roughness={0.18}
            envMapIntensity={1.4}
            transparent
            opacity={0.07}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
