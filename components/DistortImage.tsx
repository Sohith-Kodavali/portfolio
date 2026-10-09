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
  uniform float uCurl;
  uniform float uDevelop;
  uniform float uReveal;   // 0 -> 1 hover progress
  uniform float uCellPx;   // dot-matrix cell size, in device pixels

  /**
   * Dot-matrix hover reveal.
   *
   * The screen is divided into fixed-size cells and a square grows inside each
   * one, within a radius that expands from the centre of the card. Underneath
   * the mask the image swaps to a lifted duotone version of itself, so hovering
   * reads as the picture changing state rather than just brightening.
   *
   * The cell grid is measured in *screen* space, not card space — that is what
   * makes the squares stay a constant size across cards of different widths,
   * and what makes the pattern line up as it spreads between them.
   *
   * No fwidth() here: this is a WebGL1 context and derivatives need an extension,
   * so the edge uses a fixed anti-alias width instead.
   */
  vec4 applyDotReveal(vec2 screenUv, vec2 localUv, vec3 base) {
    vec2 cellSizeUv = vec2(max(2.0, uCellPx)) / max(uRes, vec2(1.0));
    vec2 cellUv = fract(screenUv / cellSizeUv);
    float squareDist = max(abs(cellUv.x - 0.5), abs(cellUv.y - 0.5));

    // Card aspect, so the expanding radius stays circular on a 16:9 card.
    float cardAspect = uRes.x / max(uRes.y, 1.0);
    vec2 centered = localUv * 2.0 - 1.0;
    centered.x *= cardAspect;
    float distToCenter = length(centered);
    float maxRadius = length(vec2(cardAspect, 1.0));

    float progress = clamp(uReveal, 0.0, 1.0);
    float radius = progress * (maxRadius + 0.12);
    float grow = 1.0 - smoothstep(radius - 0.12, radius + 0.12, distToCenter);
    grow *= step(0.0001, progress);

    float extent = mix(0.0, 0.5, grow);
    float aa = 0.01;
    float mask = 1.0 - smoothstep(extent - aa, extent + aa, squareDist);

    // The lifted layer: a cool duotone built from the image's own luminance.
    float lum = dot(base, vec3(0.2126, 0.7152, 0.0722));
    vec3 duotone = mix(vec3(0.04, 0.13, 0.38), vec3(0.66, 0.85, 1.0), lum);

    return vec4(mix(base, duotone, mask * progress), 1.0);
  }

  // Scroll-speed bend. A semicircular profile means the middle of the image
  // barely moves while the top and bottom bow horizontally — so the picture
  // flexes like a sheet rather than accumulating distortion with distance
  // travelled. (Technique from the haoqi.design build write-up.)
  vec2 applyCurl(vec2 uv) {
    float centered = 2.0 * uv.y - 1.0;
    float profile = 1.0 - sqrt(max(0.0, 1.0 - centered * centered));
    float uvScale = 1.0 - profile * uCurl;
    return vec2((uv.x - 0.5) * uvScale + 0.5, uv.y);
  }

  // Film-negative to full colour as the image arrives: it "develops" rather
  // than simply appearing.
  vec3 applyDevelop(vec3 rgb) {
    return mix(1.0 - rgb, rgb, clamp(uDevelop, 0.0, 1.0));
  }

  // Replicates object-fit: cover. The visible plane shows only a *sub-range* of
  // the texture, so the range has to be narrowed (multiplied), never widened.
  vec2 coverUv(vec2 uv) {
    float planeAspect = uRes.x / max(uRes.y, 1.0);
    if (planeAspect > uTexAspect) {
      float s = uTexAspect / planeAspect;
      uv.y = (uv.y - 0.5) * s + 0.5;
    } else {
      float s = planeAspect / max(uTexAspect, 0.0001);
      uv.x = (uv.x - 0.5) * s + 0.5;
    }
    return uv;
  }

  void main() {
    vec2 uv = vUv;
    vec2 suv = applyCurl(coverUv(uv));

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

    gl_FragColor = vec4(applyDevelop(col), 1.0);
    gl_FragColor = applyDotReveal(uv, uv, gl_FragColor.rgb);
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
  // Device pixel ratio, shared so the dot-matrix cell size can be expressed in
  // the same units as the drawing buffer.
  const dprRef = useRef(1);
  const state = useRef({
    mx: 0.5,
    my: 0.5,
    tx: 0.5,
    ty: 0.5,
    vx: 0,
    vy: 0,
    hover: 0,
    target: 0,
    // Scroll-speed bend: last scroll position and the smoothed strength.
    lastScrollY: null as number | null,
    curl: 0,
    // Film-develop progress as the card arrives.
    develop: 0,
    developTarget: 0,
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
        uTime: gl.getUniformLocation(program, "uTime"),
        uCurl: gl.getUniformLocation(program, "uCurl"),
        uDevelop: gl.getUniformLocation(program, "uDevelop"),
        uReveal: gl.getUniformLocation(program, "uReveal"),
        uCellPx: gl.getUniformLocation(program, "uCellPx")
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
      dprRef.current = dpr;
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
    let lastFrameTime = performance.now();

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

      const now = performance.now();
      // Clamped: a backgrounded tab waking up would otherwise report one huge
      // frame and spike the curl to maximum.
      const dt = Math.min(Math.max((now - lastFrameTime) / 1000, 1 / 240), 0.1);
      lastFrameTime = now;

      const k = 0.16;
      const px = s.mx;
      const py = s.my;
      s.tx += (px - s.tx) * k;
      s.ty += (py - s.ty) * k;
      s.vx = s.vx * 0.9 + (px - s.tx) * 0.6;
      s.vy = s.vy * 0.9 + (py - s.ty) * 0.6;
      s.hover += (s.target - s.hover) * 0.08;

      // Scroll speed -> bend. Fast attack, slow release: a trackpad reports
      // dozens of tiny velocity spikes per gesture, and without the asymmetric
      // smoothing those read as visual noise rather than as speed.
      const scrollY = window.scrollY;
      const velocity =
        s.lastScrollY === null ? 0 : Math.abs(scrollY - s.lastScrollY) / dt;
      s.lastScrollY = scrollY;
      const curlTarget = Math.min(Math.max(velocity / 1400, 0), 1);
      const tau = curlTarget > s.curl ? 0.025 : 0.175;
      s.curl += (curlTarget - s.curl) * (1 - Math.exp(-dt / tau));

      // Develop on arrival, reset once fully out of frame.
      s.develop += (s.developTarget - s.develop) * Math.min(1, dt / 0.8);

      gl.useProgram(c.program);
      gl.uniform2f(c.uniforms.uRes, cv.width, cv.height);
      gl.uniform2f(c.uniforms.uMouse, s.tx, 1 - s.ty);
      gl.uniform2f(c.uniforms.uVel, s.vx, -s.vy);
      gl.uniform1f(c.uniforms.uHover, s.hover);
      gl.uniform1f(c.uniforms.uTime, now / 1000);
      // 0.06 was far too subtle to read as a bend — 6% compression at the extreme
      // top and bottom, over an image that is mostly middle. This is a visible
      // amount while still reading as a flex rather than a warp.
      gl.uniform1f(c.uniforms.uCurl, s.curl * 0.22);
      gl.uniform1f(c.uniforms.uDevelop, s.develop);
      gl.uniform1f(c.uniforms.uReveal, s.hover);
      // Cell size in the same device pixels as uRes, or the squares would scale
      // with the display's pixel ratio.
      gl.uniform1f(c.uniforms.uCellPx, 13 * dprRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Stop once hover, bend and develop have all settled — otherwise keep
      // running, so a scroll can bend the image without the pointer being over
      // it.
      const settled =
        s.hover < 0.002 &&
        s.curl < 0.001 &&
        Math.abs(s.develop - s.developTarget) < 0.002 &&
        s.target === 0;
      if (settled) {
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

    // Scroll has to be able to drive the bend without the pointer being over the
    // card, so it also wakes the loop.
    const onScroll = () => start();

    // Develop on arrival; reset once the card is fully out of frame so it plays
    // again on the next visit rather than staying developed forever.
    const io = new IntersectionObserver(
      ([entry]) => {
        s.developTarget = entry.isIntersecting ? 1 : 0;
        start();
      },
      { threshold: 0.15 }
    );
    io.observe(el);

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointermove", onMove);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      io.disconnect();
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
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
