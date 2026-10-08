"use client";

import { useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
// Font/TextGeometry live in three's addons (not the main entry) as of r170.
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { TTFLoader } from "three/examples/jsm/loaders/TTFLoader.js";
import { createSparkleMaps } from "@/lib/sparkle";

// A rounded brush script, parsed into typeface JSON at runtime by three's
// TTFLoader. Its rounded strokes are what gives the inflated, tubular read.
const FONT_URL = "/fonts/Pacifico-Regular.ttf";

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
  const { pointer } = useThree();

  const fontData = useLoader(TTFLoader, FONT_URL);

  const geometry = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const font = new Font(fontData as any);
    const geo = new TextGeometry("sohith", {
      font,
      size: 1.15,
      depth: 0.2,
      curveSegments: 32,
      bevelEnabled: true,
      // Keep the bevel close to a semicircular profile without inflating the
      // strokes so far that neighbouring letters merge into a blob.
      bevelThickness: 0.1,
      bevelSize: 0.06,
      bevelOffset: 0,
      bevelSegments: 12
    });
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }, [fontData]);

  // Generated once on the client; the canvas is client-only so this never runs
  // during SSR.
  const sparkle = useMemo(() => createSparkleMaps(512, 7), []);

  useFrame((state, delta) => {
    const g = inner.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
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

  return (
    <group position={[0, y, 0]}>
      <group ref={inner}>
        <mesh geometry={geometry}>
          <meshPhysicalMaterial
            color="#92b5f6"
            transmission={glass ? 0.85 : 0}
            roughness={0.2}
            ior={1.2}
            thickness={2}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.08}
            envMapIntensity={1.5}
            iridescence={1}
            iridescenceIOR={1.4}
            iridescenceThicknessRange={[100, 1400]}
            sheen={1}
            sheenColor="#dbe8ff"
            sheenRoughness={0.5}
            roughnessMap={sparkle.roughnessMap}
            normalMap={sparkle.normalMap}
            normalScale={new THREE.Vector2(0.55, 0.55)}
            attenuationColor={dark ? "#33456b" : "#b9d2ff"}
            attenuationDistance={1.2}
          />
        </mesh>
      </group>
    </group>
  );
}
