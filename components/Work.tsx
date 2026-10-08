"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { projects } from "@/lib/data";
import { setThemeFromProject, clearTheme } from "@/lib/theme";
import MorphHeading from "./MorphHeading";
import Reveal from "./Reveal";
import DistortImage from "./DistortImage";
import Parallax from "./Parallax";

export default function Work() {
  const list = useRef<HTMLDivElement>(null);

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
          <MorphHeading className="col-span-12 t-lg lg:col-span-8" wdthFrom={98} wdthTo={120}>
            Work built to make the right people stop.
          </MorphHeading>
        </header>
      </Parallax>

      <div ref={list} onMouseLeave={clearTheme} className="flex flex-col gap-[14vh]">
        {projects.map((p, i) => {
          const card = (
            <>
              <div
                data-media
                className="ph relative aspect-[16/9] w-full overflow-hidden"
                data-label={`${p.name} — image placeholder`}
              >
                <div className="absolute inset-0 transition-transform duration-[1.4s] ease-[cubic-bezier(.66,0,.01,1)] group-hover:scale-[1.06]">
                  <DistortImage src={p.image} alt={`${p.name} — ${p.category}`} />
                </div>
                {p.url && (
                  <span className="absolute top-5 right-5 font-mono text-[10px] uppercase tracking-[0.14em] text-bone/70 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    Visit site ↗
                  </span>
                )}
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
            </>
          );

          const className = `group block ${i % 2 === 1 ? "lg:pl-[10%]" : ""}`;
          const onMouseEnter = () => setThemeFromProject(p.colors);

          // Projects with a live URL open it in a new tab; one without stays a
          // plain card rather than becoming a dead link.
          return p.url ? (
            <a
              key={p.slug}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              data-row
              onMouseEnter={onMouseEnter}
              data-cursor="Visit site"
              aria-label={`${p.name} — open the live site in a new tab`}
              className={className}
            >
              {card}
            </a>
          ) : (
            <div key={p.slug} data-row onMouseEnter={onMouseEnter} className={className}>
              {card}
            </div>
          );
        })}
      </div>

      <Reveal className="mt-[10vh] flex justify-end">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          Every project opens the live site — in a new tab
        </span>
      </Reveal>
    </section>
  );
}
