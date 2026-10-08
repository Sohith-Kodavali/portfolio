"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ShellCanvas = dynamic(() => import("./ShellCanvas"), { ssr: false });

const Placeholder = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 bg-ink" aria-hidden />
);

/**
 * Mounts the WebGL shell only on the client. Rendering the same placeholder on
 * the server and on the first client render avoids a hydration mismatch.
 */
export default function ShellCanvasLazy() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <Placeholder />;
  return <ShellCanvas />;
}
