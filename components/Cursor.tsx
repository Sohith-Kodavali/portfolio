"use client";

import { useEffect, useRef, useState } from "react";
import { onTick } from "@/lib/ticker";

export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;
    setEnabled(true);

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let cx = mx;
    let cy = my;
    let settled = false;

    const move = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      settled = false;
      if (ring.current) ring.current.style.opacity = "1";
    };
    const down = () => setPressed(true);
    const up = () => setPressed(false);
    const leave = () => {
      if (ring.current) ring.current.style.opacity = "0";
    };

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    document.addEventListener("mouseleave", leave);

    // On the shared ticker, and it stops writing once the lerp has caught up
    // with the pointer — this used to re-write two transforms every frame for
    // the whole life of the page, including while the mouse was completely still.
    const stopTick = onTick(() => {
      if (settled) return;

      cx += (mx - cx) * 0.16;
      cy += (my - cy) * 0.16;
      if (Math.abs(mx - cx) < 0.05 && Math.abs(my - cy) < 0.05) {
        cx = mx;
        cy = my;
        // One last write at the exact position, then park until the next move.
        if (ring.current) {
          ring.current.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
        }
        if (dot.current) {
          dot.current.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
        }
        settled = true;
        return;
      }

      if (ring.current) {
        ring.current.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      }
      if (dot.current) {
        dot.current.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      }
    });

    const enter = (e: Event) => {
      const el = e.currentTarget as HTMLElement;
      const text = el.dataset.cursor ?? "";
      setActive(true);
      if (label.current) label.current.textContent = text;
    };
    const clear = () => {
      setActive(false);
      if (label.current) label.current.textContent = "";
    };

    // Coalesced: this used to run querySelectorAll over the whole document on
    // *every* DOM mutation, and this page mutates constantly (GSAP, scroll
    // reveals, route changes). Collapsing a burst into one pass per frame keeps
    // the cost honest.
    let attaching = false;
    const attach = () => {
      attaching = false;
      document.querySelectorAll<HTMLElement>("a, button, [data-cursor]").forEach((el) => {
        if (el.dataset.cursorBound === "1") return;
        el.dataset.cursorBound = "1";
        el.addEventListener("mouseenter", enter);
        el.addEventListener("mouseleave", clear);
      });
    };
    const scheduleAttach = () => {
      if (attaching) return;
      attaching = true;
      requestAnimationFrame(attach);
    };

    attach();
    const obs = new MutationObserver(scheduleAttach);
    obs.observe(document.body, { childList: true, subtree: true });

    return () => {
      stopTick();
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      document.removeEventListener("mouseleave", leave);
      obs.disconnect();
    };
  }, []);

  if (!enabled) return null;

  const size = active ? 92 : pressed ? 30 : 42;

  return (
    <>
      <div
        ref={ring}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[400] grid place-items-center rounded-full opacity-0 transition-[width,height,background-color,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          width: size,
          height: size,
          border: active ? "0px solid transparent" : "1px solid rgba(243,239,230,0.55)",
          backgroundColor: active ? "var(--color-accent)" : "transparent",
          mixBlendMode: active ? "normal" : "difference",
          willChange: "transform, width, height"
        }}
      >
        <span
          ref={label}
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink"
          style={{ opacity: active ? 1 : 0, transition: "opacity .2s" }}
        />
      </div>
      <div
        ref={dot}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[401] size-[5px] rounded-full bg-bone opacity-0"
        style={{ willChange: "transform" }}
      />
    </>
  );
}
