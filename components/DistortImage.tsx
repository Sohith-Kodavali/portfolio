"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const VERT = /* glsl */ `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform vec2  uRes;
  uniform float uTexAspect;
  uniform vec2  uMouse;
  uniform vec2  uVel;
  uniform float uHover;
  uniform float uTime;

  vec2 coverUv(vec2 uv) {
    float planeAspect = uRes.x / max(uRes.y, 1.0);
    if (planeAspect > uTexAspect) {
      float s = uTexAspect / planeAspect;
      uv.y = (uv.y - 0.5) / s + 0.5;
    } else {
      float s = planeAspect / uTexAspect;
      uv.x = (uv.x - 0.5) / s + 0.5;
    }
    return uv;
  }

  void main() {
    vec2 uv = vUv;
    vec2 suv = coverUv(uv);

    vec2 d = uv - uMouse;
    float dist = length(d);
    float falloff = exp(-dist * 7.0);

    // ripple travelling out from the cursor
    float ripple = sin(dist * 26.0 - uTime * 4.5) * falloff * 0.022 * uHover;
    suv += normalize(d + 1e-5) * ripple;

    // directional smear along the pointer's velocity
    suv -= uVel * 0.16 * uHover * falloff;

    // slow idle breathing so it never looks frozen
    suv += vec2(sin(uv.y * 9.0 + uTime * 0.7), cos(uv.x * 8.0 - uTime * 0.6)) * 0.0012 * uHover;

    vec2 s = clamp(suv, 0.002, 0.998);
    vec3 col = texture2D(uTex, s).rgb;

    // chromatic split sells the "liquid lens" read
    float ca = 0.006 * uHover;
    col.r = texture2D(uTex, clamp(s + uVel * ca, 0.002, 0.998)).r;
    col.b = texture2D(uTex, clamp(s - uVel * ca, 0.002, 0.998)).b;

    gl_FragColor = vec4(col, 1.0);
  }
`;

type Ctx = {
  program: WebGLProgram;
  buffer: WebGLBuffer;
  texture: WebGLTexture;
  uniforms: Record<string, WebGLUniformLocation | null>;
};

/**
 * Renders a plain <img> for SSR/SEO, then upgrades to a WebGL surface on first
 * hover so the image ripples and smears under the cursor. The context is built
 * lazily and reused — no WebGL cost at all until someone actually points at it.
 */
export default function DistortImage({
  src,
  alt,
  className
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<Ctx | null>(null);
  const raf = useRef(0);
  const state = useRef({
    mx: 0.5,
    my: 0.5,
    tx: 0.5,
    ty: 0.5,
    vx: 0,
    vy: 0,
    hover: 0,
    target: 0,
    running: false
  });
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof WebGLRenderingContext !== "undefined");
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el || !supported) return;

    const boot = () => {
      if (ctxRef.current) return;
      const cv = canvas.current;
      if (!cv) return;
      const gl = cv.getContext("webgl", {
        antialias: false,
        alpha: false,
        premultipliedAlpha: false,
        powerPreference: "low-power"
      });
      if (!gl) return;

      const compile = (type: number, src: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      };
      const program = gl.createProgram()!;
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(program);
      gl.useProgram(program);

      const buffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW
      );
      const loc = gl.getAttribLocation(program, "aPos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      const texture = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      // 1x1 placeholder until the real pixels land
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([20, 20, 24, 255]));

      const uniforms: Record<string, WebGLUniformLocation | null> = {
        uTex: gl.getUniformLocation(program, "uTex"),
        uRes: gl.getUniformLocation(program, "uRes"),
        uTexAspect: gl.getUniformLocation(program, "uTexAspect"),
        uMouse: gl.getUniformLocation(program, "uMouse"),
        uVel: gl.getUniformLocation(program, "uVel"),
        uHover: gl.getUniformLocation(program, "uHover"),
        uTime: gl.getUniformLocation(program, "uTime")
      };
      gl.uniform1i(uniforms.uTex, 0);

      ctxRef.current = { program, buffer, texture, uniforms };

      // Rasterise through a 2D canvas: SVGs are not reliable as direct textures.
      const image = new Image();
      image.decoding = "async";
      image.src = src;
      image.onload = () => {
        const c = ctxRef.current;
        if (!c) return;
        const w = Math.min(1600, image.naturalWidth || 1600);
        const h = Math.round(w * (image.naturalHeight / Math.max(image.naturalWidth, 1))) || 900;
        const off = document.createElement("canvas");
        off.width = w;
        off.height = h;
        const octx = off.getContext("2d");
        if (!octx) return;
        octx.drawImage(image, 0, 0, w, h);
        const g = cv.getContext("webgl");
        if (!g) return;
        g.bindTexture(g.TEXTURE_2D, c.texture);
        g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, 1);
        g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, off);
        g.uniform1f(c.uniforms.uTexAspect, w / h);
      };
    };

    const resize = () => {
      const cv = canvas.current;
      if (!cv) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.floor(el.clientWidth * dpr));
      const h = Math.max(1, Math.floor(el.clientHeight * dpr));
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
      }
      const gl = cv.getContext("webgl");
      if (gl) gl.viewport(0, 0, w, h);
    };

    const s = state.current;
    const loop = () => {
      const cv = canvas.current;
      const c = ctxRef.current;
      if (!cv || !c) {
        s.running = false;
        return;
      }
      const gl = cv.getContext("webgl");
      if (!gl) {
        s.running = false;
        return;
      }

      const k = 0.16;
      const px = s.mx;
      const py = s.my;
      s.tx += (px - s.tx) * k;
      s.ty += (py - s.ty) * k;
      s.vx = s.vx * 0.9 + (px - s.tx) * 0.6;
      s.vy = s.vy * 0.9 + (py - s.ty) * 0.6;
      s.hover += (s.target - s.hover) * 0.08;

      gl.useProgram(c.program);
      gl.uniform2f(c.uniforms.uRes, cv.width, cv.height);
      gl.uniform2f(c.uniforms.uMouse, s.tx, 1 - s.ty);
      gl.uniform2f(c.uniforms.uVel, s.vx, -s.vy);
      gl.uniform1f(c.uniforms.uHover, s.hover);
      gl.uniform1f(c.uniforms.uTime, performance.now() / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // stop once the effect has fully settled and the pointer is gone
      if (s.hover < 0.002 && s.target === 0) {
        s.running = false;
        if (canvas.current) canvas.current.style.opacity = "0";
        return;
      }
      raf.current = requestAnimationFrame(loop);
    };

    const start = () => {
      if (s.running) return;
      s.running = true;
      boot();
      resize();
      if (canvas.current) canvas.current.style.opacity = "1";
      raf.current = requestAnimationFrame(loop);
    };

    const onEnter = () => {
      s.target = 1;
      start();
    };
    const onLeave = () => {
      s.target = 0;
      start();
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      s.mx = (e.clientX - r.left) / Math.max(r.width, 1);
      s.my = (e.clientY - r.top) / Math.max(r.height, 1);
      start();
    };

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointermove", onMove);
    window.addEventListener("resize", resize);

    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf.current);
    };
  }, [src, supported]);

  return (
    <div ref={wrap} className={cn("relative h-full w-full", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover" />
      {supported && (
        <canvas
          ref={canvas}
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300"
        />
      )}
    </div>
  );
}
