"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gsap, registerGsap } from "@/lib/gsap";
import { projects } from "@/lib/data";
import { setThemeFromProject, clearTheme } from "@/lib/theme";
import MorphHeading from "./MorphHeading";
import Reveal from "./Reveal";
import DistortImage from "./DistortImage";
import Parallax from "./Parallax";

export default function Work() {
  const list = useRef<HTMLDivElement>(null);
  const router = useRouter();

  /**
   * Fly into the image rather than cutting to a new page: a copy of the
   * thumbnail grows from exactly where it sits until it fills the viewport,
   * the route changes behind it, then it dissolves into the case study.
   * Transform-only, so it stays on the compositor.
   */
  const flyIn = (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const media = e.currentTarget.querySelector<HTMLElement>("[data-media]");
    const img = media?.querySelector("img");
    if (!media || !img) return;

    e.preventDefault();
    const rect = media.getBoundingClientRect();
    const src = img.getAttribute("src") ?? "";
    if (!src || rect.width === 0) return;

    const overlay = document.createElement("div");
    overlay.setAttribute("aria-hidden", "true");
    Object.assign(overlay.style, {
      position: "fixed",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      zIndex: "600",
      pointerEvents: "none",
      backgroundImage: `url("${src}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      transformOrigin: "center center",
      willChange: "transform, opacity"
    });
    document.body.appendChild(overlay);

    const scale =
      Math.max(window.innerWidth / rect.width, window.innerHeight / rect.height) * 1.06;
    const dx = window.innerWidth / 2 - (rect.left + rect.width / 2);
    const dy = window.innerHeight / 2 - (rect.top + rect.height / 2);

    gsap
      .timeline({
        onComplete: () => {
          router.push(`/work/${slug}`);
          gsap.to(overlay, {
            autoAlpha: 0,
            duration: 0.45,
            ease: "power2.out",
            onComplete: () => overlay.remove()
          });
        }
      })
      .to(overlay, { x: dx, y: dy, scale, duration: 0.8, ease: "expo.inOut" });
  };

  useEffect(() => {
    registerGsap();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const scope = list.current;
    if (!scope) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-row]").forEach((row) => {
        const media = row.querySelector("[data-media]");
        const tl = gsap.timeline({
          scrollTrigger: { trigger: row, start: "top 82%", once: true }
        });
        tl.fromTo(row, { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: "expo" });
        if (media) {
          tl.fromTo(
            media,
            { clipPath: "inset(14% 8% 14% 8%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo" },
            0
          );
        }
      });
    }, scope);

    return () => ctx.revert();
  }, []);

  return (
    <section id="work" data-grade="none" className="shell pt-[16vh] pb-[8vh]">
      <Parallax speed={0.05}>
      <header className="grid grid-cols-12 gap-x-4 gap-y-6 pb-[12vh]">
        <span className="col-span-12 t-eyebrow lg:col-span-3">Selected work / 01—05</span>
        <MorphHeading className="col-span-12 t-lg lg:col-span-8" wdth={[98, 120]}>
          Work built to make the right people stop.
        </MorphHeading>
      </header>
      </Parallax>

      <div ref={list} onMouseLeave={clearTheme} className="flex flex-col gap-[14vh]">
        {projects.map((p, i) => (
          <Link
            key={p.slug}
            href={`/work/${p.slug}`}
            data-row
            onMouseEnter={() => setThemeFromProject(p.colors)}
            onClick={(e) => flyIn(e, p.slug)}
            data-cursor="View case"
            className={`group block ${i % 2 === 1 ? "lg:pl-[10%]" : ""}`}
          >
            <div
              data-media
              className="ph relative aspect-[16/9] w-full overflow-hidden"
              data-label={`${p.name} — image placeholder`}
            >
              <div className="absolute inset-0 transition-transform duration-[1.4s] ease-[cubic-bezier(.66,0,.01,1)] group-hover:scale-[1.06]">
                <DistortImage src={p.image} alt={`${p.name} — ${p.category}`} />
              </div>
              <span className="absolute top-5 right-5 font-mono text-[10px] uppercase tracking-[0.14em] text-bone/70 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                View case ↗
              </span>
            </div>

            <div className="mt-5 grid grid-cols-12 items-baseline gap-x-4 gap-y-2">
              <span className="col-span-2 font-mono text-[10px] text-muted lg:col-span-1">
                {p.idx}
              </span>
              <h3 className="col-span-10 t-display t-md lg:col-span-5">{p.name}</h3>
              <span className="col-span-8 text-sm text-muted lg:col-span-4 lg:col-start-7">
                {p.category}
              </span>
              <span className="col-span-4 text-right font-mono text-[10px] text-muted lg:col-span-2">
                {p.year}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <Reveal className="mt-[10vh] flex justify-end">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          Full case studies — problem, craft, outcome
        </span>
      </Reveal>
    </section>
  );
}
